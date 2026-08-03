import { validateAddDressForm, type AddDressFormFields } from '@/lib/form-validation';

export const MAX_DRESS_IMAGES = 6;

export type AddDressServerInput = AddDressFormFields & {
  imageCount: number;
  maxImages?: number;
};

/** ולידציה משותפת ל-API — הודעות זהות לטופס בצד לקוח */
export function validateAddDressServerInput(input: AddDressServerInput): string | null {
  const maxImages = input.maxImages ?? MAX_DRESS_IMAGES;
  if (input.imageCount > maxImages) {
    return `ניתן להעלות עד ${maxImages} תמונות לכל שמלה`;
  }
  return validateAddDressForm(input, input.imageCount);
}

export function validateAddDressImageMeta(file: { name: string; type: string; size: number }): string | null {
  if (!file.type.startsWith('image/')) {
    return `הקובץ "${file.name}" אינו תמונה — יש להעלות JPG או PNG בלבד`;
  }
  if (file.size > 5 * 1024 * 1024) {
    return `הקובץ "${file.name}" כבד מדי — ניתן להעלות עד 5MB לכל תמונה`;
  }
  return null;
}
