'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/AuthProvider';
import type { PantryItem } from '@/types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ExpirationCalendarProps {
  onClose: () => void;
}

function getMonthDays(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function expirationToKey(exp: string): string {
  const s = exp.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ExpirationCalendar({ onClose }: ExpirationCalendarProps) {
  const currentUser = useAuthContext();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    if (!currentUser?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', currentUser.uid)
    );
    getDocs(q)
      .then((snap) => {
        const list: PantryItem[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.expiration) list.push({ id: doc.id, ...data } as PantryItem);
        });
        setItems(list);
      })
      .catch((err) => {
        console.error('ExpirationCalendar fetch error:', err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, PantryItem[]> = {};
    items.forEach((item) => {
      const key = expirationToKey(item.expiration);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = useMemo(() => getMonthDays(year, month), [year, month]);
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const goNext = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Expiration Calendar</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600">Sign in to see your expiration calendar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Expiration Calendar</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" title="Close">
          <X size={20} />
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goPrev}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
              aria-label="Previous month"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="font-semibold text-gray-800">{monthLabel}</span>
            <button
              onClick={goNext}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
              aria-label="Next month"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr>
                {dayNames.map((name) => (
                  <th key={name} className="text-gray-500 font-medium py-1">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => {
                    const dateKey =
                      day != null
                        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        : '';
                    const dayItems = dateKey ? itemsByDate[dateKey] ?? [] : [];
                    const isToday =
                      day != null &&
                      new Date().getFullYear() === year &&
                      new Date().getMonth() === month &&
                      new Date().getDate() === day;
                    return (
                      <td key={di} className="align-top border border-gray-100 p-1 min-w-[2rem]">
                        {day != null ? (
                          <div className="min-h-[3.5rem]">
                            <span
                              className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-gray-800 ${
                                isToday ? 'bg-blue-100 font-bold' : ''
                              }`}
                            >
                              {day}
                            </span>
                            {dayItems.length > 0 && (
                              <div className="mt-0.5 space-y-0.5">
                                {dayItems.slice(0, 2).map((item) => (
                                  <div
                                    key={item.id}
                                    className="text-xs truncate rounded px-1 py-0.5 bg-amber-50 text-amber-900"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </div>
                                ))}
                                {dayItems.length > 2 && (
                                  <div className="text-xs text-gray-500">+{dayItems.length - 2}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
