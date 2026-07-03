import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// API admin : statistiques globales + gestion des utilisateurs.
// Réservée au rôle admin.

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const [users, scriptCount, jobCount, recentScripts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        createdAt: true,
        _count: { select: { scripts: true, avatarJobs: true } },
      },
    }),
    prisma.script.count(),
    prisma.avatarJob.count(),
    prisma.script.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        repoName: true,
        platform: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: { userCount: users.length, scriptCount, jobCount },
    users,
    recentScripts,
  });
}

// Changer le rôle d'un utilisateur ou le supprimer
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { userId, action } = await req.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }
  if (userId === session.userId && action !== "promote") {
    return NextResponse.json(
      { error: "Impossible de modifier votre propre compte admin." },
      { status: 400 }
    );
  }

  if (action === "promote" || action === "demote") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: action === "promote" ? "admin" : "user" },
    });
  } else if (action === "delete") {
    await prisma.user.delete({ where: { id: userId } });
  } else {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
