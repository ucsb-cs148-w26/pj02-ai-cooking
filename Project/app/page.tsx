'use client';

import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import AddFood from '@/components/InputInventory';
import ScanAnalyzer from '@/components/ScanAnalyzer';
import RecipeGenerator from '@/components/RecipeGenerator';
import type { Ingredient, PantryItem } from '@/types';
import { db, useAuth } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const PANTRY_CACHE_KEY = (uid: string) => `pantry_${uid}`;

function loadPantryFromCache(uid: string): Ingredient[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PANTRY_CACHE_KEY(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Ingredient[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePantryToCache(uid: string, items: Ingredient[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PANTRY_CACHE_KEY(uid), JSON.stringify(items));
  } catch {
    // ignore
  }
}

/**
 * Derives an expiration date (YYYY-MM-DD) from expiryEstimate.
 * Handles formats like "3 days", "1 week", "2 weeks", or "YYYY-MM-DD".
 */
function deriveExpirationFromEstimate(expiryEstimate?: string): string {
  if (!expiryEstimate || !expiryEstimate.trim()) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }
  const s = expiryEstimate.trim().toLowerCase();

  // Already a date (YYYY-MM-DD)
  const dateMatch = s.match(/^\d{4}-\d{2}-\d{2}$/);
  if (dateMatch) return s;

  // Relative: "3 days", "1 week", "2 weeks"
  const daysMatch = s.match(/(\d+)\s*days?/);
  if (daysMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(daysMatch[1], 10));
    return d.toISOString().split('T')[0];
  }
  const weeksMatch = s.match(/(\d+)\s*weeks?/);
  if (weeksMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(weeksMatch[1], 10) * 7);
    return d.toISOString().split('T')[0];
  }

  // Default: 7 days
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const { user: currentUser, loading: authLoading } = useAuth();
  const [loadingPantry, setLoadingPantry] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const uid = currentUser?.uid ?? null;

    const fetchPantryItems = async () => {
      if (uid) {
        previousUserIdRef.current = uid;
        const cached = loadPantryFromCache(uid);
        if (cached.length > 0) setPantryItems(cached);
        setLoadingPantry(true);
        try {
          const q = query(
            collection(db, 'pantryItems'),
            where('userId', '==', uid)
          );
          const querySnapshot = await getDocs(q);
          const items: Ingredient[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              name: data.name ?? '',
              quantity: data.quantity,
              category: data.category,
              expiryEstimate: data.expiration ? `Expires ${data.expiration}` : data.expiryEstimate,
            } as Ingredient);
          });
          setPantryItems(items);
          savePantryToCache(uid, items);
        } catch (error) {
          console.error('Error fetching pantry items:', error);
        } finally {
          setLoadingPantry(false);
        }
      } else {
        if (previousUserIdRef.current !== null) {
          previousUserIdRef.current = null;
          setPantryItems([]);
        }
        setLoadingPantry(false);
      }
    };

    fetchPantryItems();
  }, [currentUser?.uid, authLoading]);

  const handleAddFood = (item: Ingredient | PantryItem) => {
    const ingredient: Ingredient = 'expiration' in item
      ? { id: item.id, name: item.name, category: item.category, quantity: item.quantity, expiryEstimate: item.expiration ? `Expires ${item.expiration}` : undefined }
      : item;
    setPantryItems((prev) => {
      const next = [...prev, ingredient];
      if (currentUser?.uid) savePantryToCache(currentUser.uid, next);
      return next;
    });
  };

  const handleAddScanItems = async (items: Ingredient[]) => {
    if (!currentUser?.uid) return;
    const newPantryItems: Ingredient[] = [];
    const now = new Date().toISOString();
    for (const item of items) {
      try {
        const expiration = deriveExpirationFromEstimate(item.expiryEstimate);
        const docData = {
          name: item.name,
          quantity: item.quantity,
          category: item.category || 'other',
          expiryEstimate: item.expiryEstimate,
          expiration,
          storage: 'pantry',
          userId: currentUser.uid,
          userEmail: currentUser.email ?? undefined,
          createdAt: now,
          updatedAt: now,
        };
        const docRef = await addDoc(collection(db, 'pantryItems'), docData);
        newPantryItems.push({ ...item, id: docRef.id, expiryEstimate: item.expiryEstimate } as Ingredient);
      } catch (error) {
        console.error('Error adding scanned item to Firestore:', error);
      }
    }
    setPantryItems((prev) => {
      const next = [...prev, ...newPantryItems];
      savePantryToCache(currentUser.uid, next);
      return next;
    });
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl text-gray-900">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Scan Items</h1>
            <p className="text-gray-800">Upload a receipt or fridge photo to analyze.</p>
          </div>
          <ScanAnalyzer onAddItems={handleAddScanItems} />
        </div>
      )}

      {activeTab === 'pantry' && (
        <>
          {authLoading || loadingPantry ? (
            <p className="text-center text-gray-600">Loading pantry...</p>
          ) : (
            <AddFood onAddFood={handleAddFood} />
          )}
        </>
      )}

      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl text-gray-900">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Recipes</h1>
            <p className="text-gray-800">Generate recipes from your pantry items.</p>
          </div>
          <RecipeGenerator ingredients={pantryItems} />
        </div>
      )}
    </Layout>
  );
}
