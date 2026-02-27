'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/firebase';
import { getSavedRecipeIds } from '@/services/savedRecipesService';

export type UseSavedRecipeIdsResult = {
  savedRecipeIds: string[];
  loading: boolean;
  refetch: () => Promise<void>;
};

/**
 * Hook that returns the list of recipe ids the current user has saved.
 * Use it to show "Saved" vs "Save" on recipe cards and to refetch after save/unsave.
 */
export function useSavedRecipeIds(): UseSavedRecipeIdsResult {
  const { user, loading: authLoading } = useAuth();
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIds = useCallback(async () => {
    if (!user?.uid) {
      setSavedRecipeIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ids = await getSavedRecipeIds(user.uid);
      setSavedRecipeIds(ids);
    } catch (err) {
      console.error('Failed to load saved recipe ids:', err);
      setSavedRecipeIds([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchIds();
  }, [authLoading, fetchIds]);

  return {
    savedRecipeIds,
    loading: authLoading || loading,
    refetch: fetchIds,
  };
}

