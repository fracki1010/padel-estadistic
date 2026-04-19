import { Timestamp } from 'firebase/firestore';

export const toISOString = (value: Timestamp | string | Date | undefined | null): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
};

export const nowIso = () => new Date().toISOString();

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = 10000,
  message = 'Tiempo de espera agotado al conectar con Firestore'
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
