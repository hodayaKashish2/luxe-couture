import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const diagramsDir = path.join(root, 'docs', 'diagrams');
const docsDir = path.join(root, 'docs');
const printHtmlPath = path.join(docsDir, 'booking-flow-print.html');
const pdfPath = path.join(docsDir, 'booking-flow-diagrams.pdf');

const sections = [
  {
    title: '1. תרשים ראשי — כל הזרימה',
    file: '01-main-flow.mmd',
  },
  {
    title: '2. שוכרת עם חשבון vs בלי חשבון',
    file: '02-account-vs-guest.mmd',
  },
  {
    title: '3. שלב 1 — אישור משכירה (עד 48 שעות)',
    file: '03-owner-approval.mmd',
  },
  {
    title: '4. שלב 2 — תשלום (ביט / העברה בנקאית)',
    file: '04-payment.mmd',
  },
  {
    title: '5. שלב 3 — אישור אדמין',
    file: '05-admin.mmd',
  },
  {
    title: '6. כל נקודות הקצה',
    file: '06-edge-cases.mmd',
  },
];

function renderDiagrams() {
  for (const section of sections) {
    const input = path.join(diagramsDir, section.file);
    const output = path.join(diagramsDir, section.file.replace('.mmd', '.png'));
    execSync(
      `npx --yes @mermaid-js/mermaid-cli@11 -i "${input}" -o "${output}" -b white -w 1400 -H 900`,
      { cwd: root, stdio: 'inherit', env: process.env }
    );
    section.png = path.basename(output);
  }

  const seqInput = path.join(diagramsDir, '07-sequence.mmd');
  const seqOutput = path.join(diagramsDir, '07-sequence.png');
  execSync(
    `npx --yes @mermaid-js/mermaid-cli@11 -i "${seqInput}" -o "${seqOutput}" -b white -w 1400 -H 900`,
    { cwd: root, stdio: 'inherit', env: process.env }
  );
}

function buildPrintHtml() {
  const diagramBlocks = sections
    .map(
      (s) => `
    <section class="block">
      <h2>${s.title}</h2>
      <img src="diagrams/${s.png}" alt="${s.title}" />
    </section>`
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>תרשימי זרימה — שמלה בקליק</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      margin: 0;
      padding: 20px 24px;
    }
    h1 { font-size: 22px; border-bottom: 3px solid #c9a87c; padding-bottom: 8px; }
    h2 { font-size: 16px; color: #5c4a32; margin: 24px 0 10px; page-break-after: avoid; }
    .subtitle { color: #666; margin-bottom: 20px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 12px; page-break-inside: avoid; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; }
    th { background: #f7f3ee; }
    img { max-width: 100%; height: auto; display: block; margin: 0 auto; page-break-inside: avoid; }
    .block { margin-bottom: 24px; page-break-inside: avoid; }
    .page-break { page-break-before: always; }
    footer { margin-top: 24px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>תרשימי זרימה — כל תרחישי ההזמנה</h1>
  <p class="subtitle">שמלה בקליק · dress-click.co.il · עודכן: אוגוסט 2026</p>

  <h2>סטטוסים במערכת</h2>
  <table>
    <tr><th>סטטוס</th><th>משמעות</th></tr>
    <tr><td>pending_owner_approval</td><td>ממתין לאישור משכירה</td></tr>
    <tr><td>pending_payment</td><td>המשכירה אישרה — ממתין לתשלום</td></tr>
    <tr><td>awaiting_admin_approval</td><td>דיווח תשלום — ממתין לאישור אדמין</td></tr>
    <tr><td>confirmed</td><td>הזמנה סופית</td></tr>
    <tr><td>cancelled</td><td>בוטלה</td></tr>
    <tr><td>failed</td><td>כשל תשלום (לא פעיל ב-UI)</td></tr>
  </table>

  <h2>מי מאשר מה ומתי</h2>
  <table>
    <tr><th>שלב</th><th>מי</th><th>מתי</th><th>תוצאה</th></tr>
    <tr><td>בקשת שריון</td><td>שוכרת</td><td>מיד</td><td>pending_owner_approval</td></tr>
    <tr><td>אישור משכירה</td><td>משכירה</td><td>עד 48 שעות</td><td>pending_payment / cancelled</td></tr>
    <tr><td>תשלום</td><td>שוכרת</td><td>אחרי אישור משכירה</td><td>awaiting_admin_approval</td></tr>
    <tr><td>אישור תשלום</td><td>אדמין</td><td>אחרי דיווח</td><td>confirmed</td></tr>
    <tr><td>ביטול</td><td>שוכרת (עם חשבון)</td><td>לפני confirmed</td><td>cancelled</td></tr>
    <tr><td>תזכורת</td><td>מערכת</td><td>+24 שעות</td><td>מייל למשכירה</td></tr>
    <tr><td>timeout</td><td>מערכת</td><td>+48 שעות</td><td>cancelled + מייל</td></tr>
  </table>

  <h2>מיילים לפי שלב</h2>
  <table>
    <tr><th>שלב</th><th>נמענים</th></tr>
    <tr><td>בקשה חדשה</td><td>משכירה + שוכרת + אדמין</td></tr>
    <tr><td>+24 שעות</td><td>משכירה (תזכורת)</td></tr>
    <tr><td>משכירה אישרה</td><td>שוכרת (קישור תשלום)</td></tr>
    <tr><td>משכירה דחתה</td><td>שוכרת (עם סיבה)</td></tr>
    <tr><td>48 שעות timeout</td><td>שוכרת</td></tr>
    <tr><td>דיווח ביט/העברה</td><td>אדמין + שוכרת</td></tr>
    <tr><td>אישור סופי</td><td>שוכרת</td></tr>
  </table>

  <div class="page-break"></div>
  ${diagramBlocks}

  <div class="page-break"></div>
  <section class="block">
    <h2>7. Sequence — לפי שחקן</h2>
    <img src="diagrams/07-sequence.png" alt="Sequence diagram" />
  </section>

  <footer>שמלה בקליק · תרשימי זרימת הזמנה · dress-click.co.il</footer>
</body>
</html>`;

  fs.writeFileSync(printHtmlPath, html, 'utf8');
}

async function htmlToPdf() {
  const puppeteer = await import('puppeteer');
  const htmlUrl = `file:///${printHtmlPath.replace(/\\/g, '/')}`;
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(htmlUrl, { waitUntil: 'load', timeout: 60000 });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });
    console.log(`PDF created: ${pdfPath}`);
  } finally {
    await browser.close();
  }
}

renderDiagrams();
buildPrintHtml();
await htmlToPdf();
