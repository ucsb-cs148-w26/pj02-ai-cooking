import React from 'react';
import { ChefHat, ShoppingBag, Utensils, History, User, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 bg-gradient-to-br from-purple-100 via-pink-50 via-blue-50 to-yellow-100 relative overflow-hidden">
      {/* Animated Colorful Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-300 to-orange-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-400 to-purple-500 opacity-20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-pink-400 to-red-400 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-green-300 to-teal-400 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Desktop Header - Vibrant Gradient */}
      <header className="hidden md:flex fixed top-0 w-full h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 backdrop-blur-xl border-b border-white/30 px-8 items-center justify-between z-50 text-white shadow-2xl">
        {/* Rainbow glow effect behind header */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-orange-500 opacity-90"></div>
        
        <div className="relative flex items-center gap-3 font-bold text-xl tracking-tight group">
          <div className="relative">
            <ChefHat size={32} className="text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)] transform group-hover:rotate-12 transition-transform duration-300" />
            <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent drop-shadow-lg">
            Smart<span className="text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.9)]"> Cooking & Storing </span> Helper
          </span>
        </div>
        
        <nav className="relative flex gap-6">
          <button 
            onClick={() => onTabChange('scan')}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
              activeTab === 'scan' 
                ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white font-bold shadow-[0_0_25px_rgba(251,191,36,0.7)] scale-105' 
                : 'text-white/80 hover:text-white hover:bg-white/20 hover:scale-105'
            }`}
          >
            <Utensils size={20} className={activeTab === 'scan' ? 'animate-bounce' : ''} />
            <span>Scan</span>
            {activeTab === 'scan' && <div className="absolute inset-0 rounded-full bg-yellow-300 opacity-30 blur-xl"></div>}
          </button>
          
          <button 
            onClick={() => onTabChange('pantry')}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
              activeTab === 'pantry' 
                ? 'bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400 text-white font-bold shadow-[0_0_25px_rgba(52,211,153,0.7)] scale-105' 
                : 'text-white/80 hover:text-white hover:bg-white/20 hover:scale-105'
            }`}
          >
            <ShoppingBag size={20} className={activeTab === 'pantry' ? 'animate-bounce' : ''} />
            <span>Pantry</span>
            {activeTab === 'pantry' && <div className="absolute inset-0 rounded-full bg-green-300 opacity-30 blur-xl"></div>}
          </button>
          
          <button 
            onClick={() => onTabChange('recipes')}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
              activeTab === 'recipes' 
                ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white font-bold shadow-[0_0_25px_rgba(236,72,153,0.7)] scale-105' 
                : 'text-white/80 hover:text-white hover:bg-white/20 hover:scale-105'
            }`}
          >
            <History size={20} className={activeTab === 'recipes' ? 'animate-bounce' : ''} />
            <span>Recipes</span>
            {activeTab === 'recipes' && <div className="absolute inset-0 rounded-full bg-pink-300 opacity-30 blur-xl"></div>}
          </button>
        </nav>
      
        {/* Auth Buttons - Colorful */}
        <div className="relative flex items-center gap-4">
          <button 
            onClick={() => console.log('Log In clicked')}
            className="px-5 py-2 text-sm font-medium text-white hover:text-yellow-300 transition-all duration-300 hover:scale-105 border-2 border-white/30 rounded-full hover:border-yellow-300/60 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(253,224,71,0.5)]"
          >
            Log In
          </button>
          <button 
            onClick={() => console.log('Sign Up clicked')}
            className="relative px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white rounded-full hover:shadow-[0_0_30px_rgba(251,191,36,0.8)] transition-all duration-300 hover:scale-110 transform"
          >
            <span className="relative z-10">Sign Up</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 via-pink-400 to-yellow-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative max-w-4xl mx-auto p-4 md:p-8 z-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Colorful Glassmorphism */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-gradient-to-r from-purple-500/80 via-pink-500/80 to-orange-500/80 backdrop-blur-xl border-t border-white/30 flex items-center justify-around z-50 shadow-[0_-8px_20px_-4px_rgba(168,85,247,0.4)]">
        <button 
          onClick={() => onTabChange('scan')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === 'scan' 
              ? 'text-yellow-300 scale-110' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <div className={`relative ${activeTab === 'scan' ? 'animate-bounce' : ''}`}>
            <Utensils size={24} className={activeTab === 'scan' ? 'fill-yellow-300/20 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]' : ''} />
            {activeTab === 'scan' && (
              <div className="absolute inset-0 bg-yellow-300 opacity-30 blur-lg rounded-full"></div>
            )}
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'scan' ? 'text-yellow-300 drop-shadow-[0_0_4px_rgba(253,224,71,0.8)]' : 'text-white'}`}>SCAN</span>
        </button>
        
        <button 
          onClick={() => onTabChange('pantry')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === 'pantry' 
              ? 'text-green-300 scale-110' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <div className={`relative ${activeTab === 'pantry' ? 'animate-bounce' : ''}`}>
            <ShoppingBag size={24} className={activeTab === 'pantry' ? 'fill-green-300/20 drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]' : ''} />
            {activeTab === 'pantry' && (
              <div className="absolute inset-0 bg-green-300 opacity-30 blur-lg rounded-full"></div>
            )}
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'pantry' ? 'text-green-300 drop-shadow-[0_0_4px_rgba(134,239,172,0.8)]' : 'text-white'}`}>PANTRY</span>
        </button>
        
        <button 
          onClick={() => onTabChange('recipes')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            activeTab === 'recipes' 
              ? 'text-pink-300 scale-110' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <div className={`relative ${activeTab === 'recipes' ? 'animate-bounce' : ''}`}>
            <History size={24} className={activeTab === 'recipes' ? 'fill-pink-300/20 drop-shadow-[0_0_8px_rgba(249,168,212,0.8)]' : ''} />
            {activeTab === 'recipes' && (
              <div className="absolute inset-0 bg-pink-300 opacity-30 blur-lg rounded-full"></div>
            )}
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'recipes' ? 'text-pink-300 drop-shadow-[0_0_4px_rgba(249,168,212,0.8)]' : 'text-white'}`}>RECIPES</span>
        </button>
        
        <button 
          onClick={() => console.log('Account clicked')}
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
        >
          <User size={24} />
          <span className="text-[10px] font-bold">ACCOUNT</span>
        </button>
      </nav>
    </div>
  );
};