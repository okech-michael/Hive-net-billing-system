import { BadRequestException } from '@nestjs/common';
import { normalizeKenyanPhone } from './phone';

describe('normalizeKenyanPhone', () => {
  it.each([
    ['0712 345 678', '254712345678'],
    ['+254 712 345 678', '254712345678'],
    ['712345678', '254712345678'],
    ['0112345678', '254112345678'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeKenyanPhone(input)).toBe(expected);
  });

  it.each(['123', '254312345678', '25471234567', '2547123456789', 'not-a-number'])('rejects invalid input %s', (input) => {
    expect(() => normalizeKenyanPhone(input)).toThrow(BadRequestException);
  });
});
