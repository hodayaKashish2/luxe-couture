import { getAppUrl, sendEmailTo } from '@/lib/email';
import { MARKETING_EMAIL_BROADCAST_FOOTER } from '@/lib/marketing-email-copy';
import { isMissingMarketingOptInColumn } from '@/lib/site-user-profile';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BroadcastAudience = 'all' | 'opt_in';

export type BroadcastRecipient = {
  email: string;
  display_name: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BATCH_SIZE = 8;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainTextToHtml(text: string) {
  return escapeHtml(text.trim())
    .split(/\n/)
    .map((line) => (line ? `<p style="line-height:1.75;color:#554a33;margin:0 0 12px;">${line}</p>` : '<p style="margin:0 0 8px;">&nbsp;</p>'))
    .join('');
}

export function isValidBroadcastEmail(value: string) {
  return EMAIL_RE.test(String(value || '').trim());
}

export function dedupeBroadcastRecipients(
  rows: { email?: string | null; display_name?: string | null }[]
): BroadcastRecipient[] {
  const seen = new Set<string>();
  const recipients: BroadcastRecipient[] = [];

  for (const row of rows) {
    const email = String(row.email || '').trim().toLowerCase();
    if (!email || !isValidBroadcastEmail(email) || seen.has(email)) continue;
    seen.add(email);
    recipients.push({
      email,
      display_name: String(row.display_name || '').trim(),
    });
  }

  return recipients;
}

type SiteUserEmailRow = {
  email?: string | null;
  display_name?: string | null;
  marketing_emails_opt_in?: boolean | null;
};

export async function fetchBroadcastRecipients(
  supabase: SupabaseClient,
  audience: BroadcastAudience
): Promise<BroadcastRecipient[]> {
  let query = supabase.from('site_users').select('email, display_name, marketing_emails_opt_in');

  if (audience === 'opt_in') {
    query = query.eq('marketing_emails_opt_in', true);
  }

  let { data, error } = await query;
  let rows = (data || []) as SiteUserEmailRow[];

  if (error && isMissingMarketingOptInColumn(error.message)) {
    if (audience === 'opt_in') {
      return [];
    }
    const legacy = await supabase.from('site_users').select('email, display_name');
    if (legacy.error) throw legacy.error;
    rows = (legacy.data || []) as SiteUserEmailRow[];
  } else if (error) {
    throw error;
  }

  return dedupeBroadcastRecipients(rows);
}

export async function fetchBroadcastStats(supabase: SupabaseClient) {
  let { data, error } = await supabase
    .from('site_users')
    .select('email, display_name, marketing_emails_opt_in');

  let rows = (data || []) as SiteUserEmailRow[];

  if (error && isMissingMarketingOptInColumn(error.message)) {
    const legacy = await supabase.from('site_users').select('email, display_name');
    if (legacy.error) throw legacy.error;
    rows = ((legacy.data || []) as SiteUserEmailRow[]).map((row) => ({
      ...row,
      marketing_emails_opt_in: false,
    }));
  } else if (error) {
    throw error;
  }

  const all = dedupeBroadcastRecipients(rows);
  const optIn = dedupeBroadcastRecipients(
    rows.filter((row) => Boolean(row.marketing_emails_opt_in))
  );

  return {
    allCount: all.length,
    optInCount: optIn.length,
  };
}

export function buildBroadcastEmailHtml(params: {
  subject: string;
  body: string;
  audience: BroadcastAudience;
  displayName?: string;
}) {
  const greeting = params.displayName
    ? `<p style="line-height:1.7;color:#554a33;margin:0 0 16px;">שלום ${escapeHtml(params.displayName)}!</p>`
    : '';

  const footer =
    params.audience === 'opt_in'
      ? `<p style="font-size:12px;color:#9a7b4f;line-height:1.6;margin:24px 0 0;padding-top:16px;border-top:1px solid #ede3c8;">
          ${escapeHtml(MARKETING_EMAIL_BROADCAST_FOOTER)}
          <a href="${getAppUrl()}/account?section=profile" style="color:#8b6508;"> לביטול — אזור אישי → פרטי חשבון</a>
        </p>`
      : `<p style="font-size:12px;color:#9a7b4f;line-height:1.6;margin:24px 0 0;padding-top:16px;border-top:1px solid #ede3c8;">
          מייל תפעולי מ«שמלה בקליק» — נשלח לכל המשתמשות הרשומות עם כתובת מייל.
        </p>`;

  return `
    <div dir="rtl" style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
      <p style="font-size:11px;font-weight:bold;color:#b8860b;margin:0 0 8px;letter-spacing:0.05em;">✦ שמלה בקליק ✦</p>
      <h2 style="color:#3d2f24;margin:0 0 16px;font-size:20px;">${escapeHtml(params.subject)}</h2>
      ${greeting}
      ${plainTextToHtml(params.body)}
      ${footer}
    </div>
  `;
}

export function getBroadcastBatchSize() {
  return BATCH_SIZE;
}

export async function sendBroadcastBatch(params: {
  recipients: BroadcastRecipient[];
  offset: number;
  subject: string;
  body: string;
  audience: BroadcastAudience;
}) {
  const slice = params.recipients.slice(params.offset, params.offset + BATCH_SIZE);
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const recipient of slice) {
    const html = buildBroadcastEmailHtml({
      subject: params.subject,
      body: params.body,
      audience: params.audience,
      displayName: recipient.display_name,
    });

    const result = await sendEmailTo(recipient.email, params.subject, html);
    results.push({
      email: recipient.email,
      success: result.success,
      error: result.success ? undefined : result.error,
    });
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  return {
    sent,
    failed,
    results,
    processed: slice.length,
    nextOffset: params.offset + slice.length,
    done: params.offset + slice.length >= params.recipients.length,
    total: params.recipients.length,
  };
}
