/** Múi giờ đặt sân (VN) — kết thúc ca theo giờ địa phương */
const VN_OFFSET = '+07:00';

function normalizeTime(t: string): string {
  const p = String(t || '')
    .trim()
    .split(':');
  const h = Math.min(23, Math.max(0, Number(p[0]) || 0));
  const m = Math.min(59, Math.max(0, Number(p[1] ?? 0) || 0));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** YYYY-MM-DD từ bookingDate lưu UTC (thường T12:00:00.000Z) */
export function bookingDateToYmd(d: Date): string {
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, '0');
  const day = String(x.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Thời điểm kết thúc ca cuối (để tự động Completed & mở slot) */
export function computeSlotEndAt(dateStr: string, endTimeHHmm: string): Date {
  const nt = normalizeTime(endTimeHHmm);
  const [h, m] = nt.split(':').map(Number);
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return new Date(`${dateStr}T${hh}:${mm}:00${VN_OFFSET}`);
}

export function computeSlotEndFromBookingLike(b: {
  bookingDate?: Date;
  endTime?: string;
  slots?: { endTime: string }[];
}): Date {
  const bd = b.bookingDate ? new Date(b.bookingDate) : new Date();
  const dateStr = bookingDateToYmd(bd);
  const endTime =
    Array.isArray(b.slots) && b.slots.length > 0
      ? b.slots[b.slots.length - 1]?.endTime
      : b.endTime;
  return computeSlotEndAt(dateStr, endTime || '22:00');
}
