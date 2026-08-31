'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DressImageFill from '@/components/DressImageFill';
import DressSizeInput from '@/components/DressSizeInput';
import FormError from '@/components/FormError';
import { useSafeModalBackdropClose } from '@/hooks/use-safe-modal-backdrop-close';
import { validateAddDressForm, validateDressImageFiles } from '@/lib/form-validation';
import { DRESS_KIND_OPTIONS, LISTING_TYPE_OPTIONS } from '@/lib/dress-listing';
import {
  DEFAULT_DRESS_LENGTH,
  DRESS_LENGTH_OPTIONS,
  DRESS_STYLE_OPTIONS,
  DRESS_STYLE_PLACEHOLDER,
} from '@/lib/dress-style-length';
import { normalizeDressImages, type DressEditFormFields } from '@/lib/dress-pending-update';
import { PICKUP_METHODS } from '@/lib/types';

const EMPTY_FORM: DressEditFormFields = {
  name: '',
  price: '',
  size: '',
  city: '',
  color: '',
  description: '',
  event_type: 'single',
  listing_type: 'rent',
  dress_style: '',
  dress_length: DEFAULT_DRESS_LENGTH,
  condition: 'new',
  deposit: '',
  pickup_method: 'pickup',
  includes_dry_cleaning: 'no',
};

type AdminDressEditData = {
  id: string;
  status: string;
  images: string[];
  form: DressEditFormFields;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  has_pending_update: boolean;
};

type AdminDressEditModalProps = {
  dressId: number;
  dressName: string;
  token: string;
  onClose: () => void;
  onSaved: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'ממתינה לאישור',
  approved: 'מאושרת בקטלוג',
  rejected: 'נדחתה',
  removed: 'הוסרה',
};

