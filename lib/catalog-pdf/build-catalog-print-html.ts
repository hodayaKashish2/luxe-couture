import { SITE_NAME } from '@/lib/site-config';
import type { CatalogPdfDress } from '@/lib/catalog-pdf/types';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dressCard(dress: CatalogPdfDress) {
  const metaParts: string[] = [];
  const city = dress.city.trim();
  if (city && city !== '—') metaParts.push(city);
  if (dress.listingLabel) metaParts.push(dress.listingLabel);
  const metaLine = metaParts.length
    ? `<p class="dress-meta">${metaParts.map((part, index) => {
        const isListing = index === metaParts.length - 1 && dress.listingLabel === part;
        const listingClass = isListing
          ? part === 'מכירה'
            ? ' listing-sale'
            : ' listing-rent'
          : '';
        const separator =
          index > 0 ? '<span class="meta-sep" aria-hidden="true">·</span>' : '';
        return `${separator}<span class="meta-part${listingClass}">${escapeHtml(part)}</span>`;
      }).join('')}</p>`
    : '';

  return `
    <article class="dress-card">
      <div class="dress-image-wrap">
        ${
          dress.imageUrl
            ? `<img src="${escapeHtml(dress.imageUrl)}" alt="" loading="eager" />`
            : '<div class="dress-placeholder">👗</div>'
        }
        <span class="size-badge">מידה ${escapeHtml(dress.size)}</span>
      </div>
      <div class="dress-body">
        <p class="dress-name">${escapeHtml(dress.name)}</p>
        ${metaLine}
        <p class="dress-price">₪${dress.price.toLocaleString('he-IL')}</p>
      </div>
    </article>
  `;
}

export function buildCatalogPrintHtml(dresses: CatalogPdfDress[]) {
  const generatedAt = new Date().toLocaleString('he-IL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(SITE_NAME)} — קטלוג שמלות</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, 'Segoe UI', Tahoma, sans-serif;
      background: #fbf8f0;
      color: #3d2f24;
      direction: rtl;
    }
    .page-header {
      padding: 10px 12px 8px;
      text-align: center;
      border-bottom: 1px solid #e6c687;
      background: linear-gradient(180deg, #fffdf9, #faf6eb);
    }
    .page-header h1 {
      margin: 0 0 2px;
      font-size: 16px;
      font-weight: 800;
      color: #8b6508;
    }
    .page-header p {
      margin: 0;
      font-size: 8px;
      color: #6e634c;
      line-height: 1.35;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
      padding: 6px;
    }
    .dress-card {
      break-inside: avoid;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid #ebd3a4;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(212, 175, 55, 0.08);
    }
    .dress-image-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 3 / 4;
      background: #f5f0e6;
      overflow: hidden;
    }
    .dress-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .dress-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      opacity: 0.35;
    }
    .size-badge {
      position: absolute;
      top: 3px;
      right: 3px;
      z-index: 1;
      background: linear-gradient(90deg, #d4af37, #b8860b);
      color: #fff;
      font-size: 6px;
      font-weight: 800;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 3px;
      border: 1px solid #c9a227;
    }
    .dress-body {
      padding: 3px 4px 4px;
      background: #fff;
    }
    .dress-name {
      margin: 0 0 1px;
      font-size: 7px;
      font-weight: 600;
      line-height: 1.25;
      color: #262626;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: calc(7px * 1.25 * 2);
    }
    .dress-meta {
      margin: 0 0 2px;
      font-size: 6px;
      line-height: 1.2;
      color: #9a7b4f;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta-sep {
      margin: 0 2px;
      color: #decfa8;
    }
    .meta-part.listing-rent {
      font-weight: 700;
      color: #8b6508;
    }
    .meta-part.listing-sale {
      font-weight: 700;
      color: #047857;
    }
    .dress-price {
      margin: 0;
      font-size: 8px;
      font-weight: 800;
      line-height: 1;
      color: #171717;
    }
    @media print {
      body { background: white; }
      .page-header {
        padding: 8px 10px 6px;
      }
      .grid {
        gap: 4px;
        padding: 4px;
      }
    }
  </style>
</head>
<body>
  <header class="page-header">
    <h1>${escapeHtml(SITE_NAME)}</h1>
    <p>קטלוג מלא — ${dresses.length} שמלות · עודכן ${escapeHtml(generatedAt)} · ניתן לשמור ולשתף</p>
  </header>
  <main class="grid">
    ${dresses.map(dressCard).join('')}
  </main>
</body>
</html>`;
}
