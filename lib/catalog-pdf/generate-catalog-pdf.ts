import { buildCatalogPrintHtml } from '@/lib/catalog-pdf/build-catalog-print-html';
import type { CatalogPdfDress } from '@/lib/catalog-pdf/types';
import { existsSync } from 'node:fs';
import path from 'node:path';

function resolveBrowserExecutable() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates = [
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] &&
      path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.PROGRAMFILES &&
      path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env['PROGRAMFILES(X86)'] &&
      path.join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter((value): value is string => Boolean(value));

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export async function generateCatalogPdf(dresses: CatalogPdfDress[]): Promise<Buffer> {
  if (dresses.length === 0) {
    throw new Error('אין שמלות מאושרות בקטלוג');
  }

  let puppeteer: typeof import('puppeteer-core');
  try {
    puppeteer = await import('puppeteer-core');
  } catch {
    throw new Error('חסרה חבילת puppeteer-core. הריצי מקומית: npm install -D puppeteer-core');
  }

  const executablePath = resolveBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      'לא נמצא Chrome או Edge. התקיני Chrome, או הגדירי PUPPETEER_EXECUTABLE_PATH לנתיב הדפדפן'
    );
  }

  const html = buildCatalogPrintHtml(dresses);
  const browser = await puppeteer.default.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 180000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '6mm', bottom: '6mm', left: '5mm', right: '5mm' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}