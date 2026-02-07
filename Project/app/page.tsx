'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import AddFood from '@/components/InputInventory';
import ScanAnalyzer from '@/components/ScanAnalyzer';
import RecipeGenerator from '@/components/RecipeGenerator';
import type { Ingredient, PantryItem } from '@/types';
import { db, useAuth } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const { user: currentUser, loading: authLoading } = useAuth();
  const [loadingPantry, setLoadingPantry] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchPantryItems = async () => {
      if (currentUser?.uid) {
        setLoadingPantry(true);
        try {
          const q = query(
            collection(db, 'pantryItems'),
            where('userId', '==', currentUser.uid)
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
        } catch (error) {
          console.error('Error fetching pantry items:', error);
        } finally {
          setLoadingPantry(false);
        }
      } else {
        setPantryItems([]);
        setLoadingPantry(false);
      }
    };

    fetchPantryItems();
  }, [currentUser?.uid, authLoading]);

  const handleAddFood = (item: Ingredient | PantryItem) => {
    const ingredient: Ingredient = 'expiration' in item
      ? { id: item.id, name: item.name, category: item.category, quantity: item.quantity, expiryEstimate: item.expiration ? `Expires ${item.expiration}` : undefined }
      : item;
    setPantryItems((prev) => [...prev, ingredient]);
  };

  const handleAddScanItems = async (items: Ingredient[]) => {
    if (!currentUser?.uid) return;
    const newPantryItems: Ingredient[] = [];
    for (const item of items) {
      try {
        const docRef = await addDoc(collection(db, 'pantryItems'), {
          ...item,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
        });
        newPantryItems.push({ ...item, id: docRef.id });
      } catch (error) {
        console.error('Error adding scanned item to Firestore:', error);
      }
    }
    setPantryItems((prev) => [...prev, ...newPantryItems]);
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