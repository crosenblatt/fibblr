/** Fibonacci mod 10 for length 3+. Length 2 is valid when |a−b| is 0 or 1. Length 1 is always a connector. */
export function isValidSequence(digits: number[]): boolean {
  if (digits.length <= 1) return true;
  if (digits.length === 2) {
    return Math.abs(digits[0]! - digits[1]!) <= 1;
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
