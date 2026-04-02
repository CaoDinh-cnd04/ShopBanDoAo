/**
 * Chuẩn hóa địa chỉ giao hàng thành một chuỗi cố định 6 phần (phân tách ` | `),
 * để parse lại đúng thứ tự kể cả khi một số trường để trống.
 * Thứ tự: fullName | phone | address | district | city | note
 */
function toPart(v: unknown): string {
  if (v == null) return '';
  if (
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean'
  ) {
    return String(v).trim();
  }
  return '';
}

/** Từ object checkout → một dòng lưu DB */
export function serializeShippingAddressInput(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return [
      toPart(o.fullName),
      toPart(o.phone),
      toPart(o.address),
      toPart(o.district),
      toPart(o.city),
      toPart(o.note),
    ].join(' | ');
  }
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
}

export type ParsedPipeShipping = {
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  district: string;
  city: string;
  noteInPipe: string;
};

/** Parse chuỗi do serializeShippingAddressInput / formatShippingAddressToString tạo ra */
export function parsePipeShippingParts(s: string): ParsedPipeShipping | null {
  if (s == null || typeof s !== 'string') return null;
  const t = s.trim();
  if (!t) return null;
  const parts = t.split(' | ').map((x) => x.trim());
  if (parts.length < 3) return null;
  return {
    receiverName: parts[0] || '',
    receiverPhone: parts[1] || '',
    addressLine: parts[2] || '',
    district: parts[3] || '',
    city: parts[4] || '',
    noteInPipe: parts[5] || '',
  };
}
