'use client';

import { useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, useAuth } from '@/lib/firebase';

export type UseRecipeInput = {
  id: string;
  ingredients: string[];
};

export type UseUseRecipeOptions = {
  setError?: (message: string | null) => void;
};

export type UseUseRecipeResult = {
  handleUseRecipe: (recipe: UseRecipeInput) => Promise<void>;
  usingRecipeId: string | null;
};

/**
 * Shared logic for "Use Recipe (update pantry)": parses recipe ingredients,
 * matches pantry items, and deducts (or removes) quantities in Firestore.
 * Use in RecipeGenerator and on the saved recipes page.
 */
export function useUseRecipe(options: UseUseRecipeOptions = {}): UseUseRecipeResult {
  const { setError } = options;
  const { user } = useAuth();
  const [usingRecipeId, setUsingRecipeId] = useState<string | null>(null);

  const handleUseRecipe = useCallback(
    async (recipe: UseRecipeInput) => {
      if (!user) {
        setError?.('Sign in to use recipes.');
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
          setError?.('No pantry items to use.');
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
            const match = lower.match(
              /^(\d*\.?\d+)\s*([a-zA-Z]+)?\s+(.*)$/
            );

            if (!match) {
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
          setError?.('Could not interpret recipe ingredients to update the pantry.');
          return;
        }

        const ops: Promise<unknown>[] = [];

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
          if (ing.unit && pantryUnit && ing.unit !== pantryUnit) return;

          const maxUsableFromThisItem = Math.min(ing.remainingAmount, pantryQty);
          if (maxUsableFromThisItem <= 0) return;

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
          setError?.('No matching pantry quantities were updated for this recipe.');
          return;
        }

        await Promise.all(ops);
      } catch (err) {
        console.error('Failed to use recipe and update pantry:', err);
        setError?.('Failed to update pantry items for this recipe.');
      } finally {
        setUsingRecipeId(null);
      }
    },
    [user, setError]
  );

  return { handleUseRecipe, usingRecipeId };
}
