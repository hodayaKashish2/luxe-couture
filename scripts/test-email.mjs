import fs from 'fs';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
);

function status(name, value) {
  if (!value) return `${name}: MISSING`;
  if (value.includes('הדביקי') || value.includes('your_')) return `${name}: PLACEHOLDER`;
  if (name.includes('KEY')) return `${name}: SET (${value.length} chars)`;
  return `${name}: ${value}`;
}

console.log(status('ADMIN_EMAIL', env.ADMIN_EMAIL));
console.log(status('RESEND_API_KEY', env.RESEND_API_KEY));
console.log(status('RESEND_FROM', env.RESEND_FROM));
console.log(status('ADMIN_SECRET', env.ADMIN_SECRET));

if (!env.RESEND_API_KEY || env.RESEND_API_KEY.includes('הדביקי')) {
  console.log('\nRESULT: Emails cannot send without a real RESEND_API_KEY');
  process.exit(1);
}

const { Resend } = await import('resend');
const resend = new Resend(env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: env.RESEND_FROM || 'DressRental <onboarding@resend.dev>',
  to: env.ADMIN_EMAIL || 'hodayaka1212@gmail.com',
  subject: 'בדיקת מייל מאתר שמלה להשכיר',
  html: '<div dir="rtl" style="font-family:sans-serif">✅ אם קיבלת את המייל הזה — שליחת המיילים עובדת!</div>',
});

if (error) {
  console.log('\nRESEND_ERROR:', error.message);
  process.exit(1);
}

console.log('\nRESULT: Test email sent successfully');
console.log('RESEND_ID:', data?.id || 'unknown');
