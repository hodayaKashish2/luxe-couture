export function validateLoginForm(username: string, password: string): string | null {
  if (!username.trim()) return 'יש להזין שם משתמש';
  if (!password) return 'יש להזין סיסמה';
  return null;
}

export function validateRegisterForm(form: {
  username: string;
  password: string;
  display_name: string;
  phone: string;
  email: string;
}): string | null {
  const username = form.username.trim();
  const password = form.password;
  const displayName = form.display_name.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();

  if (!username) return 'יש להזין שם משתמש';
  if (username.length < 3) return 'שם משתמש — לפחות 3 תווים';
  if (!password) return 'יש להזין סיסמה';
  if (password.length < 6) return 'סיסמה — לפחות 6 תווים';
  if (!displayName) return 'יש להזין שם מלא';
  if (!phone) return 'יש להזין מספר טלפון';
  if (!email) return 'יש להזין כתובת אימייל';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'כתובת האימייל לא תקינה — חסר @ או סיומת (לדוגמה: name@mail.com)';
  }

  return null;
}
