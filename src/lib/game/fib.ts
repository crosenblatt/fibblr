/** Circular distance on digits 0–9, so 9 and 0 are 1 apart. */
function digitStep(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 10 - d);
}

/** Fibonacci mod 10 for length 3+. Length 2 is valid when the digits are 1 apart (9–0 wraps). Length 1 is always a connector. */
export function isValidSequence(digits: number[]): boolean {
  if (digits.length <= 1) return true;
  if (digits.length === 2) {
    return digitStep(digits[0]!, digits[1]!) === 1;
  }
  return isFibSequence(digits);
}

export function isFibSequence(digits: number[]): boolean {
  if (digits.length < 3) return false;
  for (let i = 2; i < digits.length; i++) {
    if (digits[i] !== (digits[i - 1] + digits[i - 2]) % 10) {
      return false;
    }
  }
  return true;
}

export function isDigit(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 9;
}
