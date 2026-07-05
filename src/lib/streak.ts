import { prisma } from "./db";

// Série d'engagement (streak quotidien) : encourage l'utilisateur à revenir
// chaque jour. La série augmente d'1 par jour consécutif, se remet à 1 après un
// jour manqué. Jour de référence en UTC (AAAA-MM-JJ).

const DAY_LABELS = ["di", "lu", "ma", "me", "je", "ve", "sa"];

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return dayStr(d);
}

export type WeekDay = { date: string; label: string; active: boolean; today: boolean };
export type StreakState = {
  streak: number;
  longestStreak: number;
  activeToday: boolean;
  week: WeekDay[];
  reward?: { milestone: number; bonusDays: number } | null; // palier atteint à ce ping
};

// Paliers de série → jours d'accès premium offerts (fidélité).
export const MILESTONES: { days: number; bonusDays: number }[] = [
  { days: 3, bonusDays: 1 },
  { days: 7, bonusDays: 2 },
  { days: 14, bonusDays: 3 },
  { days: 30, bonusDays: 7 },
];

/** Construit la fenêtre des 7 derniers jours (aujourd'hui inclus). */
async function buildWeek(userId: string, today: string): Promise<WeekDay[]> {
  const start = addDays(today, -6);
  const rows = await prisma.activityDay.findMany({
    where: { userId, date: { gte: start, lte: today } },
    select: { date: true },
  });
  const active = new Set(rows.map((r) => r.date));
  const week: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    const d = new Date(date + "T00:00:00Z");
    week.push({
      date,
      label: DAY_LABELS[d.getUTCDay()],
      active: active.has(date),
      today: date === today,
    });
  }
  return week;
}

/** Lit l'état de la série sans le modifier. */
export async function getStreakState(userId: string): Promise<StreakState> {
  const today = dayStr(new Date());
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, longestStreak: true, lastActiveDate: true },
  });
  // Série expirée si le dernier jour actif n'est ni aujourd'hui ni hier.
  let streak = user?.streak ?? 0;
  const last = user?.lastActiveDate;
  if (last && last !== today && last !== addDays(today, -1)) streak = 0;

  return {
    streak,
    longestStreak: user?.longestStreak ?? 0,
    activeToday: last === today,
    week: await buildWeek(userId, today),
  };
}

/** Enregistre l'activité du jour et met à jour la série. Idempotent par jour.
 *  Récompense les paliers (jours d'accès premium offerts). */
export async function pingStreak(userId: string): Promise<StreakState> {
  const today = dayStr(new Date());
  const yesterday = addDays(today, -1);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      longestStreak: true,
      lastActiveDate: true,
      lastStreakRewardMilestone: true,
      plan: true,
      planExpiresAt: true,
    },
  });
  if (!user) return getStreakState(userId);

  let reward: { milestone: number; bonusDays: number } | null = null;

  if (user.lastActiveDate !== today) {
    const newStreak = user.lastActiveDate === yesterday ? user.streak + 1 : 1;
    const longest = Math.max(user.longestStreak, newStreak);

    // Palier atteint (le plus élevé non encore récompensé) ?
    const hit = MILESTONES.find(
      (m) => newStreak >= m.days && m.days > user.lastStreakRewardMilestone
    );

    const data: any = { streak: newStreak, longestStreak: longest, lastActiveDate: today };
    if (hit) {
      reward = { milestone: hit.days, bonusDays: hit.bonusDays };
      const base =
        user.planExpiresAt && user.planExpiresAt > new Date()
          ? user.planExpiresAt
          : new Date();
      data.lastStreakRewardMilestone = hit.days;
      data.plan = user.plan === "decouverte" ? "createur" : user.plan;
      data.planExpiresAt = new Date(base.getTime() + hit.bonusDays * 86_400_000);
      data.subscriptionStatus = "active";
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data }),
      prisma.activityDay.upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today },
        update: {},
      }),
    ]);
  }

  return { ...(await getStreakState(userId)), reward };
}
