import { DRESS_SIZES } from '@/lib/constants';
import { isValidIsraeliPhone, phoneValidationMessage } from '@/lib/israeli-phone';

export const MAX_DRESS_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DRESS_IMAGE_SIZE_MB = 5;

export function validateDressImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return `הקובץ "${file.name}" אינו תמונה — יש להעלות JPG או PNG בלבד`;
  }
  if (file.size > MAX_DRESS_IMAGE_SIZE) {
    return `הקובץ "${file.name}" כבד מדי — ניתן להעלות עד ${MAX_DRESS_IMAGE_SIZE_MB}MB לכל תמונה`;
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

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return isValidIsraeliPhone(phone);
}

export function isKnownDressSize(size: string): boolean {
  const trimmed = size.trim();
  if (!trimmed) return false;
  return DRESS_SIZES.some(
    (entry) =>
      entry.label.toLowerCase() === trimmed.toLowerCase() ||
      entry.value.toLowerCase() === trimmed.toLowerCase()
  );
}

export type AddDressFormFields = {
  name: string;
  price: string;
  size: string;
  city: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  requireEmail?: boolean;
};

export function validateAddDressForm(form: AddDressFormFields, imageCount: number): string | null {
  if (!form.name.trim()) return 'נא להזין שם לשמלה';
  if (!form.price.trim() || Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
    return 'נא להזין מחיר תקין — מספר גדול מ-0';
  }
  if (!form.size.trim()) return 'נא לבחור מידה מהרשימה';
  if (!isKnownDressSize(form.size)) {
    return 'נא לבחור מידה מהרשימה — XS, S, M, L, XL או XXL';
  }
  if (!form.city.trim()) return 'נא להזין עיר';

  if (form.owner_name !== undefined && !form.owner_name.trim()) {
    return 'נא להזין שם משכירה';
  }

  if (form.owner_phone !== undefined) {
    if (!form.owner_phone.trim()) return 'נא להזין מספר טלפון ליצירת קשר';
    if (!isValidPhone(form.owner_phone)) return phoneValidationMessage();
  }

  const email = form.owner_email?.trim() || '';
  if (form.requireEmail && !email) return 'נא להזין כתובת אימייל';
  if (email && !isValidEmail(email)) {
    return 'כתובת האימייל לא נראית תקינה — ודאי שיש @ וסיומת (למשל name@gmail.com)';
  }

  if (imageCount === 0) return 'נא להעלות לפחות תמונה אחת של השמלה';
  return null;
}

export function validateUpdateProfileForm(form: {
  display_name: string;
  phone: string;
  email: string;
}): string | null {
  const displayName = form.display_name.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();

  if (!displayName) return 'נא להזין שם מלא';
  if (!phone) return 'נא להזין מספר טלפון';
  if (!isValidPhone(phone)) return phoneValidationMessage();
  if (!email) return 'נא להזין כתובת אימייל';
  if (!isValidEmail(email)) {
    return 'כתובת האימייל לא נראית תקינה — ודאי שיש @ וסיומת (למשל name@gmail.com)';
  }
  return null;
}

export function validateLoginForm(username: string, password: string): string | null {
  if (!username.trim()) return 'נא להזין שם משתמש';
  if (!password) return 'נא להזין סיסמה';
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

  if (!username) return 'נא להזין שם משתמש';
  if (username.length < 3) return 'שם המשתמש קצר מדי — לפחות 3 תווים';
  if (!password) return 'נא להזין סיסמה';
  if (password.length < 6) return 'הסיסמה קצרה מדי — לפחות 6 תווים';
  if (!displayName) return 'נא להזין שם מלא';
  if (!phone) return 'נא להזין מספר טלפון';
  if (!isValidPhone(phone)) return phoneValidationMessage();
  if (!email) return 'נא להזין כתובת אימייל';
  if (!isValidEmail(email)) {
    return 'כתובת האימייל לא נראית תקינה — ודאי שיש @ וסיומת (למשל name@gmail.com)';
  }

  return null;
}
