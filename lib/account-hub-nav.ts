/** מעבר אמין למסך הבית של האזור האישי — תמיד מנקה ?section= מהכתובת */
export function navigateAccountHub() {
  if (typeof window === 'undefined') return;
  const target = '/account';
  if (window.location.pathname === target && !window.location.search) return;
  window.location.assign(target);
}
