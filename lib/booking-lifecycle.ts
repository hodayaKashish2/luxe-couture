import type { SupabaseClient } from '@supabase/supabase-js';

import { processBookingOwnerDeadlines } from '@/lib/booking-owner-flow';
import {
  processBookingPaymentDeadlines,
  processBookingSlotConflicts,
} from '@/lib/booking-slot-guard';

type SupabaseAdmin = SupabaseClient;

export async function processAllBookingLifecycle(supabase: SupabaseAdmin) {
  const owner = await processBookingOwnerDeadlines(supabase);
  const payment = await processBookingPaymentDeadlines(supabase);
  const slots = await processBookingSlotConflicts(supabase);
  return { owner, payment, slots };
}

export {
  cancelCompetingSlotBookings,
  processBookingPaymentDeadlines,
  processBookingSlotConflicts,
} from '@/lib/booking-slot-guard';
