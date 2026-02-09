'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, useAuth } from '../lib/firebase';
import type { PantryItem } from '../types';

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

    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', user.uid)
    );

    setIsLoadingItems(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: PantryItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as PantryItem);
      });
      items.sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());
      setPantryItems(items);
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

      // Update local state
      setPantryItems(prev => {
        const updated = [newItem, ...prev];
        updated.sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());
        return updated;
      });

      // Call the callback if provided
      if (onAddFood) {
        onAddFood(newItem);
      }

      // Clear form
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

    try {
      await deleteDoc(doc(db, 'pantryItems', id));
      setPantryItems(prev => prev.filter(item => item.id !== id));
      console.log('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'dairy': '🥛',
      'meat': '🍗',
      'fruits': '🍎',
      'vegetables': '🥕',
      'grains': '🌾',
      'frozen': '❄️',
      'other': '📦'
    };
    return icons[category] || '📦';
  };

  const getStorageIcon = (storage: string) => {
    const icons: Record<string, string> = {
      'fridge': '🧊',
      'freezer': '❄️',
      'pantry': '🗄️',
      'counter': '🏠'
    };
    return icons[storage] || '🗄️';
  };

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    if (diffDays <= 3) return { text: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
    if (diffDays <= 7) return { text: 'This Week', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Fresh', color: 'bg-green-100 text-green-800' };
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
        
        {/* Food Name */}
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

        {/* Category */}
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

        {/* Quantity & Unit */}
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

        {/* Expiration Date */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">Expiration Date *</label>
          <input 
            type="date" 
            value={food.expiration}
            onChange={(e) => update('expiration', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-gray-900"
          />
        </div>

        {/* Storage Location */}
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

        {/* Notes */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">Notes</label>
          <textarea 
            value={food.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none resize-none text-gray-900 placeholder:text-gray-500"
          />
        </div>

        {/* Buttons */}
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

      {/* Pantry Items Display */}
      <div className="mb-12 text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Your Pantry Items</h2>
          <div className="text-gray-800">
            {isLoadingItems ? 'Loading...' : `${pantryItems.length} item${pantryItems.length !== 1 ? 's' : ''}`}
          </div>
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
        ) : isLoadingItems ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-800">Loading your pantry items...</p>
          </div>
        ) : pantryItems.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 text-center border-2 border-gray-200">
            <div className="text-6xl mb-4">🥘</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your pantry is empty!</h3>
            <p className="text-gray-800">Add your first food item using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pantryItems.map((item) => {
              const status = getExpirationStatus(item.expiration);
              const formattedDate = new Date(item.expiration).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div 
                  key={item.id} 
                  className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-xl text-gray-900"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCategoryIcon(item.category)}</span>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
                        <p className="text-gray-700 text-sm">
                          {item.quantity} {item.unit} • {getStorageIcon(item.storage)} {item.storage}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete item"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      {status.text}
                    </div>

                    <div className="flex items-center text-gray-700">
                      <span className="mr-2">📅</span>
                      <span>Expires: {formattedDate}</span>
                    </div>

                    {item.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">📝 {item.notes}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                      Added: {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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