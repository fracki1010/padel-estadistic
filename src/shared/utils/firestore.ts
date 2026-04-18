import { Timestamp } from 'firebase/firestore';

export const toISOString = (value: Timestamp | string | Date | undefined | null): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
};

export const nowIso = () => new Date().toISOString();
