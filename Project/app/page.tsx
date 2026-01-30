// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import OnboardingForm from '../components/OnboardingForm';
import { isOnboardingComplete, getUserPreferences } from '../services/userPreferencesService';

export default function Page() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState('scan');
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState(null);

  // Check if onboarding is complete
  useEffect(() => {
    const checkOnboarding = () => {
      const completed = isOnboardingComplete();
      const prefs = getUserPreferences();
      
      setShowOnboarding(!completed);
      setUserPreferences(prefs);
      setIsLoading(false);
    };
    
    checkOnboarding();
  }, []);

  const handleOnboardingComplete = () => {
    // Refresh user preferences
    const prefs = getUserPreferences();
    setUserPreferences(prefs);
    setShowOnboarding(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
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

  // Show onboarding
  // Show onboarding if not complete
  if (showOnboarding) {
    return <OnboardingForm onComplete={handleOnboardingComplete} />;
  }

  // Show main app
  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Scan Tab */}
      {activeTab === 'scan' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Scan Ingredients
          </h2>
          {userPreferences?.name && (
            <p className="text-gray-600 mb-4">
              Hello, {userPreferences.name}! 👋
            </p>
          )}
          <p className="text-gray-600">Upload ingredient photos or enter ingredient names...</p>
        </div>
      )}
      
      {/* Pantry Tab */}
      {activeTab === 'pantry' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4">
            My Pantry
          </h2>
          {userPreferences?.allergies && userPreferences.allergies.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-semibold text-red-800">⚠️ Allergen Alert:</p>
              <p className="text-sm text-red-600">{userPreferences.allergies.join(', ')}</p>
            </div>
          )}
          <p className="text-gray-600">Manage your ingredient inventory...</p>
        </div>
      )}
      
      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Recommended Recipes
          </h2>
          {userPreferences && (
            <div className="mb-6 space-y-2">
              {userPreferences.dietType && userPreferences.dietType !== 'None' && (
                <p className="text-sm text-gray-600">
                  🥗 Diet Type: <span className="font-semibold">{userPreferences.dietType}</span>
                </p>
              )}
              {userPreferences.cuisinePreferences && userPreferences.cuisinePreferences.length > 0 && (
                <p className="text-sm text-gray-600">
                  🍽️ Preferred Cuisines: <span className="font-semibold">{userPreferences.cuisinePreferences.join(', ')}</span>
                </p>
              )}
              {userPreferences.cookingSkillLevel && (
                <p className="text-sm text-gray-600">
                  👨‍🍳 Cooking Level: <span className="font-semibold">{userPreferences.cookingSkillLevel}</span>
                </p>
              )}
            </div>
          )}
          <p className="text-gray-600">Recipes tailored to your preferences...</p>
        </div>
      )}
    </Layout>
  );
}