export default function AdminDressEditModal({
  dressId,
  dressName,
  token,
  onClose,
  onSaved,
}: AdminDressEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const stableClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);
  const { onBackdropMouseDown, onPanelMouseDown, onBackdropClick } = useSafeModalBackdropClose(stableClose, !saving);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [hasPendingUpdate, setHasPendingUpdate] = useState(false);
  const [form, setForm] = useState<DressEditFormFields>(EMPTY_FORM);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/dresses/${dressId}`, {
          headers: { 'x-admin-token': token },
        });
        const data = (await response.json()) as AdminDressEditData & { error?: string };
        if (!response.ok) throw new Error(data.error || 'שגיאה בטעינה');
        if (cancelled) return;

        setForm(data.form || EMPTY_FORM);
        setExistingImages(normalizeDressImages(data.images));
        setOwnerName(data.owner_name || '');
        setOwnerPhone(data.owner_phone || '');
        setOwnerEmail(data.owner_email || '');
        setStatus(data.status || '');
        setHasPendingUpdate(Boolean(data.has_pending_update));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [dressId, token]);

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const totalCount = existingImages.length + newFiles.length + files.length;
    if (totalCount > 6) {
      setError('ניתן לשמור עד 6 תמונות');
      return;
    }
    const imageError = validateDressImageFiles(files);
    if (imageError) {
      setError(imageError);
      return;
    }
    setError('');
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...previews]);
  }

  function removeExistingImage(url: string) {
    setExistingImages((prev) => prev.filter((img) => img !== url));
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (existingImages.length + newFiles.length === 0) {
      setError('חייבת להישאר לפחות תמונה אחת');
      return;
    }

    const validationError = validateAddDressForm(
      {
        name: form.name,
        price: form.price,
        size: form.size,
        city: form.city,
        color: form.color,
        dress_style: form.dress_style,
        dress_length: form.dress_length,
      },
      existingImages.length + newFiles.length
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('size', form.size);
    formData.append('city', form.city);
    formData.append('color', form.color);
    formData.append('description', form.description);
    formData.append('event_type', form.event_type);
    formData.append('listing_type', form.listing_type);
    formData.append('dress_style', form.dress_style);
    formData.append('dress_length', form.dress_length);
    formData.append('condition', form.condition);
    formData.append('deposit', form.deposit);
    formData.append('pickup_method', form.pickup_method);
    formData.append('includes_dry_cleaning', form.includes_dry_cleaning);
    formData.append('owner_name', ownerName);
    formData.append('owner_phone', ownerPhone);
    formData.append('owner_email', ownerEmail);
    formData.append('kept_images', JSON.stringify(existingImages));
    newFiles.forEach((file) => formData.append('images', file));

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/dresses/${dressId}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה בשמירה');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={onBackdropMouseDown}
      onClick={onBackdropClick}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-2 border-[#d4af37] bg-[#fffdf8] shadow-2xl"
        onMouseDown={onPanelMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#eadaaf] bg-[#fffdf8] px-4 py-3">
          <div className="min-w-0">
            <p className="font-black text-lg text-[#3d2f24] truncate">✏️ עריכת שמלה</p>
            <p className="text-xs text-[#8b6508] font-bold truncate">
              {dressName} · #{dressId}
              {status ? ` · ${STATUS_LABELS[status] || status}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full border border-[#eadaaf] bg-white font-bold text-[#3d2f24] hover:bg-[#f4ebd4]"
            aria-label="סגירה"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {loading ? (
            <p className="text-sm text-[#6e634c] animate-pulse py-8 text-center">טוען פרטי שמלה...</p>
          ) : (
            <>
              {hasPendingUpdate && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 leading-relaxed">
                  <strong>יש עדכון ממתין מאישור בעלות</strong> — השמירה תחיל את השינויים ישירות בקטלוג
                  ותבטל את הבקשה הממתינה.
                </div>
              )}

              {error && <FormError message={error} />}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  placeholder="שם השמלה *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs col-span-1 sm:col-span-2 bg-white"
                />
                <input
                  required
                  type="number"
                  placeholder="מחיר *"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs bg-white"
                />
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מידה *</label>
                  <DressSizeInput
                    required
                    value={form.size}
                    onChange={(size) => setForm({ ...form, size })}
                    className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                  />
                </div>
                <input
                  required
                  placeholder="עיר *"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs bg-white"
                />
                <input
                  placeholder="צבע"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs bg-white"
                />
                <select
                  required
                  value={form.listing_type}
                  onChange={(e) => setForm({ ...form, listing_type: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                >
                  {LISTING_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                >
                  {DRESS_KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={form.dress_style}
                  onChange={(e) => setForm({ ...form, dress_style: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                >
                  <option value="">{DRESS_STYLE_PLACEHOLDER}</option>
                  {DRESS_STYLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={form.dress_length}
                  onChange={(e) => setForm({ ...form, dress_length: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                >
                  {DRESS_LENGTH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                >
                  <option value="new">חדש עם תווית</option>
                  <option value="like-new">כמו חדש</option>
                  <option value="used">יד שנייה</option>
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="פיקדון (₪)"
                  value={form.deposit}
                  onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs bg-white"
                />
                <select
                  value={form.pickup_method}
                  onChange={(e) => setForm({ ...form, pickup_method: e.target.value })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                >
                  {PICKUP_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.includes_dry_cleaning}
                  onChange={(e) =>
                    setForm({ ...form, includes_dry_cleaning: e.target.value as 'yes' | 'no' })
                  }
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full bg-white"
                >
                  <option value="no">לא כולל ניקוי יבש</option>
                  <option value="yes">כולל ניקוי יבש</option>
                </select>
                <textarea
                  placeholder="תיאור השמלה (אופציונלי)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs col-span-1 sm:col-span-2 resize-none bg-white"
                />
              </div>

              <div className="rounded-xl border border-[#eadaaf] bg-white p-3 space-y-2">
                <p className="text-xs font-black text-[#8b6508]">פרטי משכירה</p>
                <input
                  placeholder="שם משכירה"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs bg-white"
                />
                <input
                  placeholder="טלפון משכירה"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs bg-white"
                  dir="ltr"
                />
                <input
                  type="email"
                  placeholder="אימייל משכירה"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs bg-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-2">תמונות השמלה</label>
                <p className="text-[10px] text-[#9a7b4f] mb-2">
                  ניתן למחוק תמונות קיימות או להוסיף חדשות (עד 6 סה״כ)
                </p>

                {(existingImages.length > 0 || newPreviews.length > 0) && (
                  <div className="flex gap-2 flex-wrap mb-3 bg-neutral-50 p-3 rounded-xl border border-[#eadaaf]">
                    {existingImages.map((img) => (
                      <div key={img} className="relative">
                        <DressImageFill
                          src={img}
                          alt=""
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-[#decfa8]"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img)}
                          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#2c261a] text-white text-[10px] font-bold flex items-center justify-center shadow-md hover:bg-red-700"
                          aria-label="מחקי תמונה"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {newPreviews.map((img, index) => (
                      <div key={`${img}-${index}`} className="relative">
                        <DressImageFill
                          src={img}
                          alt=""
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-[#d4af37]"
                        />
                        <span className="absolute bottom-1 right-1 text-[8px] bg-[#d4af37] text-white px-1 rounded">
                          חדש
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#2c261a] text-white text-[10px] font-bold flex items-center justify-center shadow-md hover:bg-red-700"
                          aria-label="מחקי תמונה חדשה"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-[#d4af37] rounded-xl bg-[#fffdf8] hover:bg-[#f4ebd4] transition-colors text-center"
                >
                  <span className="text-xs font-bold text-[#8b6508]">➕ הוספת תמונות</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 min-w-[140px] py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-black shadow-md disabled:opacity-60"
                >
                  {saving ? 'שומר...' : 'שמרי שינויים'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 border border-[#decfa8] rounded-xl text-xs font-bold text-[#6e634c]"
                >
                  ביטול
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
