'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { Ingredient } from '../types';


type AddFoodProps = {
  onAddFood?: (item: Ingredient) => void;
};

type PantryItem = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiration: string;
  storage: string;
  notes: string;
  createdAt: string;
};

export default function AddFood({ onAddFood }: AddFoodProps) {
  
  const [loading, setLoading] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [user, setUser] = useState<any>(null);

  const [food, setFood] = useState({
    name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: ''
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);
  
  useEffect(() => {
    if (!user) {
      setPantryItems([]);
      return;
    }

    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', user.uid)
    );

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const items: PantryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PantryItem);
      });
      items.sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());
      setPantryItems(items);
    });

    return () => {
      unsubscribeFirestore();
    }
  }, [user]);
  

  const handleSubmit = async () => {
    if (!food.name || !food.category || !food.expiration || !food.storage) {
      alert('Please fill in all required fields');
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in first!');
      return;
    }

    setLoading(true);

    try {
      const quantityLabel = [food.quantity, food.unit].filter(Boolean).join(' ');
      const expiryEstimate = food.expiration ? `Expires ${food.expiration}` : undefined;

      const docRef = await addDoc(collection(db, 'pantryItems'), {
        name: food.name,
        category: food.category,
        quantity: food.quantity,
        unit: food.unit,
        expiration: food.expiration,
        storage: food.storage,
        notes: food.notes,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('Document written with ID:', docRef.id);

      setFood({ 
        name: '', 
        category: '', 
        quantity: '', 
        unit: '', 
        expiration: '', 
        storage: '', 
        notes: '' 
      });

    } catch (error) {
      console.error('Error adding food to Firestore:', error);
      alert('Failed to add food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteDoc(doc(db, 'pantryItems', itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item.');
    }
  };

  const update = (field: string, value: string) => setFood({ ...food, [field]: value });

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      dairy: '🥛',
      meat: '🍗',
      fruits: '🍎',
      vegetables: '🥕',
      grains: '🌾',
      frozen: '❄️',
      other: '📦'
    };
    return emojis[category] || '📦';
  };

  const getStorageEmoji = (storage: string) => {
    const emojis: { [key: string]: string } = {
      fridge: '🧊',
      freezer: '❄️',
      pantry: '🗄️',
      counter: '🏠'
    };
    return emojis[storage] || '📦';
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationColor = (days: number) => {
    if (days < 0) return 'bg-red-100 border-red-300 text-red-700';
    if (days <= 3) return 'bg-orange-100 border-orange-300 text-orange-700';
    if (days <= 7) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    return 'bg-green-100 border-green-300 text-green-700';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="text-green-600">Add Food to your Pantry!</span>
        </h1>
        <p className="text-gray-700">Track your food and expiration dates</p>
      </div>

      {/* Form */}
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-green-200 space-y-5">
        
        {/* Food Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Food Name *</label>
          <input 
            type="text" 
            value={food.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g., Milk, Chicken, Tomatoes"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Category *</label>
          <select 
            value={food.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
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
            <label className="block text-gray-700 font-semibold mb-2">Quantity</label>
            <input 
              type="number" 
              value={food.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              placeholder="1, 2, 5..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Unit</label>
            <select 
              value={food.unit}
              onChange={(e) => update('unit', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
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
          <label className="block text-gray-700 font-semibold mb-2">Expiration Date *</label>
          <input 
            type="date" 
            value={food.expiration}
            onChange={(e) => update('expiration', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none"
          />
        </div>

        {/* Storage Location */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Storage Location *</label>
          <select 
            value={food.storage}
            onChange={(e) => update('storage', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
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
          <label className="block text-gray-700 font-semibold mb-2">Notes</label>
          <textarea 
            value={food.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-400 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? '⏳ Adding...' : '➕ Add to Pantry'}
          </button>
          <button 
            onClick={() => setFood({ name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: '' })}
            className="flex-1 px-6 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-blue-900 mb-3">💡 Quick Tips</h3>
        <ul className="space-y-1 text-gray-700">
          <li>• Check packaging for "Best By" dates</li>
          <li>• Store items properly to maximize freshness</li>
          <li>• Get reminders before food expires!</li>
        </ul>
      </div>

      {/* Pantry Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-800">
            🗄️ Your Pantry
          </h2>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
            {pantryItems.length} item{pantryItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {pantryItems.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 text-center shadow-lg border-2 border-gray-200">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-600 text-lg">Your pantry is empty!</p>
            <p className="text-gray-500 mt-2">Add items above to start tracking your food.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pantryItems.map((item) => {
              const daysUntilExpiration = getDaysUntilExpiration(item.expiration);
              const expirationColorClass = getExpirationColor(daysUntilExpiration);

              return (
                <div 
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 shadow-lg border-2 ${expirationColorClass} transition-all hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCategoryEmoji(item.category)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                        {item.quantity && item.unit && (
                          <p className="text-sm text-gray-600">{item.quantity} {item.unit}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete item"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{getStorageEmoji(item.storage)}</span>
                      <span className="text-gray-700 capitalize">{item.storage}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className="font-semibold">
                        {daysUntilExpiration < 0 
                          ? `Expired ${Math.abs(daysUntilExpiration)} day${Math.abs(daysUntilExpiration) !== 1 ? 's' : ''} ago`
                          : daysUntilExpiration === 0
                          ? 'Expires today!'
                          : `Expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`
                        }
                      </span>
                    </div>

                    {item.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-gray-600 italic">"{item.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}