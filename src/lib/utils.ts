import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKzt(amount: number | null | undefined, fallback: string): string {
  if (amount === null || amount === undefined) return fallback;
  return `${new Intl.NumberFormat('ru-KZ').format(amount)} ₸`;
}
