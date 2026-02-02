'use client';

import { useState } from 'react';
import type { Ingredient, ScanMode } from '../types';
import { analyzeImage } from '../services/geminiService';

const formatIngredient = (item: Ingredient) => {
  const details = [item.quantity, item.category, item.expiryEstimate]
    .filter(Boolean)
    .join(' · ');
  return details ? `${item.name} (${details})` : item.name;
};

type ScanAnalyzerProps = {
  onAddItems?: (items: Ingredient[]) => void;
};

export default function ScanAnalyzer({ onAddItems }: ScanAnalyzerProps) {
  const [mode, setMode] = useState<ScanMode>('food');
  const [imageData, setImageData] = useState<string>('');
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageData(typeof reader.result === 'string' ? reader.result : '');
      setItems([]);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read the image.');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageData) {
      setError('Upload an image first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeImage(imageData, mode);
      setItems(result);
      if (result.length > 0) {
        onAddItems?.(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-2xl font-bold">Scan Image</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMode('food')}
            className={`px-4 py-2 rounded-full border-2 ${
              mode === 'food'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            Fridge / Food Items
          </button>
          <button
            onClick={() => setMode('receipt')}
            className={`px-4 py-2 rounded-full border-2 ${
              mode === 'receipt'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            Receipt
          </button>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="w-full"
        />
        {imageData && (
          <img src={imageData} alt="Uploaded preview" className="w-full rounded-xl" />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-xl font-bold">Detected Items</h3>
        {items.length === 0 ? (
          <p className="text-gray-600">No results yet.</p>
        ) : (
          <ul className="list-disc list-inside text-gray-700">
            {items.map((item, idx) => (
              <li key={`${item.name}-${idx}`}>{formatIngredient(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
