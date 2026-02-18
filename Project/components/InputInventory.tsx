'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, useAuth } from '../lib/firebase';
import type { PantryItem } from '../types';
import { ExpirationReminders } from './ExpirationReminders';

const PANTRY_FULL_CACHE_KEY = (uid: string) => `pantry_full_${uid}`;

function loadPantryFullFromCache(uid: string): PantryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PANTRY_FULL_CACHE_KEY(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PantryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePantryFullToCache(uid: string, items: PantryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PANTRY_FULL_CACHE_KEY(uid), JSON.stringify(items));
  } catch {
    // ignore
  }
}

type AddFoodProps = {
  onAddFood?: (item: PantryItem) => void;
};

export default function AddFood({ onAddFood }: AddFoodProps) {
  const { user, loading: authLoading } = useAuth();
  const [food, setFood] = useState({
    name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // Listen to pantry items in real time (only when user is signed in)
  useEffect(() => {
    if (authLoading) {
      setIsLoadingItems(true);
      return;
    }
    if (user === null) {
      setPantryItems([]);
      setIsLoadingItems(false);
      return;
    }

    const uid = user.uid;
    const cached = loadPantryFullFromCache(uid);
    if (cached.length > 0) {
      setPantryItems(cached);
    }

    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', uid)
    );

    setIsLoadingItems(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: PantryItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as PantryItem);
      });
      items.sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());
      setPantryItems(items);
      savePantryFullToCache(uid, items);
      setIsLoadingItems(false);
    }, (err) => {
      console.error('Error fetching pantry items:', err);
      setIsLoadingItems(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleSubmit = async () => {
    if (!food.name || !food.category || !food.expiration || !food.storage) {
      alert('Please fill in all required fields');
      return;
    }
    if (!user) {
      alert('Please log in first!');
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'pantryItems'), {
        name: food.name,
        category: food.category,
        quantity: food.quantity,
        unit: food.unit,
        expiration: food.expiration,
        storage: food.storage,
        notes: food.notes,
        userId: user.uid,
        userEmail: user.email ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const newItem: PantryItem = {
        id: docRef.id,
        name: food.name,
        category: food.category,
        quantity: food.quantity,
        unit: food.unit,
        expiration: food.expiration,
        storage: food.storage,
        notes: food.notes,
        userId: user.uid,
        userEmail: user.email ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setPantryItems(prev => {
        const updated = [newItem, ...prev];
        updated.sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());
        savePantryFullToCache(user.uid, updated);
        return updated;
      });

      if (onAddFood) {
        onAddFood(newItem);
      }

      setFood({ 
        name: '', 
        category: '', 
        quantity: '', 
        unit: '', 
        expiration: '', 
        storage: '', 
        notes: '' 
      });

      console.log('Document written with ID:', docRef.id);

    } catch (error) {
      console.error('Error adding food to Firestore:', error);
      alert('Failed to add food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    if (!user) {
      alert('You must be signed in to delete items.');
      return;
    }

    if (!id) {
      console.error('Delete failed: Item ID is missing');
      alert('Failed to delete item: Invalid item ID.');
      return;
    }

    try {
      console.log('Attempting to delete item with ID:', id);
      const itemRef = doc(db, 'pantryItems', id);
      await deleteDoc(itemRef);
      
      setPantryItems(prev => {
        const updated = prev.filter(item => item.id !== id);
        if (user) savePantryFullToCache(user.uid, updated);
        return updated;
      });
      console.log('Item deleted successfully');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Error deleting item:', err);
      
      let errorMessage = 'Failed to delete item. Please try again.';
      if (err?.code === 'permission-denied') {
        errorMessage = 'Permission denied. You may not have permission to delete this item.';
      } else if (err?.code === 'not-found') {
        errorMessage = 'Item not found. It may have already been deleted.';
      } else if (err?.message) {
        errorMessage = `Failed to delete: ${err.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const update = (field: string, value: string) => setFood({ ...food, [field]: value });

  return (
    <div className="max-w-6xl mx-auto text-gray-900">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-900">
          <span className="text-green-600">Add Food to your Pantry!</span>
        </h1>
        <p className="text-gray-800">Track your food and expiration dates</p>
      </div>

      {/* Form */}
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-green-200 space-y-5 mb-12 text-gray-900">
        
        <div>
          <label className="block text-gray-900 font-semibold mb-2">Food Name *</label>
          <input 
            type="text" 
            value={food.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g., Milk, Chicken, Tomatoes"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-900 placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-gray-900 font-semibold mb-2">Category *</label>
          <select 
            value={food.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-900"
          >
            <option value="">Select category</option>
            <option value="dairy">🥛 Dairy & Eggs</option>
            <option value="meat">🍗 Meat & Poultry</option>
            <option value="fruits">🍎 Fruits</option>
            <option value="vegetables">🥕 Vegetables</option>
            <option value="grains">🌾 Grains & Bread</option>
            <option value="frozen">❄️ Frozen Foods</option>
            <option value="other">📦 Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-900 font-semibold mb-2">Quantity</label>
            <input 
              type="number" 
              value={food.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              placeholder="1, 2, 5..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-gray-900 font-semibold mb-2">Unit</label>
            <select 
              value={food.unit}
              onChange={(e) => update('unit', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-900"
            >
              <option value="">Select unit</option>
              <option value="piece">Piece(s)</option>
              <option value="lb">Pounds</option>
              <option value="kg">Kilograms</option>
              <option value="cup">Cups</option>
              <option value="box">Box(es)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-900 font-semibold mb-2">Expiration Date *</label>
          <input 
            type="date" 
            value={food.expiration}
            onChange={(e) => update('expiration', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-gray-900"
          />
        </div>

        <div>
          <label className="block text-gray-900 font-semibold mb-2">Storage Location *</label>
          <select 
            value={food.storage}
            onChange={(e) => update('storage', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-900"
          >
            <option value="">Select location</option>
            <option value="fridge">🧊 Refrigerator</option>
            <option value="freezer">❄️ Freezer</option>
            <option value="pantry">🗄️ Pantry</option>
            <option value="counter">🏠 Counter</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-900 font-semibold mb-2">Notes</label>
          <textarea 
            value={food.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-gray-900 placeholder:text-gray-500"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-400 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : '➕ Add to Pantry'}
          </button>
          <button 
            onClick={() => setFood({ name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: '' })}
            className="flex-1 px-6 py-4 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Pantry Items with Expiration Progress */}
      <div className="mb-12 text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Your Pantry Items</h2>
          {user && !isLoadingItems && (
            <div className="text-gray-800">
              {pantryItems.length} item{pantryItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {authLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-800">Checking sign-in...</p>
          </div>
        ) : !user ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 text-center border-2 border-gray-200">
            <p className="text-gray-800">Sign in to see and add pantry items.</p>
          </div>
        ) : (
          <ExpirationReminders
            items={pantryItems}
            onDelete={handleDelete}
            loading={isLoadingItems}
          />
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 shadow-lg text-gray-900">
        <h3 className="text-xl font-bold text-blue-900 mb-3">💡 Quick Tips</h3>
        <ul className="space-y-1 text-gray-800">
          <li>• Check packaging for "Best By" dates</li>
          <li>• Store items properly to maximize freshness</li>
          <li>• Get reminders before food expires!</li>
          <li>• Click the trash icon to remove items you've used</li>
        </ul>
      </div>
    </div>
  );
}
