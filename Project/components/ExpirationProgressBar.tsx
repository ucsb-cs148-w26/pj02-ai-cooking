'use client';

import type { PantryItem } from '@/types';

export type ExpirationStatus = 'expired' | 'expiring_soon' | 'fresh';

export function getExpirationStatus(expirationDate: string): {
  status: ExpirationStatus;
  text: string;
  color: string;
  dotColor: string;
  barColor: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(23, 59, 59, 999);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return {
      status: 'expired',
      text: 'Expired',
      color: 'bg-red-100 text-red-800',
      dotColor: 'bg-red-500',
      barColor: 'bg-red-500',
    };
  if (diffDays <= 3)
    return {
      status: 'expiring_soon',
      text: 'Expiring Soon',
      color: 'bg-orange-100 text-orange-800',
      dotColor: 'bg-orange-500',
      barColor: 'bg-orange-500',
    };
  return {
    status: 'fresh',
    text: 'Fresh',
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500',
    barColor: 'bg-blue-500',
  };
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const hour = d.getHours();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const min = d.getMinutes();
  return `${month} ${day} at ${hour12}:${min.toString().padStart(2, '0')}${ampm}`;
}

function getTimeRemainingText(expirationDate: string): string {
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffMs = exp.getTime() - now.getTime();

  if (diffMs <= 0) {
    const days = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    if (days > 0) return `Expired ${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `Expired ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return 'Expired';
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  return parts.length > 0 ? `${parts.join(', ')} left` : 'Less than 1 hour left';
}

function getProgressPercent(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

interface ExpirationProgressBarProps {
  item: PantryItem;
  onDelete?: (id: string) => void;
}

export function ExpirationProgressBar({ item, onDelete }: ExpirationProgressBarProps) {
  const startDate = item.createdAt || (() => {
    const exp = new Date(item.expiration);
    exp.setDate(exp.getDate() - 7);
    return exp.toISOString();
  })();
  const status = getExpirationStatus(item.expiration);
  const progress = getProgressPercent(startDate, item.expiration);
  const timeRemaining = getTimeRemainingText(item.expiration);
  const startFormatted = formatDateTime(startDate);
  const endFormatted = formatDateTime(item.expiration);

  return (
    <div className="border-b border-gray-200 py-4 first:pt-0 last:border-b-0">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate underline decoration-gray-300 hover:decoration-gray-500 cursor-default">
              {item.name}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${status.dotColor}`}
                title={status.text}
              />
              <span className="text-sm text-gray-600">{status.text}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-sm font-medium ${
                status.status === 'expired'
                  ? 'text-red-600'
                  : status.status === 'expiring_soon'
                    ? 'text-orange-600'
                    : 'text-gray-700'
              }`}
            >
              {timeRemaining}
            </span>
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Delete item"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${status.barColor} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>{startFormatted}</span>
          <span>{endFormatted}</span>
        </div>
      </div>
    </div>
  );
}
