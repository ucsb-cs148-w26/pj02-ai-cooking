import { UserPreferences } from '../types';

const PREFERENCES_KEY = 'pantrypal_user_preferences';
const ONBOARDING_KEY = 'pantrypal_onboarding_complete';

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

/**
 * Load user preferences from localStorage
 */
export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }
  
  return null;
}

/**
 * Check if onboarding has been completed
 */
export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const complete = localStorage.getItem(ONBOARDING_KEY);
    return complete === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
export function markOnboardingComplete(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
}

/**
 * Reset all user preferences and onboarding status
 */
export function resetUserPreferences(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(PREFERENCES_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting user preferences:', error);
  }
}

/**
 * Update specific preference fields
 */
export function updateUserPreferences(updates: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  
  if (current) {
    saveUserPreferences({ ...current, ...updates });
  }
}