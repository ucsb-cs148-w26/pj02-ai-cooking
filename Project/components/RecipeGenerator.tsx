'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { Heart } from 'lucide-react';
import { db, useAuth } from '@/lib/firebase';
import type { Ingredient, Recipe, UserPreferences } from '../types';
import { generateRecipes } from '../services/geminiService';
import { getUserPreferences } from '../services/userPreferencesService';
import { saveRecipe, unsaveRecipe } from '../services/savedRecipesService';
import { useSavedRecipeIds } from '@/hooks/useSavedRecipeIds';

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

type RecipeGeneratorProps = {
  ingredients: Ingredient[];
};

const formatIngredient = (item: Ingredient) => {
  const details = [item.quantity, item.category, item.expiryEstimate]
    .filter(Boolean)
    .join(' · ');
  return details ? `${item.name} (${details})` : item.name;
};

export default function RecipeGenerator({ ingredients }: RecipeGeneratorProps) {
  const { user } = useAuth();
  const [cuisine, setCuisine] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const [pantryLoading, setPantryLoading] = useState(true);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const {
    savedRecipeIds,
    loading: savedIdsLoading,
    refetch: refetchSavedIds,
  } = useSavedRecipeIds();

  const [usingRecipeId, setUsingRecipeId] = useState<string | null>(null);

  const itemsForRecipes = pantryItems.length > 0 ? pantryItems : ingredients;
  const pantrySummary = itemsForRecipes.map(formatIngredient);

  useEffect(() => {
    if (!user) {
      setUserPrefs(null);
      return;
    }
    getUserPreferences(user.uid).then(setUserPrefs);
  }, [user]);

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
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name,
          quantity: data.quantity ? `${data.quantity} ${data.unit || ''}`.trim() : undefined,
          category: data.category,
          expiryEstimate: data.expiration ? `Expires ${data.expiration}` : undefined,
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

  const handleGenerate = async () => {
    if (itemsForRecipes.length === 0) {
      setError('Add at least one pantry item first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const preferences: Partial<UserPreferences> = {
        ...userPrefs,
        cuisine: cuisine.trim() || userPrefs?.cuisinePreferences?.join(', ') || '',
        restrictions: restrictions.trim() || ''
      };
      const result = await generateRecipes(itemsForRecipes, preferences);
      const withIds = (result || []).map((r, i) => ({
        ...r,
        id: r?.id?.trim() || `recipe-${i}-${Date.now()}`,
      }));
      setRecipes(withIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recipe generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (recipe: Recipe) => {
    if (!user) {
      setError('Sign in to save recipes.');
      return;
    }

    const recipeId = recipe?.id?.trim() || `recipe-${recipe?.title ?? 'unknown'}-${Date.now()}`;
    const recipeToSave = { ...recipe, id: recipeId };

    try {
      const alreadySaved = savedRecipeIds.includes(recipeId);

      if (alreadySaved) {
        await unsaveRecipe(user.uid, recipeId);
      } else {
        await saveRecipe(user.uid, recipeToSave);
      }

      await refetchSavedIds();
    } catch (err) {
      console.error('Failed to toggle saved recipe state:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Cannot save: Firestore rules may be blocking. Check Firebase Console → Firestore → Rules for "savedRecipes".');
      } else {
        setError('Could not update saved recipes. Please try again.');
      }
    }
  };
  const handleUseRecipe = async (recipe: Recipe) => {
    if (!user) {
      setError('Sign in to use recipes.');
      return;
    }

    setUsingRecipeId(recipe.id);

    try {
      const q = query(
        collection(db, 'pantryItems'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('No pantry items to use.');
        return;
      }

      type ParsedIngredient = {
        name: string;
        amount: number;
        remainingAmount: number;
        unit: string;
      };

      const parsedIngredients: ParsedIngredient[] = recipe.ingredients
        .map((raw) => {
          const lower = raw.toLowerCase().trim();

          // Try to match patterns like "1 cup milk" or "2.5 tbsp olive oil"
          const match = lower.match(
            /^(\d*\.?\d+)\s*([a-zA-Z]+)?\s+(.*)$/
          );

          if (!match) {
            // Fallback: treat as 1 unit of the whole string
            return {
              name: lower,
              amount: 1,
              remainingAmount: 1,
              unit: '',
            };
          }

          const amount = parseFloat(match[1]);
          const unit = match[2] || '';
          const name = match[3].trim();

          const safeAmount = isNaN(amount) ? 1 : amount;
          return {
            name,
            amount: safeAmount,
            remainingAmount: safeAmount,
            unit,
          };
        })
        .filter((p) => p.name.length > 0);

      if (parsedIngredients.length === 0) {
        setError('Could not interpret recipe ingredients to update the pantry.');
        return;
      }

      const ops: Promise<unknown>[] = [];

      // Collect pantry docs with expiration to sort by earliest expiration first
      const pantryDocs = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as {
            name?: string;
            quantity?: string;
            unit?: string;
            expiration?: string;
          };

          const expirationTime = data.expiration
            ? new Date(data.expiration).getTime()
            : Number.POSITIVE_INFINITY;

          return { docSnap, data, expirationTime };
        })
        .sort((a, b) => a.expirationTime - b.expirationTime);

      pantryDocs.forEach(({ docSnap, data }) => {
        const pantryName = (data.name || '').toLowerCase();
        if (!pantryName) return;

        // Find a single ingredient that references this pantry item by name,
        // preferring those that still need quantity deducted.
        const ing = parsedIngredients.find(
          (candidate) =>
            candidate.remainingAmount > 0 &&
            (candidate.name.includes(pantryName) ||
              pantryName.includes(candidate.name))
        );

        if (!ing) return;

        const pantryQty = parseFloat(data.quantity ?? '0');
        const pantryUnit = (data.unit || '').toLowerCase();

        if (isNaN(pantryQty) || pantryQty <= 0) return;

        // If units are specified on both sides and don't match, skip this item
        if (ing.unit && pantryUnit && ing.unit !== pantryUnit) {
          return;
        }

        const maxUsableFromThisItem = Math.min(ing.remainingAmount, pantryQty);
        if (maxUsableFromThisItem <= 0) {
          return;
        }

        const remainingPantryQty = pantryQty - maxUsableFromThisItem;
        ing.remainingAmount -= maxUsableFromThisItem;

        const docRef = doc(db, 'pantryItems', docSnap.id);

        if (remainingPantryQty <= 0) {
          ops.push(deleteDoc(docRef));
        } else if (remainingPantryQty !== pantryQty) {
          ops.push(
            updateDoc(docRef, {
              quantity: String(remainingPantryQty),
            })
          );
        }
      });

      if (ops.length === 0) {
        setError('No matching pantry quantities were updated for this recipe.');
        return;
      }

      await Promise.all(ops);
    } catch (err) {
      console.error('Failed to use recipe and update pantry:', err);
      setError('Failed to update pantry items for this recipe.');
    } finally {
      setUsingRecipeId(null);
    }
  };

  const inputStyle = { borderColor: colors.dustyRose + '60', color: colors.olive };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 space-y-4 border"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold" style={{ color: colors.olive }}>
            Pantry Items
          </h2>
          {!pantryLoading && pantrySummary.length > 0 && (
            <span className="text-sm font-medium" style={{ color: colors.olive, opacity: 0.75 }}>
              {pantrySummary.length} item{pantrySummary.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {pantryLoading ? (
          <p style={{ color: colors.olive, opacity: 0.7 }}>Loading pantry items...</p>
        ) : pantrySummary.length === 0 ? (
          <p style={{ color: colors.olive, opacity: 0.7 }}>No pantry items yet.</p>
        ) : (
          <div className="max-h-52 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pantrySummary.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="rounded-xl px-3 py-2 text-sm border flex items-start gap-2"
                  style={{
                    borderColor: colors.dustyRose + '50',
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    color: colors.olive,
                  }}
                >
                  <span
                    className="mt-1 h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: colors.terracotta }}
                  />
                  <span className="leading-snug break-words">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-6 space-y-4 border"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
      >
        <h2 className="text-2xl font-bold" style={{ color: colors.olive }}>What kind of food do you want?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>Cuisine</label>
            <input
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g. Italian"
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none placeholder:opacity-50"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>Restrictions</label>
            <input
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              placeholder="e.g. vegetarian, no nuts"
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none placeholder:opacity-50"
              style={inputStyle}
            />
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: colors.terracotta }}>{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: colors.dustyRose }}
        >
          {loading ? 'Generating...' : 'Generate 3 Recipes'}
        </button>
      </div>

      {recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe, index) => {
            const recipeId = recipe?.id?.trim() || `recipe-${recipe?.title ?? 'unknown'}-${index}`;
            const recipeWithId = { ...recipe, id: recipeId };
            return (
            <div
              key={recipeId}
              className="rounded-2xl p-5 space-y-3 border relative"
              style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderColor: colors.dustyRose + '40' }}
            >
              {/** Save / Saved control (Sub-issue 2) */}
              {user ? (
                <>
                  <button
                    type="button"
                    className="absolute top-4 right-4 p-2 rounded-full border transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ borderColor: colors.dustyRose, color: colors.terracotta }}
                    aria-label={savedRecipeIds.includes(recipeId) ? 'Unsave recipe' : 'Save recipe'}
                    disabled={savedIdsLoading}
                    onClick={() => handleToggleSave(recipeWithId)}
                  >
                    <Heart size={20} />
                  </button>
                  <span
                    className="absolute top-4 right-14 text-sm font-medium"
                    style={{ color: colors.olive }}
                  >
                    {savedRecipeIds.includes(recipeId) ? 'Saved' : 'Save'}
                  </span>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute top-4 right-4 p-2 rounded-full border opacity-60 cursor-not-allowed"
                    style={{ borderColor: colors.dustyRose, color: colors.terracotta }}
                    aria-label="Sign in to save recipes"
                    disabled
                  >
                    <Heart size={20} />
                  </button>
                  <span
                    className="absolute top-4 right-14 text-sm font-medium"
                    style={{ color: colors.olive, opacity: 0.7 }}
                  >
                    Sign in to save
                  </span>
                </>
              )}
              {recipe.image && (
                <img src={recipe.image} alt={recipe.title} className="w-full rounded-xl" />
              )}
              <div>
                <h3 className="text-xl font-bold" style={{ color: colors.olive }}>{recipe.title}</h3>
                <p className="text-sm" style={{ color: colors.olive, opacity: 0.8 }}>{recipe.description}</p>
              </div>
              <div className="text-sm" style={{ color: colors.olive }}>
                <span className="font-semibold">Time:</span> {recipe.time} ·{' '}
                <span className="font-semibold">Difficulty:</span> {recipe.difficulty}
              </div>
              <div>
                <p className="font-semibold" style={{ color: colors.olive }}>Ingredients</p>
                <ul className="list-disc list-inside text-sm" style={{ color: colors.olive, opacity: 0.9 }}>
                  {recipe.ingredients.map((item, idx) => (
                    <li key={`${recipeId}-ing-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold" style={{ color: colors.olive }}>Instructions</p>
                <ol className="list-decimal list-inside text-sm space-y-1" style={{ color: colors.olive, opacity: 0.9 }}>
                  {recipe.instructions.map((step, idx) => (
                    <li key={`${recipeId}-step-${idx}`}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleUseRecipe(recipeWithId)}
                  disabled={usingRecipeId === recipeId}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: colors.terracotta }}
                >
                  {usingRecipeId === recipeId ? 'Using...' : 'Use Recipe (update pantry)'}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}