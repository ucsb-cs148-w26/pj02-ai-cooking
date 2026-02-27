'use client';

import { ExpirationProgressBar } from './ExpirationProgressBar';
import type { PantryItem } from '@/types';

interface ExpirationRemindersProps {
  items: PantryItem[];
  onDelete?: (id: string) => void;
  onEdit?: (item: PantryItem) => void;
  loading?: boolean;
}

export function ExpirationReminders({
  items,
  onDelete,
  onEdit,
  loading = false,
}: ExpirationRemindersProps) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime()
  );

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

  if (sortedItems.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 text-center border-2 border-gray-200">
        <div className="text-6xl mb-4">🥘</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your pantry is empty!</h3>
        <p className="text-gray-800">Add your first food item using the form above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-orange-200 text-gray-900 mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800">
        ⏰ Expiration Reminders
        <span className="ml-2 text-sm font-normal text-orange-600">
          ({sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''})
        </span>
      </h2>
      <div className="space-y-0 divide-y divide-gray-100">
        {sortedItems.map((item) => (
          <ExpirationProgressBar
            key={item.id}
            item={item}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
