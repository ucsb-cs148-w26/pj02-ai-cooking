'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { Heart } from 'lucide-react';
import { db, useAuth } from '@/lib/firebase';
import type { Ingredient, Recipe, UserPreferences } from '../types';
import { generateRecipes } from '../services/geminiService';
import { getUserPreferences } from '../services/userPreferencesService';
import { saveRecipe, unsaveRecipe } from '../services/savedRecipesService';
import { useSavedRecipeIds } from '@/hooks/useSavedRecipeIds';
import { useUseRecipe } from '@/hooks/useUseRecipe';

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

const CUISINE_OPTIONS: string[] = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai',
  'Mediterranean', 'American', 'French', 'Korean', 'Greek', 'Vietnamese', 'Spanish',
];

const RESTRICTION_OPTIONS: string[] = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Dairy-Free',
  'Nut-free', 'Keto', 'Paleo', 'Low-carb', 'Halal', 'Kosher',
];

const parseExpirationTime = (expiryEstimate?: string): number => {
  if (!expiryEstimate?.trim()) return Infinity;
  const match = expiryEstimate.match(/Expires\s+(\d{4}-\d{2}-\d{2})/i) ?? expiryEstimate.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) return Infinity;
  const t = new Date(match[1]).getTime();
  return Number.isNaN(t) ? Infinity : t;
};

const parseAmount = (raw: string): number => {
  const s = raw.trim();
  if (!s) return NaN;

  const unicodeFractions: Record<string, number> = {
    '¼': 0.25,
    '½': 0.5,
    '¾': 0.75,
    '⅓': 1 / 3,
    '⅔': 2 / 3,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875,
  };

  const mixedUnicode = s.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (mixedUnicode) {
    const whole = parseFloat(mixedUnicode[1]);
    const frac = unicodeFractions[mixedUnicode[2]] ?? 0;
    return whole + frac;
  }

  if (s in unicodeFractions) return unicodeFractions[s];

  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = parseFloat(mixed[1]);
    const num = parseFloat(mixed[2]);
    const den = parseFloat(mixed[3]);
    if (den === 0) return NaN;
    return whole + num / den;
  }

  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const num = parseFloat(frac[1]);
    const den = parseFloat(frac[2]);
    if (den === 0) return NaN;
    return num / den;
  }

  return parseFloat(s);
};

