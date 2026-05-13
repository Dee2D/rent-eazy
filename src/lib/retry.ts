/** Exponential-backoff retry utility for unreliable I/O. */

interface RetryOptions {
  maxAttempts?: number;
  delayMs?:     number;
  backoff?:     number;   // multiplier per attempt
  onRetry?:     (attempt: number, error: unknown) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, delayMs = 500, backoff = 2, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;
      onRetry?.(attempt, err);
      await sleep(delayMs * Math.pow(backoff, attempt - 1));
    }
  }

  throw lastError;
}
