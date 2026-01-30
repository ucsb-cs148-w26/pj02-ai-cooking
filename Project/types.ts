export type ScanMode = 'food' | 'receipt';

export interface Ingredient {
  name: string;
  quantity?: string;
  category?: string;
  expiryEstimate?: string;
}

export interface ReceiptItem {
  name: string;
  price?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  time: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  calories?: number;
  image?: string;
}

export interface ScanResult {
  mode: ScanMode;
  items: string[];
  rawAnalysis?: any;
}

// Enhanced UserPreferences interface for onboarding
export interface UserPreferences {
  // New detailed fields
  name: string;
  allergies: string[];
  dietType: string;
  cuisinePreferences: string[];
  cookingSkillLevel: string;
  onboardingComplete: boolean;
  
  // Legacy fields for backwards compatibility with existing code
  cuisine?: string;
  restrictions?: string;
}