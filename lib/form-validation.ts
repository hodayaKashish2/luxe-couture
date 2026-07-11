export const MAX_DRESS_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DRESS_IMAGE_SIZE_MB = 5;

export function validateDressImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return `הקובץ "${file.name}" אינו תמונה — יש להעלות JPG או PNG`;
  }
  if (file.size > MAX_DRESS_IMAGE_SIZE) {
    return `הקובץ "${file.name}" כבד מדי — מקסימום ${MAX_DRESS_IMAGE_SIZE_MB}MB לתמונה`;
  }
  return null;
}

export function validateDressImageFiles(files: File[]): string | null {
  for (const file of files) {
    const error = validateDressImageFile(file);
    if (error) return error;
  }
  return null;
}

export type AddDressFormFields = {
  name: string;
  price: string;
  size: string;
  city: string;
  owner_phone?: string;
};

export function validateAddDressForm(form: AddDressFormFields, imageCount: number): string | null {
  if (!form.name.trim()) return 'יש להזין שם שמלה';
  if (!form.price.trim() || Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
    return 'יש להזין מחיר תקין';
  }
  if (!form.size.trim()) return 'יש לבחור מידה';
  if (!form.city.trim()) return 'יש להזין עיר';
  if (form.owner_phone !== undefined && !form.owner_phone.trim()) {
    return 'יש להזין מספר טלפון ליצירת קשר';
  }
  if (imageCount === 0) return 'יש להעלות לפחות תמונה אחת של השמלה';
  return null;
}

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
