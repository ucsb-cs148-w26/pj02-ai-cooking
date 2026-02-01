import { UserPreferences } from '../types';

const PREFERENCES_KEY = 'pantrypal_user_preferences';
const ONBOARDING_KEY = 'pantrypal_onboarding_complete';

export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored) as UserPreferences;
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }

  return null;
}

export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

export function markOnboardingComplete(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
}

export function resetUserPreferences(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(PREFERENCES_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting user preferences:', error);
  }
}

export function updateUserPreferences(updates: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  if (current) {
    saveUserPreferences({ ...current, ...updates });
  }
}
