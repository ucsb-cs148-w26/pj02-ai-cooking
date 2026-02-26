'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { Ingredient } from '../types';
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
  const [imageData, setImageData] = useState<string>('');
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const uploadRequestId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const result = await analyzeImage(imageData);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void handleFile(e.dataTransfer.files[0] ?? null);
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 space-y-4 border"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
      >
        <h2 className="text-2xl font-bold" style={{ color: colors.olive }}>Scan Image</h2>
        <p className="text-sm" style={{ color: colors.olive, opacity: 0.75 }}>
          Upload a photo of food, your fridge, or a grocery receipt.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0] ?? null);
          }}
        />

        {imageData ? (
          <div className="relative group">
            <img src={imageData} alt="Uploaded preview" className="w-full rounded-xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <span className="text-white font-medium text-sm">Change photo</span>
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-colors"
            style={{
              borderColor: dragging ? colors.terracotta : colors.dustyRose,
              backgroundColor: dragging ? colors.cream : 'rgba(255,255,255,0.35)',
            }}
          >
            <Upload size={36} style={{ color: colors.terracotta }} />
            <span className="font-semibold" style={{ color: colors.olive }}>
              Tap to upload a photo
            </span>
            <span className="text-xs" style={{ color: colors.olive, opacity: 0.6 }}>
              or drag and drop an image here
            </span>
          </div>
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
