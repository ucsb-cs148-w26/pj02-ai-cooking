'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import AddFood from '@/components/InputInventory';
import ScanAnalyzer from '@/components/ScanAnalyzer';
import RecipeGenerator from '@/components/RecipeGenerator';
import type { Ingredient } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);

  const handleAddFood = (item: Ingredient) => {
    setPantryItems((prev) => [...prev, item]);
  };

  const handleAddScanItems = (items: Ingredient[]) => {
    setPantryItems((prev) => [...prev, ...items]);
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
      
      {activeTab === 'pantry' && <AddFood onAddFood={handleAddFood} />}
      
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl text-gray-900">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Recipes</h1>
            <p className="text-gray-800">Generate recipes from your pantry items.</p>
          </div>
          <RecipeGenerator />
        </div>
      )}
    </Layout>
  );
}