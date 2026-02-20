import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExpirationReminders } from './ExpirationReminders';
import type { PantryItem } from '@/types';

function makeItem(overrides: Partial<PantryItem>): PantryItem {
  return {
    id: 'item-1',
    name: 'Milk',
    category: 'Dairy',
    expiration: '2099-01-05T10:00:00.000Z',
    storage: 'Fridge',
    userId: 'user-1',
    createdAt: '2098-12-29T10:00:00.000Z',
    updatedAt: '2098-12-29T10:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('ExpirationReminders', () => {
  it('shows empty-state UI when there are no pantry items', () => {
    render(<ExpirationReminders items={[]} />);

    expect(screen.getByText('Your pantry is empty!')).toBeTruthy();
    expect(screen.getByText('Add your first food item using the form above.')).toBeTruthy();
  });

  it('renders items sorted by nearest expiration date first', () => {
    const items: PantryItem[] = [
      makeItem({
        id: 'later-item',
        name: 'Yogurt',
        expiration: '2099-01-10T10:00:00.000Z',
      }),
      makeItem({
        id: 'sooner-item',
        name: 'Spinach',
        expiration: '2099-01-03T10:00:00.000Z',
      }),
    ];

    render(<ExpirationReminders items={items} />);

    expect(screen.getByText('(2 items)')).toBeTruthy();
    const itemHeadings = screen.getAllByRole('heading', { level: 3 });
    const headingNames = itemHeadings.map((heading) => heading.textContent?.trim());
    expect(headingNames).toEqual(['Spinach', 'Yogurt']);
  });

  it('calls onDelete with the selected item id', () => {
    const onDelete = vi.fn();
    const item = makeItem({ id: 'delete-me', name: 'Cheese' });

    render(<ExpirationReminders items={[item]} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('delete-me');
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
