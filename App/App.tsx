
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Scanner } from './components/Scanner';
import { InventoryView } from './components/InventoryView';
import { RecipeView } from './components/RecipeView';
import { Ingredient, Recipe, ScanMode, UserPreferences } from './types';
import { analyzeImage, generateRecipes } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('gaucho_pantry');
    if (saved) setIngredients(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('gaucho_pantry', JSON.stringify(ingredients));
  }, [ingredients]);

  const handleScan = async (image: string, mode: ScanMode) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(image, mode);
      
      let newItems: Ingredient[] = [];
      if (mode === 'food' && result.ingredients) {
        newItems = result.ingredients;
      } else if (mode === 'receipt' && result.items) {
        newItems = result.items.map((item: string | any) => {
          if (typeof item === 'string') {
            return { name: item, quantity: '1', expiryEstimate: 'Unknown' };
          }
          return { name: item.name, quantity: item.quantity || '1', expiryEstimate: 'Unknown' };
        });
      }

      setIngredients(prev => {
        const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
        const filtered = newItems.filter(n => !existingNames.has(n.name.toLowerCase()));
        return [...prev, ...filtered];
      });
      
      setActiveTab('pantry');
    } catch (err) {
      console.error(err);
      alert("Something went wrong with the AI analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const clearPantry = () => {
    if (confirm("Are you sure you want to clear your entire pantry?")) {
      setIngredients([]);
    }
  };

  const handleGenerateRecipes = async (preferences: UserPreferences) => {
    setRecipes([]); 
    setIsGeneratingRecipes(true);
    setActiveTab('recipes');
    try {
      const results = await generateRecipes(ingredients, preferences);
      setRecipes(results);
    } catch (err) {
      alert("Failed to generate recipes.");
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'scan':
        return (
          <div className="space-y-12 py-8 animate-in fade-in duration-500">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-black text-[#003660] mb-4 tracking-tight">Gaucho <span className="text-[#FEBC11]">AI</span> Kitchen</h1>
              <p className="text-slate-600 font-medium max-w-lg mx-auto leading-relaxed text-lg">
                The smart way to cook at UCSB. Snap a photo of your food or receipts, track expiration dates, and get personalized recipes to reduce waste.
              </p>
            </div>
            <Scanner onScan={handleScan} isLoading={isAnalyzing} />
          </div>
        );
      case 'pantry':
        return (
          <InventoryView 
            ingredients={ingredients} 
            onRemove={removeIngredient} 
            onClear={clearPantry}
            onGenerateRecipes={handleGenerateRecipes}
          />
        );
      case 'recipes':
        return (
          <RecipeView 
            recipes={recipes} 
            onBack={() => setActiveTab('pantry')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
