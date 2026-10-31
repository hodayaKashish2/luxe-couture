import type { DressUpdateDiff } from '@/lib/dress-pending-update';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dressUpdateImageTag(url: string, label?: string) {
  const caption = label
    ? `<p style="font-size:11px;color:#8b6508;margin:4px 0 0;font-weight:bold;">${escapeHtml(label)}</p>`
    : '';
  return `<div style="display:inline-block;text-align:center;margin:4px;vertical-align:top;">
    <img src="${url}" alt="" style="width:100px;height:130px;object-fit:contain;border-radius:8px;border:1px solid #eadaaf;background:#fff;" />
    ${caption}
  </div>`;
}

function fieldChangeRow(label: string, before: string, after: string) {
  return `<li style="margin-bottom:12px;list-style:none;padding:10px 12px;border-radius:10px;background:#fffdf8;border:1px solid #f0e8d0;">
    <div style="font-weight:bold;color:#8b6508;margin-bottom:6px;">${escapeHtml(label)}</div>
    <div style="color:#9a7b4f;font-size:13px;margin-bottom:4px;">היה:</div>
    <div style="text-decoration:line-through;color:#9a7b4f;margin-bottom:8px;">${escapeHtml(before)}</div>
    <div style="color:#8b6508;font-size:13px;margin-bottom:4px;font-weight:bold;">עכשיו:</div>
    <div style="font-weight:bold;color:#3d2f24;font-size:15px;">${escapeHtml(after)}</div>
  </li>`;
}

/** Email-safe diff HTML — no ambiguous RTL arrows. */
export function buildDressUpdateDiffHtml(diff: DressUpdateDiff) {
  const { changes, imageChanges } = diff;
  const hasFieldChanges = changes.length > 0;
  const hasImageChanges = imageChanges.removed.length > 0 || imageChanges.added.length > 0;

  if (!hasFieldChanges && !hasImageChanges) {
    return '<p style="line-height:1.7;color:#554a33;">לא זוהו שינויים בפרטים.</p>';
  }

  let html = '<div style="margin:16px 0;padding:16px;border:1px solid #eadaaf;border-radius:12px;background:#fff;">';

  if (hasFieldChanges) {
    html += '<p style="margin:0 0 10px;font-weight:bold;color:#3d2f24;">שינויים בפרטים:</p><ul style="margin:0;padding:0;">';
    for (const change of changes) {
      html += fieldChangeRow(change.label, change.before, change.after);
    }
    html += '</ul>';
  }

  if (hasImageChanges) {
    html += '<p style="margin:16px 0 8px;font-weight:bold;color:#3d2f24;">שינויים בתמונות:</p>';

    const isSingleSwap = imageChanges.removed.length === 1 && imageChanges.added.length === 1;

    if (isSingleSwap) {
      html += `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:420px;">
        <tr>
          <td style="vertical-align:top;padding:4px;text-align:center;">
            ${dressUpdateImageTag(imageChanges.removed[0], 'לפני (הוסר)')}
          </td>
          <td style="vertical-align:top;padding:4px;text-align:center;">
            ${dressUpdateImageTag(imageChanges.added[0], 'אחרי (חדש)')}
          </td>
        </tr>
      </table>`;
    } else {
      if (imageChanges.removed.length > 0) {
        html += `<p style="line-height:1.7;color:#9a7b4f;margin:8px 0 4px;text-decoration:underline;">תמונות שהוסרו:</p><div>${imageChanges.removed.map((url) => dressUpdateImageTag(url)).join('')}</div>`;
      }
      if (imageChanges.added.length > 0) {
        html += `<p style="line-height:1.7;color:#3d2f24;margin:8px 0 4px;font-weight:bold;">תמונות חדשות:</p><div>${imageChanges.added.map((url) => dressUpdateImageTag(url, 'חדש')).join('')}</div>`;
      }
    }
  }

  html += '</div>';
  return html;
}
