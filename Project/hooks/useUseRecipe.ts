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

    // e.g. "2½"
    const mixedUnicode = s.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/);
    if (mixedUnicode) {
      const whole = parseFloat(mixedUnicode[1]);
      const frac = unicodeFractions[mixedUnicode[2]] ?? 0;
      return whole + frac;
    }

    // e.g. "½"
    if (s in unicodeFractions) {
      return unicodeFractions[s];
    }

    // e.g. "1 1/2"
    const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      const whole = parseFloat(mixed[1]);
      const num = parseFloat(mixed[2]);
      const den = parseFloat(mixed[3]);
      if (den === 0) return NaN;
      return whole + num / den;
    }

    // e.g. "1/4"
    const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (frac) {
      const num = parseFloat(frac[1]);
      const den = parseFloat(frac[2]);
      if (den === 0) return NaN;
      return num / den;
    }

    return parseFloat(s);
  };

  const roundQty = (n: number) => Math.round(n * 1000) / 1000;

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
            const lower = raw
              .toLowerCase()
              .replace(/[–—-]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            // Support decimals ("2.5"), fractions ("1/4"), mixed ("1 1/2"), and common unicode ("½", "2½").
            const match = lower.match(
              /^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+[¼½¾⅓⅔⅛⅜⅝⅞])\s*([a-zA-Z]+)?\s+(.*)$/
            );

            if (!match) {
              return {
                name: lower,
                amount: 1,
                remainingAmount: 1,
                unit: '',
              };
            }

            const amount = parseAmount(match[1]);
            const unit = (match[2] || '').toLowerCase();
            const name = match[3].trim().replace(/^of\s+/, '');
            const safeAmount = !isFinite(amount) || isNaN(amount) || amount <= 0 ? 1 : amount;
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

          const pantryQty = parseAmount(data.quantity ?? '0');
          const pantryUnit = (data.unit || '').toLowerCase();
          if (isNaN(pantryQty) || pantryQty <= 0) return;
          if (ing.unit && pantryUnit && ing.unit !== pantryUnit) return;

          const maxUsableFromThisItem = Math.min(ing.remainingAmount, pantryQty);
          if (maxUsableFromThisItem <= 0) return;

          const remainingPantryQty = roundQty(pantryQty - maxUsableFromThisItem);
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
