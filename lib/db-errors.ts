export function formatSiteUsersDbError(message: string, code?: string): string {
  const m = message.toLowerCase();

  if (m.includes('schema cache') || m.includes('could not find the table')) {
    return 'Supabase לא רענן את הטבלה. ב-Supabase: Settings → API → Reload schema. אחר כך המתיני 30 שניות ונסי שוב.';
  }

  if (m.includes('does not exist') && m.includes('site_users')) {
    return 'טבלת site_users לא קיימת. הריצי את הקובץ supabase/fix-site-users.sql ב-SQL Editor.';
  }

  if (
    m.includes('password_hash') ||
    m.includes('display_name') ||
    m.includes('column') && m.includes('site_users')
  ) {
    return 'מבנה טבלת המשתמשות לא תקין. הריצי את הקובץ supabase/fix-site-users.sql ב-SQL Editor.';
  }

  if (m.includes('permission denied') && m.includes('site_users')) {
    return 'אין הרשאות לטבלת המשתמשות. הריצי את הקובץ supabase/fix-site-users.sql ב-SQL Editor.';
  }

  if (code === '23505' || m.includes('duplicate')) {
    return 'שם המשתמש כבר תפוס';
  }

  return `שגיאת מסד נתונים: ${message}`;
}
