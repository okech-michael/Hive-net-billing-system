import { BadRequestException } from '@nestjs/common';

export function normalizeKenyanPhone(input: string): string {
  const digits = input.replace(/[\s()+-]/g, '');
  const normalized = digits.startsWith('0') ? `254${digits.slice(1)}` : digits.startsWith('254') ? digits : `254${digits}`;
  if (!/^254[17]\d{8}$/.test(normalized)) throw new BadRequestException('Enter a valid Kenyan mobile number');
  return normalized;
}
