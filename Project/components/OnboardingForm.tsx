'use client';

import React, { useState } from 'react';
import { saveUserPreferences, markOnboardingComplete } from '@/services/userPreferencesService';
import { useAuth } from '@/lib/firebase';
import type { UserPreferences } from '@/types';

interface OnboardingFormProps {
  onComplete: () => void;
}

const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
];

const DIET_TYPES = [
  'None',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Gluten-Free',
  'Dairy-Free',
];

const CUISINE_TYPES = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'Mediterranean',
  'American',
  'French',
  'Korean',
];

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const user = useAuth();
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    name: '',
    allergies: [],
    customAllergies: '',
    dietType: 'None',
    cuisinePreferences: [],
    cookingSkillLevel: 'Intermediate',
  });

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = async () => {
    if (user?.uid) {
      await markOnboardingComplete(user.uid);
    }
    onComplete();
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      console.error('User not authenticated.');
      return;
    }

    // Combine common allergies and custom allergies
    const allAllergies = [
      ...(preferences.allergies || []),
      ...(preferences.customAllergies ? preferences.customAllergies.split(',').map(a => a.trim()) : []),
    ].filter(Boolean);

    const finalPreferences: UserPreferences = {
      name: preferences.name || '',
      allergies: allAllergies,
      dietType: preferences.dietType || 'None',
      cuisinePreferences: preferences.cuisinePreferences || [],
      cookingSkillLevel: preferences.cookingSkillLevel || 'Intermediate',
      onboardingComplete: true,
    };

    await saveUserPreferences(user.uid, finalPreferences);
    await markOnboardingComplete(user.uid);
    onComplete();
  };

  const toggleAllergy = (allergen: string) => {
    const current = preferences.allergies || [];
    if (current.includes(allergen)) {
      setPreferences({
        ...preferences,
        allergies: current.filter(a => a !== allergen),
      });
    } else {
      setPreferences({
        ...preferences,
        allergies: [...current, allergen],
      });
    }
  };

  const toggleCuisine = (cuisine: string) => {
    const current = preferences.cuisinePreferences || [];
    if (current.includes(cuisine)) {
      setPreferences({
        ...preferences,
        cuisinePreferences: current.filter(c => c !== cuisine),
      });
    } else {
      setPreferences({
        ...preferences,
        cuisinePreferences: [...current, cuisine],
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 via-blue-50 to-yellow-100 p-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-300 to-orange-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-400 to-purple-500 opacity-20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-purple-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
              Welcome to PantryPal!
            </h1>
            <p className="text-gray-600">Let's personalize your experience</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step {step} of 3</span>
              <span className="text-sm font-medium text-gray-700">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Let's get started!</h2>
                <p className="text-gray-600 mb-6">Tell us a bit about yourself</p>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">What's your name?</label>
                  <input
                    type="text"
                    value={preferences.name}
                    onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Allergies & Diet */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Dietary Restrictions</h2>
                <p className="text-gray-600 mb-6">Help us keep you safe and satisfied</p>

                {/* Common Allergens */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-3">Any food allergies? (Select all that apply)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {COMMON_ALLERGENS.map((allergen) => (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergy(allergen)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all ${
                          preferences.allergies?.includes(allergen)
                            ? 'bg-red-500 text-white border-red-500 shadow-lg'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                        }`}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Allergies */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Other allergies? (comma-separated)</label>
                  <input
                    type="text"
                    value={preferences.customAllergies}
                    onChange={(e) => setPreferences({ ...preferences, customAllergies: e.target.value })}
                    placeholder="e.g., Sesame, Coconut, Mustard"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Diet Type */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Diet Type</label>
                  <select
                    value={preferences.dietType}
                    onChange={(e) => setPreferences({ ...preferences, dietType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                  >
                    {DIET_TYPES.map((diet) => (
                      <option key={diet} value={diet}>
                        {diet}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Preferences</h2>
                <p className="text-gray-600 mb-6">Let's tailor recipes to your taste</p>

                {/* Cuisine Preferences */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-3">Favorite Cuisines (Select all you like)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {CUISINE_TYPES.map((cuisine) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all ${
                          preferences.cuisinePreferences?.includes(cuisine)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cooking Skill Level */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Cooking Skill Level</label>
                  <select
                    value={preferences.cookingSkillLevel}
                    onChange={(e) => setPreferences({ ...preferences, cookingSkillLevel: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                  >
                    <option value="Beginner">Beginner - I'm just starting out</option>
                    <option value="Intermediate">Intermediate - I can handle most recipes</option>
                    <option value="Advanced">Advanced - Bring on the challenge!</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              {step === 3 ? 'Complete Setup' : 'Next'}
            </button>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}