const formatQty = (n: number) => {
  const rounded = Math.round(n * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const buildPantrySummary = (items: Ingredient[]): string[] => {
  type Bucket = {
    displayName: string;
    totalsByUnit: Map<string, number>;
    rawParts: string[];
  };

  const buckets = new Map<string, Bucket>();

  for (const item of items) {
    const displayName = (item.name || '').trim();
    if (!displayName) continue;

    const key = displayName.toLowerCase();
    const bucket =
      buckets.get(key) ??
      (() => {
        const next: Bucket = {
          displayName,
          totalsByUnit: new Map(),
          rawParts: [],
        };
        buckets.set(key, next);
        return next;
      })();

    // Keep only name + quantity. Do not include category or expiration.
    const q = (item.quantity || '').trim();
    if (!q) continue;

    const normalized = q.replace(/\s+/g, ' ').trim();
    const match = normalized.match(
      /^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+[¼½¾⅓⅔⅛⅜⅝⅞])(?:\s+(.+))?$/
    );

    if (!match) {
      bucket.rawParts.push(normalized);
      continue;
    }

    const amount = parseAmount(match[1]);
    const unit = (match[2] || '').trim().toLowerCase();
    if (!isFinite(amount) || isNaN(amount)) {
      bucket.rawParts.push(normalized);
      continue;
    }

    const prev = bucket.totalsByUnit.get(unit) ?? 0;
    bucket.totalsByUnit.set(unit, prev + amount);
  }

  return [...buckets.values()].map((bucket) => {
    const parts: string[] = [];

    for (const [unit, amount] of bucket.totalsByUnit.entries()) {
      const qty = formatQty(amount);
      parts.push(unit ? `${qty} ${unit}` : qty);
    }

    parts.push(...bucket.rawParts);

    if (parts.length === 0) return bucket.displayName;
    return `${bucket.displayName} (${parts.join(', ')})`;
  });
};

export default function RecipeGenerator({ ingredients }: RecipeGeneratorProps) {
  const { user } = useAuth();
  const [cuisine, setCuisine] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const [pantryLoading, setPantryLoading] = useState(true);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const {
    savedRecipeIds,
    loading: savedIdsLoading,
    refetch: refetchSavedIds,
  } = useSavedRecipeIds();
  const { handleUseRecipe, usingRecipeId } = useUseRecipe({ setError });

  const itemsForRecipes = pantryItems.length > 0 ? pantryItems : ingredients;
  const itemsWithId = useMemo(
    () =>
      itemsForRecipes.map((item, i) => ({
        ...item,
        id: item.id ?? `ing-${i}`,
      })),
    [itemsForRecipes]
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set(itemsWithId.map((item) => item.id!)));
  }, [itemsWithId]);

  const selectedItems = useMemo(
    () => itemsWithId.filter((item) => selectedIds.has(item.id!)),
    [itemsWithId, selectedIds]
  );
  const pantrySummary = buildPantrySummary(itemsForRecipes);

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
      items.sort((a, b) => {
        const timeA = parseExpirationTime(a.expiryEstimate);
        const timeB = parseExpirationTime(b.expiryEstimate);
        return timeA - timeB;
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
    if (itemsWithId.length === 0) {
      setError('Add at least one pantry item first.');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Select at least one ingredient to generate recipes.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(null);
    try {
      const preferences: Partial<UserPreferences> = {
        ...userPrefs,
        cuisine: cuisine.trim() || userPrefs?.cuisinePreferences?.join(', ') || '',
        restrictions: restrictions.trim() || ''
      };
      const result = await generateRecipes(selectedItems, preferences, (message) => {
        setStatusMessage(message);
      });
      const withIds = (result || []).map((r, i) => ({
        ...r,
        id: r?.id?.trim() || `recipe-${i}-${Date.now()}`,
      }));
      setRecipes(withIds);
      setStatusMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recipe generation failed.');
      setStatusMessage(null);
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
  const inputStyle = { borderColor: colors.dustyRose + '60', color: colors.olive };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 space-y-4 border"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold" style={{ color: colors.olive }}>
            Pantry Items
          </h2>
          {!pantryLoading && itemsWithId.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: colors.olive, opacity: 0.75 }}>
                {selectedItems.length} of {itemsWithId.length} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set(itemsWithId.map((i) => i.id!)))}
                className="text-sm font-semibold px-2 py-1 rounded border transition-opacity hover:opacity-90"
                style={{ borderColor: colors.dustyRose, color: colors.olive }}
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-sm font-semibold px-2 py-1 rounded border transition-opacity hover:opacity-90"
                style={{ borderColor: colors.dustyRose, color: colors.olive }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
        {pantryLoading ? (
          <p style={{ color: colors.olive, opacity: 0.7 }}>Loading pantry items...</p>
        ) : itemsWithId.length === 0 ? (
          <p style={{ color: colors.olive, opacity: 0.7 }}>No pantry items yet.</p>
        ) : (
          <div className="max-h-52 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {itemsWithId.map((item) => {
                const id = item.id!;
                const checked = selectedIds.has(id);
                const label = [item.name, item.quantity, item.category, item.expiryEstimate]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <label
                    key={id}
                    className="rounded-xl px-3 py-2 text-sm border flex items-start gap-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: colors.dustyRose + '50',
                      backgroundColor: checked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                      color: colors.olive,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        });
                      }}
                      className="mt-1 shrink-0 rounded border-2"
                      style={{ accentColor: colors.terracotta, borderColor: colors.dustyRose }}
                    />
                    <span className="leading-snug break-words">{label}</span>
                  </label>
                );
              })}
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
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
              style={inputStyle}
            >
              <option value="">Any cuisine</option>
              {CUISINE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>Restrictions</label>
            <select
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
              style={inputStyle}
            >
              <option value="">No restrictions</option>
              {RESTRICTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: colors.terracotta }}>{error}</p>}
        {loading && statusMessage && (
          <p className="text-sm" style={{ color: colors.olive, opacity: 0.85 }}>
            {statusMessage}
          </p>
        )}
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
                  onClick={() => handleUseRecipe({ id: recipeWithId.id, ingredients: recipeWithId.ingredients })}
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