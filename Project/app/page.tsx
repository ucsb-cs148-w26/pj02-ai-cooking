'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import AddFood from '@/components/InputInventory';
import ScanAnalyzer from '@/components/ScanAnalyzer';
import RecipeGenerator from '@/components/RecipeGenerator';
import type { Ingredient } from '@/types';
import { db, useAuth } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const currentUser = useAuth();
  const [loadingPantry, setLoadingPantry] = useState(true);

  useEffect(() => {
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
            items.push({ id: doc.id, ...doc.data() } as unknown as Ingredient);
          });
          setPantryItems(items);
        } catch (error) {
          console.error('Error fetching pantry items:', error);
        } finally {
          setLoadingPantry(false);
        }
      } else {
        setPantryItems([]); // Clear pantry items if no user is logged in
        setLoadingPantry(false);
      }
    };

    fetchPantryItems();
  }, [currentUser]);

  const handleAddFood = (item: Ingredient) => {
    setPantryItems((prev) => [...prev, item]);
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
          {loadingPantry ? (
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