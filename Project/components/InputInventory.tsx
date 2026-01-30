'use client';

import React, { useState } from 'react';
import { generateExpirationDate } from '../services/expirationDateService';

export default function AddFood() {
  const [food, setFood] = useState({
    name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: ''
  });
  
  const [isGeneratingExpiration, setIsGeneratingExpiration] = useState(false);
  const [expirationError, setExpirationError] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{
    date: string;
    confidence: string;
    tips: string;
  } | null>(null);

  const handleAutoGenerateExpiration = async () => {
    if (!food.name) {
      setExpirationError('Please enter a food name first');
      return;
    }

    setIsGeneratingExpiration(true);
    setExpirationError('');
    
    try {
      const result = await generateExpirationDate({
        foodName: food.name,
        category: food.category,
        storage: food.storage,
        purchaseDate: new Date().toISOString().split('T')[0]
      });

      setFood({ ...food, expiration: result.estimatedExpirationDate });
      setAiSuggestion({
        date: result.estimatedExpirationDate,
        confidence: result.confidence,
        tips: result.storageTips || ''
      });
    } catch (error) {
      console.error('Error generating expiration date:', error);
      setExpirationError('Failed to generate expiration date. Please enter manually.');
    } finally {
      setIsGeneratingExpiration(false);
    }
  };

  const handleSubmit = () => {
    if (!food.name || !food.category || !food.expiration || !food.storage) {
      alert('Please fill in all required fields');
      return;
    }
    alert(`✅ ${food.name} added to pantry!`);
    setFood({ name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: '' });
    setAiSuggestion(null);
  };

  const update = (field: string, value: string) => {
    setFood({ ...food, [field]: value });
    if (field === 'name' || field === 'category' || field === 'storage') {
      setAiSuggestion(null);
    }
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

        {/* Expiration Date with AI Auto-Generate */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Expiration Date *</label>
          <div className="flex gap-2">
            <input 
              type="date" 
              value={food.expiration}
              onChange={(e) => update('expiration', e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAutoGenerateExpiration}
              disabled={isGeneratingExpiration || !food.name}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isGeneratingExpiration ? '🤖 Generating...' : '🤖 AI Auto-Fill'}
            </button>
          </div>
          
          {expirationError && (
            <p className="text-red-600 text-sm mt-2">{expirationError}</p>
          )}
          
          {aiSuggestion && (
            <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                🤖 AI Suggestion (Confidence: {aiSuggestion.confidence})
              </p>
              <p className="text-sm text-blue-800">
                Expires: {aiSuggestion.date}
              </p>
              {aiSuggestion.tips && (
                <p className="text-sm text-blue-700 mt-1">
                  💡 Tip: {aiSuggestion.tips}
                </p>
              )}
            </div>
          )}
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
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-400 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            ➕ Add to Pantry
          </button>
          <button 
            onClick={() => {
              setFood({ name: '', category: '', quantity: '', unit: '', expiration: '', storage: '', notes: '' });
              setAiSuggestion(null);
              setExpirationError('');
            }}
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
          <li>• Use the AI Auto-Fill button to get smart expiration date suggestions</li>
          <li>• Check packaging for "Best By" dates</li>
          <li>• Store items properly to maximize freshness</li>
          <li>• Get reminders before food expires!</li>
        </ul>
      </div>
    </div>
  );
}