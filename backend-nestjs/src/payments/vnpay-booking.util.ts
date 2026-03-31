/** Tiền tố vnp_TxnRef cho đặt sân (tránh trùng logic đơn hàng ObjectId). */
export const VNPAY_BOOKING_TXN_PREFIX = 'BOOKING_';

export function buildBookingVnpTxnRef(bookingMongoId: string): string {
  return `${VNPAY_BOOKING_TXN_PREFIX}${bookingMongoId}`;
}

export function parseBookingIdFromVnpTxnRef(txnRef: string): string | null {
  if (!txnRef?.startsWith(VNPAY_BOOKING_TXN_PREFIX)) return null;
  const id = txnRef.slice(VNPAY_BOOKING_TXN_PREFIX.length);
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  return id;
}
