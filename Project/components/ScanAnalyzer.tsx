'use client';

import { useState } from 'react';
import type { Ingredient, ScanMode } from '../types';
import { analyzeImage } from '../services/geminiService';

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

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
      <div
        className="rounded-2xl p-6 space-y-4 border"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
      >
        <h2 className="text-2xl font-bold" style={{ color: colors.olive }}>Scan Image</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMode('food')}
            className="px-4 py-2 rounded-full border-2 text-sm font-medium transition-all"
            style={
              mode === 'food'
                ? { backgroundColor: colors.terracotta, color: '#fff', borderColor: colors.terracotta }
                : { backgroundColor: 'rgba(255,255,255,0.5)', color: colors.olive, borderColor: colors.dustyRose + '60' }
            }
          >
            Fridge / Food Items
          </button>
          <button
            onClick={() => setMode('receipt')}
            className="px-4 py-2 rounded-full border-2 text-sm font-medium transition-all"
            style={
              mode === 'receipt'
                ? { backgroundColor: colors.steelBlue, color: '#fff', borderColor: colors.steelBlue }
                : { backgroundColor: 'rgba(255,255,255,0.5)', color: colors.olive, borderColor: colors.dustyRose + '60' }
            }
          >
            Receipt
          </button>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          style={{ color: colors.olive }}
          className="w-full"
        />
        {imageData && (
          <img src={imageData} alt="Uploaded preview" className="w-full rounded-xl" />
        )}
        {error && <p className="text-sm" style={{ color: colors.terracotta }}>{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: colors.dustyRose }}
        >
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </div>

      <div
        className="rounded-2xl p-6 space-y-3 border"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
      >
        <h3 className="text-xl font-bold" style={{ color: colors.olive }}>Detected Items</h3>
        {items.length === 0 ? (
          <p style={{ color: colors.olive, opacity: 0.7 }}>No results yet.</p>
        ) : (
          <ul className="list-disc list-inside" style={{ color: colors.olive }}>
            {items.map((item, idx) => (
              <li key={`${item.name}-${idx}`}>{formatIngredient(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
