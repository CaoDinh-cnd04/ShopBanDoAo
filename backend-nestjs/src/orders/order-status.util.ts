import { BadRequestException } from '@nestjs/common';

/** Giá trị lưu DB / gửi API — thứ tự workflow (chỉ tiến, không lùi). */
export const ORDER_STATUS_RANK: Record<string, number> = {
  AwaitingPayment: 0,
  Pending: 1,
  Confirmed: 2,
  Processing: 3,
  Shipped: 4,
  Delivered: 5,
};

const ALIAS_TO_CANON: { test: (s: string) => boolean; canon: string }[] = [
  { test: (s) => s === 'awaitingpayment', canon: 'AwaitingPayment' },
  { test: (s) => s === 'pending', canon: 'Pending' },
  { test: (s) => s === 'chờ xử lý' || s === 'cho xu ly', canon: 'Pending' },
  { test: (s) => s === 'confirmed', canon: 'Confirmed' },
  { test: (s) => s === 'đã xác nhận' || s === 'da xac nhan', canon: 'Confirmed' },
  { test: (s) => s === 'processing', canon: 'Processing' },
  { test: (s) => s === 'đang xử lý' || s === 'dang xu ly', canon: 'Processing' },
  { test: (s) => s === 'shipped', canon: 'Shipped' },
  { test: (s) => s === 'đang giao' || s === 'dang giao', canon: 'Shipped' },
  { test: (s) => s === 'delivered', canon: 'Delivered' },
  {
    test: (s) =>
      s === 'hoàn thành' ||
      s === 'hoan thanh' ||
      s === 'completed' ||
      s.includes('hoàn thành'),
    canon: 'Delivered',
  },
  {
    test: (s) => s === 'cancelled' || s === 'canceled' || s === 'đã hủy' || s === 'da huy',
    canon: 'Cancelled',
  },
];

/** Chuẩn hóa về một trong ORDER_STATUS_RANK + Cancelled; null = không nhận diện. */
export function canonicalOrderStatus(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  if (t === 'Cancelled') return 'Cancelled';
  if (ORDER_STATUS_RANK[t] !== undefined) return t;
  const low = t.toLowerCase().trim();
  for (const { test, canon } of ALIAS_TO_CANON) {
    if (test(low)) return canon;
  }
  return null;
}

function rankOf(canon: string): number | undefined {
  if (canon === 'Cancelled') return -1;
  return ORDER_STATUS_RANK[canon];
}

/**
 * Admin: chỉ cho phép tiến bậc (hoặc giữ nguyên), hoặc chuyển sang Cancelled (trừ khi đã giao/hủy).
 * Đơn Delivered / Cancelled: không đổi trạng thái nữa.
 */
export function assertAdminOrderStatusTransition(
  previousRaw: string | undefined | null,
  nextRaw: string | undefined | null,
): string {
  const prevCanon = canonicalOrderStatus(previousRaw);
  const nextCanon = canonicalOrderStatus(nextRaw);
  if (!nextCanon) {
    throw new BadRequestException('Trạng thái đơn hàng mới không hợp lệ.');
  }
  if (!prevCanon) {
    throw new BadRequestException('Trạng thái đơn hàng hiện tại không hợp lệ — không thể cập nhật.');
  }

  if (prevCanon === nextCanon) {
    return nextCanon;
  }

  if (prevCanon === 'Delivered') {
    throw new BadRequestException(
      'Đơn đã hoàn thành — không thể đổi trạng thái.',
    );
  }
  if (prevCanon === 'Cancelled') {
    throw new BadRequestException('Đơn đã hủy — không thể đổi trạng thái.');
  }

  if (nextCanon === 'Cancelled') {
    return nextCanon;
  }

  const rp = rankOf(prevCanon);
  const rn = rankOf(nextCanon);
  if (rp === undefined || rn === undefined || rn < 0) {
    throw new BadRequestException('Trạng thái đơn hàng không hợp lệ.');
  }

  if (rn < rp) {
    throw new BadRequestException(
      'Không thể chuyển đơn về trạng thái trước (chỉ được tiến theo quy trình: Chờ thanh toán → Chờ xử lý → Đã xác nhận → … → Hoàn thành).',
    );
  }

  return nextCanon;
}
