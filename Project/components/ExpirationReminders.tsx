'use client';

import { ExpirationProgressBar, getExpirationStatus } from './ExpirationProgressBar';
import type { PantryItem } from '@/types';

interface ExpirationRemindersProps {
  items: PantryItem[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

const EXPIRING_SOON_DAYS = 3;

function isExpiredOrExpiringSoon(item: PantryItem): boolean {
  const status = getExpirationStatus(item.expiration);
  return status.status === 'expired' || status.status === 'expiring_soon';
}

export function ExpirationReminders({
  items,
  onDelete,
  loading = false,
}: ExpirationRemindersProps) {
  const reminderItems = items
    .filter(isExpiredOrExpiringSoon)
    .sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-orange-100 text-gray-900 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800">
          ⏰ Expiration Reminders
        </h2>
        <p className="text-gray-600">Loading reminders...</p>
      </div>
    );
  }

  if (reminderItems.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-green-100 text-gray-900 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800">
          ✅ Expiration Reminders
        </h2>
        <p className="text-gray-600">
          No items expiring in the next {EXPIRING_SOON_DAYS} days. You&apos;re all set!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-orange-200 text-gray-900 mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800">
        ⏰ Expiration Reminders
        <span className="ml-2 text-sm font-normal text-orange-600">
          ({reminderItems.length} item{reminderItems.length !== 1 ? 's' : ''} need attention)
        </span>
      </h2>
      <div className="space-y-0 divide-y divide-gray-100">
        {reminderItems.map((item) => (
          <ExpirationProgressBar
            key={item.id}
            item={item}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
