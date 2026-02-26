import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import type { Recipe } from '../types';

/** Firestore collection name for saved recipes. */
const SAVED_RECIPES_COLLECTION = 'savedRecipes';

/**
 * Returns the Firestore collection reference for saved recipes.
 * Use this for addDoc, query, etc.
 */
function getSavedRecipesCollectionRef() {
  return collection(db, SAVED_RECIPES_COLLECTION);
}

/**
 * Saves a recipe for the given user. Writes a document to the `savedRecipes`
 * collection with userId, recipeId, and all fields needed to display the recipe later.
 *
 * @param userId - Current user's uid
 * @param recipe - The recipe to save (from generation or elsewhere)
 * @returns The Firestore document id of the saved recipe
 */
export async function saveRecipe(userId: string, recipe: Recipe): Promise<string> {
  if (!userId) {
    throw new Error('Cannot save recipe: user id is required.');
  }
  if (!recipe?.id) {
    throw new Error('Cannot save recipe: recipe must have an id.');
  }

  const colRef = getSavedRecipesCollectionRef();
  const savedAt = new Date().toISOString();

  const docData = {
    userId,
    recipeId: recipe.id,
    title: recipe.title,
    description: recipe.description,
    time: recipe.time,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    ...(recipe.image != null && recipe.image !== '' ? { image: recipe.image } : {}),
    savedAt,
  };

  const docRef = await addDoc(colRef, docData);
  return docRef.id;
}

/**
 * Removes a saved recipe for the given user by recipeId.
 * Queries for the document with matching userId and recipeId, then deletes it.
 *
 * @param userId - Current user's uid
 * @param recipeId - The recipe id (Recipe.id) to unsave
 */
export async function unsaveRecipe(userId: string, recipeId: string): Promise<void> {
  if (!userId) {
    throw new Error('Cannot unsave recipe: user id is required.');
  }
  if (!recipeId) {
    throw new Error('Cannot unsave recipe: recipe id is required.');
  }

  const colRef = getSavedRecipesCollectionRef();
  const q = query(
    colRef,
    where('userId', '==', userId),
    where('recipeId', '==', recipeId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  const firstDoc = snapshot.docs[0];
  const docRef = doc(db, SAVED_RECIPES_COLLECTION, firstDoc.id);
  await deleteDoc(docRef);
}

/**
 * Returns the list of recipe ids that the user has saved.
 * Used by the UI to show "Saved" vs "Save" and to avoid duplicate saves.
 *
 * @param userId - Current user's uid
 * @returns Array of recipe ids (Recipe.id) that this user has saved
 */
export async function getSavedRecipeIds(userId: string): Promise<string[]> {
  if (!userId) {
    return [];
  }

  const colRef = getSavedRecipesCollectionRef();
  const q = query(colRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const ids: string[] = [];
  snapshot.forEach((document) => {
    const data = document.data();
    const recipeId = data?.recipeId;
    if (typeof recipeId === 'string' && recipeId) {
      ids.push(recipeId);
    }
  });
  return ids;
}
