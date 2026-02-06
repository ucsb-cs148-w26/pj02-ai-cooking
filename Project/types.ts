export type ScanMode = 'food' | 'receipt';

export interface Ingredient {
  id?: string;
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

export interface UserPreferences {
  name: string;
  allergies: string[];
  customAllergies?: string;
  dietType: string;
  cuisinePreferences: string[];
  cookingSkillLevel: string;
  onboardingComplete: boolean;
  cuisine?: string;
  restrictions?: string;
}
