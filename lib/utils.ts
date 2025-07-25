import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from 'bcryptjs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberWithDecimal = (num: number): string => {
  const [int, decimal] = num.toString().split('.')
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : int
}
// PROMPT: [ChatGTP] create toSlug ts arrow function that convert text to lowercase, remove non-word, non-whitespace, non-hyphen characters, replace whitespace, trim leading hyphens and trim trailing hyphens

export const toSlug = (text?: string): string =>
  String(text ?? '')
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')


const CURRENCY_FORMATTER = new Intl.NumberFormat('fr-TN', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})
export function formatCurrency(amount: number) {
  const formatted = CURRENCY_FORMATTER.format(amount);
  return `${formatted} DT`;
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number)
}

export function formatError(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export const round2 = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100

export const generateId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join('')

export function getDirection(locale: string) {
  return ['ar', 'he', 'fa', 'ur'].includes(locale) ? 'rtl' : 'ltr'
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10)
}

export function getValueString(val: any): string {
  if (typeof val === 'object' && val !== null) {
    return (val.label || val.value || '').toString().trim();
  }
  return (val || '').toString().trim();
}