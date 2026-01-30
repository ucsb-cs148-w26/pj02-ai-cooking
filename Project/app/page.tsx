'use client';

import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import AddFood from './components/InputInventory';
import ScanAnalyzer from './components/ScanAnalyzer';
import OnboardingForm from './components/OnboardingForm';
import { isOnboardingComplete } from './services/userPreferencesService';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pantry');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          <ScanAnalyzer />
        </div>
      )}
      
      {activeTab === 'pantry' && <AddFood />}
      
      {activeTab === 'recipes' && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Recipe History</h1>
          <p>Your saved recipes will appear here...</p>
        </div>
      )}
    </Layout>
  );
}