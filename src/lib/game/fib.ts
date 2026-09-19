/** Classic Fibonacci modulo 10. Length 1–2 is a legal connector, not a fib word. */
export function isFibSequence(digits: number[]): boolean {
  if (digits.length < 3) return true;
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
