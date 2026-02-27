'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase';
import {
  getSavedRecipes,
  type SavedRecipeDocument,
  unsaveRecipe,
} from '@/services/savedRecipesService';

export default function SavedRecipesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeDocument[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || loading) {
      return;
    }

    let cancelled = false;

    const loadSavedRecipes = async () => {
      setListLoading(true);
      setError(null);

      try {
        const results = await getSavedRecipes(user.uid);
        if (!cancelled) {
          setSavedRecipes(results);
        }
      } catch (err) {
        console.error('Failed to load saved recipes:', err);
        if (!cancelled) {
          setError('Failed to load saved recipes. Please try again later.');
          setSavedRecipes([]);
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    loadSavedRecipes();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const handleToggleExpand = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleUnsave = async (recipe: SavedRecipeDocument) => {
    if (!user) {
      return;
    }

    const recipeKey = recipe.recipeId || recipe.id;

    if (!recipeKey) {
      return;
    }

    try {
      setRemovingId(recipe.id);
      setError(null);

      await unsaveRecipe(user.uid, recipeKey);

      setSavedRecipes((current) =>
        current.filter((item) => item.id !== recipe.id),
      );

      setExpandedId((current) =>
        current === recipe.id ? null : current,
      );
    } catch (err) {
      console.error('Failed to remove saved recipe:', err);
      setError('Failed to remove saved recipe. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-700">Loading saved recipes...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            My Saved Recipes
          </h1>
          <p className="text-gray-700">
            These are the recipes you&apos;ve saved from the generator. You can
            open any recipe to review the ingredients and instructions again.
          </p>
        </header>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {listLoading ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-6 text-gray-600">
            <p>Loading your saved recipes...</p>
          </div>
        ) : savedRecipes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-6 text-gray-600">
            <p className="font-medium text-gray-700">
              You haven&apos;t saved any recipes yet.
            </p>
            <p className="mt-2 text-gray-600">
              Use the <span className="font-semibold">Save</span> button on a
              generated recipe to add it here.
            </p>
          </div>
        ) : (
          <section className="mt-4 space-y-4">
            {savedRecipes.map((recipe) => (
              <article
                key={recipe.id}
                className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {recipe.title}
                      </h2>
                      {recipe.description && (
                        <p className="text-gray-700">
                          {recipe.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-600">
                        {recipe.time && (
                          <span className="mr-3">
                            <span className="font-semibold">Time:</span>{' '}
                            {recipe.time}
                          </span>
                        )}
                        {recipe.difficulty && (
                          <span>
                            <span className="font-semibold">Difficulty:</span>{' '}
                            {recipe.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row gap-2 md:flex-col md:items-end">
                      <button
                        type="button"
                        className="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => handleToggleExpand(recipe.id)}
                      >
                        {expandedId === recipe.id ? 'Hide details' : 'View details'}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-red-200 px-4 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        onClick={() => handleUnsave(recipe)}
                        disabled={removingId === recipe.id}
                      >
                        {removingId === recipe.id ? 'Removing…' : 'Remove from saved'}
                      </button>
                    </div>
                  </div>

                  {expandedId === recipe.id && (
                    <div className="mt-3 grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Ingredients
                        </h3>
                        {recipe.ingredients.length === 0 ? (
                          <p className="mt-1 text-sm text-gray-600">
                            No ingredients listed.
                          </p>
                        ) : (
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
                            {recipe.ingredients.map((item, index) => (
                              <li key={`${recipe.id}-ing-${index}`}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Instructions
                        </h3>
                        {recipe.instructions.length === 0 ? (
                          <p className="mt-1 text-sm text-gray-600">
                            No instructions listed.
                          </p>
                        ) : (
                          <ol className="mt-1 list-decimal list-inside space-y-1 text-sm text-gray-700">
                            {recipe.instructions.map((step, index) => (
                              <li key={`${recipe.id}-step-${index}`}>
                                {step}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

