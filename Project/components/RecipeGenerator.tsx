'use client';

import { useState, useEffect } from 'react';
import type { Ingredient, Recipe, UserPreferences } from '../types';
import { generateRecipes, getApiKey, hasValidApiKey, setStoredApiKey } from '../services/geminiService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, useAuth } from '../lib/firebase';

export default function RecipeGenerator() {
  const user = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey() ?? '');
  const [hasKey, setHasKey] = useState(hasValidApiKey());
  const [cuisine, setCuisine] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const [pantryLoading, setPantryLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      setPantryItems([]);
      setPantryLoading(false);
      return;
    }
    if (!user) {
      setPantryLoading(true);
      return;
    }

    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', user.uid)
    );

    setPantryLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Ingredient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          name: data.name,
          quantity: data.quantity ? `${data.quantity} ${data.unit || ''}`.trim() : undefined,
          category: data.category,
          expiryEstimate: data.expiration ? `Expires ${data.expiration}` : undefined
        });
      });
      setPantryItems(items);
      setPantryLoading(false);
    }, (err) => {
      console.error('Pantry snapshot error:', err);
      setPantryLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const saveKey = () => {
    const trimmed = apiKeyInput.trim();
    setStoredApiKey(trimmed);
    setHasKey(Boolean(trimmed));
    setError(null);
  };

  const handleGenerate = async () => {
    if (!hasValidApiKey()) {
      setError('Please save a Gemini API key first.');
      return;
    }
    if (pantryItems.length === 0) {
      setError('Add at least one pantry item first. Go to the Add Food page to add items.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const preferences: Partial<UserPreferences> = {
        cuisine: cuisine.trim(),
        restrictions: restrictions.trim()
      };
      const result = await generateRecipes(pantryItems, preferences);
      setRecipes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recipe generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-2xl font-bold">Gemini API Key</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Paste your Gemini API key"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
          />
          <button
            onClick={saveKey}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Save Key
          </button>
        </div>
        <p className="text-sm text-gray-600">Status: {hasKey ? 'Key saved' : 'No key saved'}</p>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-2xl font-bold">Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Cuisine</label>
            <input
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g. Italian"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Restrictions</label>
            <input
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              placeholder="e.g. vegetarian, no nuts"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate 3 Recipes'}
        </button>
      </div>

      {recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white/90 rounded-2xl p-5 shadow-lg space-y-3">
              {recipe.image && (
                <img src={recipe.image} alt={recipe.title} className="w-full rounded-xl" />
              )}
              <div>
                <h3 className="text-xl font-bold">{recipe.title}</h3>
                <p className="text-sm text-gray-600">{recipe.description}</p>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Time:</span> {recipe.time} ·{' '}
                <span className="font-semibold">Difficulty:</span> {recipe.difficulty}
              </div>
              <div>
                <p className="font-semibold text-gray-700">Ingredients</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {recipe.ingredients.map((item, idx) => (
                    <li key={`${recipe.id}-ing-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Instructions</p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  {recipe.instructions.map((step, idx) => (
                    <li key={`${recipe.id}-step-${idx}`}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
