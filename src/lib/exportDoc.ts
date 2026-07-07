"use client";

// Export d'un texte (script) en fichier Word (.doc) ou PDF — 100 % côté
// navigateur, sans dépendance. Word : blob HTML que Word ouvre nativement.
// PDF : fenêtre d'impression stylée → « Enregistrer au format PDF ».

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(content: string): string {
  return content
    .split("\n")
    .map((l) => `<p>${escapeHtml(l) || "&nbsp;"}</p>`)
    .join("");
}

function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Télécharge le script en document Word (.doc). */
export function exportWord(filename: string, title: string, content: string) {
  const html =
    `<html xmlns:o='urn:schemas-microsoft-com:office:office' ` +
    `xmlns:w='urn:schemas-microsoft-com:office:word' ` +
    `xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'>` +
    `<title>${escapeHtml(title)}</title></head>` +
    `<body style="font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.5;color:#111;">` +
    `<h1 style="font-size:18pt;">${escapeHtml(title)}</h1>${paragraphs(content)}</body></html>`;
  download(new Blob(["﻿", html], { type: "application/msword" }), `${filename}.doc`);
}

/** Ouvre une fenêtre d'impression stylée pour enregistrer le script en PDF. */
export function exportPdf(title: string, content: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Autorisez les fenêtres pop-up pour l'export PDF.");
    return;
  }
  w.document.write(
    `<html><head><meta charset='utf-8'><title>${escapeHtml(title)}</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;line-height:1.6;` +
      `padding:40px;color:#111;max-width:820px;margin:auto;}` +
      `h1{font-size:22px;margin-bottom:16px;}p{font-size:13px;margin:0 0 8px;}` +
      `@media print{body{padding:0;}}</style></head><body>` +
      `<h1>${escapeHtml(title)}</h1>${paragraphs(content)}` +
      `<scr` + `ipt>window.onload=function(){window.print();}</scr` + `ipt>` +
      `</body></html>`
  );
  w.document.close();
}
