'use client';
import React, { useState, useEffect } from 'react';
import { saveUserPreferences, markOnboardingComplete } from '@/services/userPreferencesService';
import { UserPreferences } from '@/types';
import { useAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

const COMMON_ALLERGENS = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish',
];

const DIET_TYPES = [
  'None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free',
];

const CUISINE_TYPES = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'Mediterranean', 'American', 'French', 'Korean',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    name: '',
    allergies: [],
    customAllergies: '',
    dietType: 'None',
    cuisinePreferences: [],
    cookingSkillLevel: 'Intermediate',
  });
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && preferences.onboardingComplete) {
      router.push('/dashboard');
    }
  }, [currentUser, preferences.onboardingComplete, router]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = async () => {
    if (currentUser?.uid) {
      await markOnboardingComplete(currentUser.uid);
      router.push('/dashboard');
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.uid) {
      console.error("User not authenticated.");
      return;
    }

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

    await saveUserPreferences(currentUser.uid, finalPreferences);
    await markOnboardingComplete(currentUser.uid);
    router.push('/dashboard');
  };

  const toggleAllergy = (allergen: string) => {
    const current = preferences.allergies || [];
    setPreferences({
      ...preferences,
      allergies: current.includes(allergen) ? current.filter(a => a !== allergen) : [...current, allergen],
    });
  };

  const toggleCuisine = (cuisine: string) => {
    const current = preferences.cuisinePreferences || [];
    setPreferences({
      ...preferences,
      cuisinePreferences: current.includes(cuisine) ? current.filter(c => c !== cuisine) : [...current, cuisine],
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.cream }}>
      <div className="relative w-full max-w-2xl">
        <div
          className="rounded-2xl p-8 border"
          style={{ backgroundColor: 'rgba(255,255,255,0.65)', borderColor: colors.dustyRose + '40' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: colors.olive }}>
              Welcome to PantryPal!
            </h1>
            <p style={{ color: colors.olive, opacity: 0.8 }}>Let&apos;s personalize your experience</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: colors.olive }}>Step {step} of 3</span>
              <span className="text-sm font-medium" style={{ color: colors.olive }}>{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full rounded-full h-3" style={{ backgroundColor: colors.dustyRose + '30' }}>
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%`, backgroundColor: colors.terracotta }}
              />
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: colors.olive }}>Let&apos;s get started!</h2>
                <p className="mb-6" style={{ color: colors.olive, opacity: 0.8 }}>Tell us a bit about yourself</p>
                <div>
                  <label className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>What&apos;s your name?</label>
                  <input
                    type="text"
                    value={preferences.name}
                    onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                    style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Allergies & Diet */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: colors.olive }}>Dietary Restrictions</h2>
                <p className="mb-6" style={{ color: colors.olive, opacity: 0.8 }}>Help us keep you safe and satisfied</p>

                <div className="mb-6">
                  <label className="block font-semibold mb-3 text-sm" style={{ color: colors.olive }}>Any food allergies? (Select all that apply)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {COMMON_ALLERGENS.map((allergen) => (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergy(allergen)}
                        className="px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium"
                        style={
                          preferences.allergies?.includes(allergen)
                            ? { backgroundColor: colors.terracotta, color: '#fff', borderColor: colors.terracotta }
                            : { backgroundColor: 'rgba(255,255,255,0.5)', color: colors.olive, borderColor: colors.dustyRose + '40' }
                        }
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>Other allergies? (comma-separated)</label>
                  <input
                    type="text"
                    value={preferences.customAllergies}
                    onChange={(e) => setPreferences({ ...preferences, customAllergies: e.target.value })}
                    placeholder="e.g., Sesame, Coconut, Mustard"
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                    style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-3 text-sm" style={{ color: colors.olive }}>Diet Type</label>
                  <select
                    value={preferences.dietType}
                    onChange={(e) => setPreferences({ ...preferences, dietType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                    style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  >
                    {DIET_TYPES.map((diet) => (
                      <option key={diet} value={diet}>{diet}</option>
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
                <h2 className="text-2xl font-bold mb-4" style={{ color: colors.olive }}>Your Preferences</h2>
                <p className="mb-6" style={{ color: colors.olive, opacity: 0.8 }}>Let&apos;s tailor recipes to your taste</p>

                <div className="mb-6">
                  <label className="block font-semibold mb-3 text-sm" style={{ color: colors.olive }}>Favorite Cuisines (Select all you like)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {CUISINE_TYPES.map((cuisine) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className="px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium"
                        style={
                          preferences.cuisinePreferences?.includes(cuisine)
                            ? { backgroundColor: colors.steelBlue, color: '#fff', borderColor: colors.steelBlue }
                            : { backgroundColor: 'rgba(255,255,255,0.5)', color: colors.olive, borderColor: colors.dustyRose + '40' }
                        }
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-3 text-sm" style={{ color: colors.olive }}>Cooking Skill Level</label>
                  <select
                    value={preferences.cookingSkillLevel}
                    onChange={(e) => setPreferences({ ...preferences, cookingSkillLevel: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                    style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  >
                    <option value="Beginner">Beginner - I&apos;m just starting out</option>
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
                className="flex-1 px-6 py-4 font-semibold rounded-lg transition-colors border-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: colors.olive, borderColor: colors.dustyRose + '40' }}
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-4 text-white font-bold rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.terracotta }}
            >
              {step === 3 ? 'Complete Setup' : 'Next'}
            </button>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-sm font-medium transition-colors"
            style={{ color: colors.olive, opacity: 0.6 }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
