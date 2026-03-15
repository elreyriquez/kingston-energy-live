import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEnergy(kwh: number) {
  return new Intl.NumberFormat('en-JM', { style: 'decimal', maximumFractionDigits: 0 }).format(kwh) + ' kWh';
}

export function formatWeight(kg: number) {
  return new Intl.NumberFormat('en-JM', { style: 'decimal', maximumFractionDigits: 0 }).format(kg) + ' kg';
}
