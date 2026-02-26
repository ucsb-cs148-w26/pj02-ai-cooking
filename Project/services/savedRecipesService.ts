import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
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
