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

  useEffect(() => {
    // Check if onboarding is complete
    const onboardingComplete = isOnboardingComplete();
    setShowOnboarding(!onboardingComplete);
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 via-blue-50 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading PantryPal...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not complete
  if (showOnboarding) {
    return <OnboardingForm onComplete={handleOnboardingComplete} />;
  }

  // Show main app
  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">Scan Items</h1>
            <p className="text-gray-700">Upload a receipt or fridge photo to analyze.</p>
          </div>
          <ScanAnalyzer onAddItems={handleAddScanItems} />
        </div>
      )}
      
      {activeTab === 'pantry' && <AddFood onAddFood={handleAddFood} />}
      
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">Recipes</h1>
            <p className="text-gray-700">Generate recipes from your pantry items.</p>
          </div>
          <RecipeGenerator ingredients={pantryItems} />
        </div>
      )}
    </Layout>
  );
}