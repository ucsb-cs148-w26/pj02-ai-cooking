'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
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
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [editFood, setEditFood] = useState({
    name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

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
    // Show cached pantry immediately so reload doesn't show empty in Pantry tab
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
    // Name, category, expiration, and storage are required
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
      const nowIso = new Date().toISOString();
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
        createdAt: nowIso,
        updatedAt: nowIso,
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
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setPantryItems((prev) => {
        const updated = [newItem, ...prev];
        updated.sort(
          (a, b) =>
            new Date(a.expiration).getTime() -
            new Date(b.expiration).getTime()
        );
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
        notes: '',
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
      console.error('Error deleting item:', error);
      const err = error as { code?: string; message?: string };
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to delete item. Please try again.';
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. You may not have permission to delete this item.';
      } else if (err.code === 'not-found') {
        errorMessage = 'Item not found. It may have already been deleted.';
      } else if (err.message) {
        errorMessage = `Failed to delete: ${err.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const handleStartEdit = (item: PantryItem) => {
    setEditItem(item);
    setEditFood({
      name: item.name || '',
      category: item.category || '',
      quantity: item.quantity || '',
      unit: item.unit || '',
      expiration: item.expiration || '',
      storage: item.storage || '',
      notes: item.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    if (!editFood.name || !editFood.category || !editFood.expiration || !editFood.storage) {
      alert('Please fill in all required fields for the item.');
      return;
    }
    if (!user) {
      alert('Please log in first!');
      return;
    }

    setSavingEdit(true);
    const nowIso = new Date().toISOString();

    try {
      const itemRef = doc(db, 'pantryItems', editItem.id);
      await updateDoc(itemRef, {
        name: editFood.name,
        category: editFood.category,
        quantity: editFood.quantity,
        unit: editFood.unit,
        expiration: editFood.expiration,
        storage: editFood.storage,
        notes: editFood.notes,
        updatedAt: nowIso,
      });

      setPantryItems((prev) => {
        const updated = prev.map((item) =>
          item.id === editItem.id
            ? {
                ...item,
                name: editFood.name,
                category: editFood.category,
                quantity: editFood.quantity,
                unit: editFood.unit,
                expiration: editFood.expiration,
                storage: editFood.storage,
                notes: editFood.notes,
                updatedAt: nowIso,
              }
            : item
        );
        updated.sort(
          (a, b) =>
            new Date(a.expiration).getTime() -
            new Date(b.expiration).getTime()
        );
        savePantryFullToCache(user.uid, updated);
        return updated;
      });

      setEditItem(null);
    } catch (error) {
      console.error('Error updating food in Firestore:', error);
      alert('Failed to update item. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const update = (field: string, value: string) => setFood({ ...food, [field]: value });

  const inputStyle = { borderColor: '#CF9D8C60', color: '#515B3A' };

  return (
    <div className="max-w-6xl mx-auto" style={{ color: '#515B3A' }}>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#515B3A' }}>
          Add Food to your Pantry
        </h1>
        <p style={{ color: '#515B3A', opacity: 0.8 }}>Track your food and expiration dates</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-6 md:p-8 space-y-5 mb-12 border" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#CF9D8C40' }}>
        
        {/* Food Name */}
        <div>
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#515B3A' }}>Food Name *</label>
          <input 
            type="text" 
            value={food.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g., Milk, Chicken, Tomatoes"
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none placeholder:opacity-50"
            style={inputStyle}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#515B3A' }}>Category *</label>
          <select 
            value={food.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
            style={inputStyle}
          >
            <option value="">Select category</option>
            <option value="dairy">Dairy & Eggs</option>
            <option value="meat">Meat & Poultry</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
            <option value="grains">Grains & Bread</option>
            <option value="frozen">Frozen Foods</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2 text-sm" style={{ color: '#515B3A' }}>Quantity</label>
            <input 
              type="number" 
              value={food.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              placeholder="1, 2, 5..."
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none placeholder:opacity-50"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm" style={{ color: '#515B3A' }}>Unit</label>
            <select 
              value={food.unit}
              onChange={(e) => update('unit', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
              style={inputStyle}
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

        {/* Expiration Date */}
        <div>
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#515B3A' }}>Expiration Date *</label>
          <input 
            type="date" 
            value={food.expiration}
            onChange={(e) => update('expiration', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
            style={{ borderColor: '#C9706440', color: '#515B3A' }}
          />
        </div>

        {/* Storage Location */}
        <div>
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#515B3A' }}>Storage Location *</label>
          <select 
            value={food.storage}
            onChange={(e) => update('storage', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
            style={inputStyle}
          >
            <option value="">Select location</option>
            <option value="fridge">Refrigerator</option>
            <option value="freezer">Freezer</option>
            <option value="pantry">Pantry</option>
            <option value="counter">Counter</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold mb-2 text-sm" style={{ color: '#515B3A' }}>Notes</label>
          <textarea 
            value={food.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none resize-none placeholder:opacity-50"
            style={inputStyle}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-4 text-white font-bold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#C97064' }}
          >
            {loading ? 'Adding...' : 'Add to Pantry'}
          </button>
          <button 
            onClick={() => {
              setFood({ name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: '' });
            }}
            className="flex-1 px-6 py-4 font-semibold rounded-lg border-2 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: '#515B3A', borderColor: '#CF9D8C40' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Pantry Items with Expiration Progress */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold" style={{ color: '#515B3A' }}>Your Pantry Items</h2>
          {user && !isLoadingItems && (
            <div style={{ color: '#515B3A', opacity: 0.7 }}>
              {pantryItems.length} item{pantryItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {authLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent mx-auto" style={{ borderColor: '#C97064' }} />
            <p className="mt-4" style={{ color: '#515B3A' }}>Checking sign-in...</p>
          </div>
        ) : !user ? (
          <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderColor: '#CF9D8C40' }}>
            <p style={{ color: '#515B3A' }}>Sign in to see and add pantry items.</p>
          </div>
        ) : (
          <ExpirationReminders
            items={pantryItems}
            onDelete={handleDelete}
            onEdit={handleStartEdit}
            loading={isLoadingItems}
          />
        )}
      </div>
      
      {/* Edit modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-lg w-full rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#515B3A' }}>
              Edit Pantry Item
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-sm" style={{ color: '#515B3A' }}>
                  Food Name *
                </label>
                <input
                  type="text"
                  value={editFood.name}
                  onChange={(e) => setEditFood({ ...editFood, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none placeholder:opacity-50"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm" style={{ color: '#515B3A' }}>
                  Category *
                </label>
                <select
                  value={editFood.category}
                  onChange={(e) => setEditFood({ ...editFood, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                  style={inputStyle}
                >
                  <option value="">Select category</option>
                  <option value="dairy">Dairy & Eggs</option>
                  <option value="meat">Meat & Poultry</option>
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="grains">Grains & Bread</option>
                  <option value="frozen">Frozen Foods</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-sm" style={{ color: '#515B3A' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editFood.quantity}
                    onChange={(e) => setEditFood({ ...editFood, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none placeholder:opacity-50"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-sm" style={{ color: '#515B3A' }}>
                    Unit
                  </label>
                  <select
                    value={editFood.unit}
                    onChange={(e) => setEditFood({ ...editFood, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                    style={inputStyle}
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
                <label className="block font-semibold mb-1 text-sm" style={{ color: '#515B3A' }}>
                  Expiration Date *
                </label>
                <input
                  type="date"
                  value={editFood.expiration}
                  onChange={(e) => setEditFood({ ...editFood, expiration: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                  style={{ borderColor: '#C9706440', color: '#515B3A' }}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm" style={{ color: '#515B3A' }}>
                  Storage Location *
                </label>
                <select
                  value={editFood.storage}
                  onChange={(e) => setEditFood({ ...editFood, storage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                  style={inputStyle}
                >
                  <option value="">Select location</option>
                  <option value="fridge">Refrigerator</option>
                  <option value="freezer">Freezer</option>
                  <option value="pantry">Pantry</option>
                  <option value="counter">Counter</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm" style={{ color: '#515B3A' }}>
                  Notes
                </label>
                <textarea
                  value={editFood.notes}
                  onChange={(e) => setEditFood({ ...editFood, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none resize-none placeholder:opacity-50"
                  style={inputStyle}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditItem(null)}
                  type="button"
                  className="px-4 py-2 rounded-lg border-2 text-sm font-semibold"
                  style={{ borderColor: '#CF9D8C40', color: '#515B3A', backgroundColor: 'rgba(255,255,255,0.9)' }}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#C97064' }}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}