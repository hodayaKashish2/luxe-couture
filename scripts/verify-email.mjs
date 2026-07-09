/**
 * בדיקת שליחת מייל ללקוחה
 * שימוש: node scripts/verify-email.mjs [BASE_URL] [TEST_EMAIL]
 * דוגמה: node scripts/verify-email.mjs https://your-site.vercel.app customer@gmail.com
 */
import fs from 'fs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const testTo = process.argv[3] || 'test.customer@example.com';

let adminSecret = process.env.ADMIN_SECRET;
if (!adminSecret && fs.existsSync('.env.local')) {
  const env = Object.fromEntries(
    fs
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
  adminSecret = env.ADMIN_SECRET;
}

console.log('Checking:', `${base}/api/health`);
const healthRes = await fetch(`${base}/api/health`);
const health = await healthRes.json();
console.log('\n=== EMAIL CONFIG ===');
console.log(JSON.stringify(health.email, null, 2));

if (!health.email?.canSendToCustomers) {
  console.log('\n❌ לא מוגדר לשליחה ללקוחות. הוסיפי SMTP_PASSWORD ב-Vercel ועשי Redeploy.');
  process.exit(1);
}

if (!adminSecret) {
  console.log('\n⚠️ חסר ADMIN_SECRET — מדלג על שליחת מייל בדיקה');
  process.exit(0);
}

console.log(`\nSending test email to: ${testTo}`);
const testRes = await fetch(`${base}/api/email/test`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': adminSecret,
  },
  body: JSON.stringify({ to: testTo }),
});
const test = await testRes.json();
console.log('\n=== SEND RESULT ===');
console.log(JSON.stringify(test, null, 2));

if (test.result?.success) {
  console.log(`\n✅ מייל נשלח בהצלחה ל-${test.result.sentTo} דרך ${test.result.provider}`);
} else {
  console.log(`\n❌ שליחה נכשלה: ${test.result?.error || test.error || 'unknown'}`);
  process.exit(1);
}
