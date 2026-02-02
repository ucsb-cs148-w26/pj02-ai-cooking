import { UserPreferences } from '../types';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

const PREFERENCES_KEY = 'pantrypal_user_preferences'; // Kept for potential fallback or future use, though not directly used in Firestore functions
const ONBOARDING_KEY = 'pantrypal_onboarding_complete'; // Kept for potential fallback or future use, though not directly used in Firestore functions

export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  if (!userId) {
    console.error("Cannot save preferences: User ID is missing.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, preferences, { merge: true });
  } catch (error) {
    console.error('Error saving user preferences to Firestore:', error);
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!userId) {
    console.error("Cannot get preferences: User ID is missing.");
    return null;
  }

  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error loading user preferences from Firestore:', error);
    return null;
  }
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() && docSnap.data()?.onboardingComplete === true;
  } catch (error) {
    console.error('Error checking onboarding status from Firestore:', error);
    return false;
  }
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  if (!userId) {
    console.error("Cannot mark onboarding complete: User ID is missing.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { onboardingComplete: true });
  } catch (error) {
    console.error('Error marking onboarding complete in Firestore:', error);
  }
}

export async function resetUserPreferences(userId: string): Promise<void> {
  if (!userId) {
    console.error("Cannot reset preferences: User ID is missing.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error('Error resetting user preferences in Firestore:', error);
  }
}

export async function updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
  if (!userId) {
    console.error("Cannot update preferences: User ID is missing.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, updates);
  } catch (error) {
    console.error('Error updating user preferences in Firestore:', error);
  }
}
