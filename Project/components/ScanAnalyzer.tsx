'use client';

import { useState } from 'react';
import type { Ingredient, ScanMode } from '../types';
import { analyzeImage, getApiKey, hasValidApiKey, setStoredApiKey } from '../services/geminiService';

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
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey() ?? '');
  const [hasKey, setHasKey] = useState(hasValidApiKey());
  const [mode, setMode] = useState<ScanMode>('food');
  const [imageData, setImageData] = useState<string>('');
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = hasKey ? 'Key saved' : 'No key saved';

  const saveKey = () => {
    const trimmed = apiKeyInput.trim();
    setStoredApiKey(trimmed);
    setHasKey(Boolean(trimmed));
    setError(null);
  };

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
    if (!hasValidApiKey()) {
      setError('Please save a Gemini API key first.');
      return;
    }
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
    <div className="space-y-6 text-gray-900">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-4 text-gray-900">
        <h2 className="text-2xl font-bold text-gray-900">Gemini API Key</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Paste your Gemini API key"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-gray-900 placeholder:text-gray-500"
          />
          <button
            onClick={saveKey}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Save Key
          </button>
        </div>
        <p className="text-sm text-gray-700">Status: {status}</p>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-4 text-gray-900">
        <h2 className="text-2xl font-bold text-gray-900">Scan Image</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMode('food')}
            className={`px-4 py-2 rounded-full border-2 ${
              mode === 'food'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            Fridge / Food Items
          </button>
          <button
            onClick={() => setMode('receipt')}
            className={`px-4 py-2 rounded-full border-2 ${
              mode === 'receipt'
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            Receipt
          </button>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="w-full text-gray-900"
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

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-3 text-gray-900">
        <h3 className="text-xl font-bold text-gray-900">Detected Items</h3>
        {items.length === 0 ? (
          <p className="text-gray-700">No results yet.</p>
        ) : (
          <ul className="list-disc list-inside text-gray-800">
            {items.map((item, idx) => (
              <li key={`${item.name}-${idx}`}>{formatIngredient(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
