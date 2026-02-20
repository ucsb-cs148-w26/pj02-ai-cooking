'use client';

import { useRef, useState } from 'react';
import type { Ingredient, ScanMode } from '../types';
import { analyzeImage } from '../services/geminiService';

const MAX_IMAGE_DIMENSION = 1280;
const COMPRESSED_IMAGE_QUALITY = 0.72;

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read the image.'));
    };
    reader.onerror = () => reject(new Error('Failed to read the image.'));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode the image.'));
    image.src = src;
  });

const optimizeImage = async (file: File): Promise<string> => {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(originalDataUrl);
  const longestSide = Math.max(image.width, image.height);

  if (longestSide <= MAX_IMAGE_DIMENSION) {
    return originalDataUrl;
  }

  const scale = MAX_IMAGE_DIMENSION / longestSide;
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', COMPRESSED_IMAGE_QUALITY);
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
  const [preparingImage, setPreparingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadRequestId = useRef(0);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    const requestId = ++uploadRequestId.current;
    setPreparingImage(true);
    setError(null);
    try {
      const optimizedImage = await optimizeImage(file);
      if (requestId !== uploadRequestId.current) {
        return;
      }
      setImageData(optimizedImage);
      setItems([]);
    } catch (err) {
      if (requestId !== uploadRequestId.current) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to process the image.');
    } finally {
      if (requestId === uploadRequestId.current) {
        setPreparingImage(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!imageData) {
      setError('Upload an image first.');
      return;
    }
    if (preparingImage) {
      setError('Please wait for image optimization to finish.');
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
          onChange={(e) => {
            void handleFile(e.target.files?.[0] ?? null);
          }}
          style={{ color: colors.olive }}
          className="w-full"
        />
        {imageData && (
          <img src={imageData} alt="Uploaded preview" className="w-full rounded-xl" />
        )}
        {error && <p className="text-sm" style={{ color: colors.terracotta }}>{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading || preparingImage}
          className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: colors.dustyRose }}
        >
          {preparingImage ? 'Preparing image...' : loading ? 'Analyzing...' : 'Analyze Image'}
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
