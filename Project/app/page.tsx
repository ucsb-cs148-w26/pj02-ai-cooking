'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase';
import { ChefHat, Sparkles, Utensils, ShoppingBag, History, Zap, Camera, BookOpen } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 via-blue-50 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 via-blue-50 to-yellow-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-300 to-orange-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-400 to-purple-500 opacity-20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-pink-400 to-red-400 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-green-300 to-teal-400 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 md:px-12 md:py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-2xl md:text-3xl tracking-tight group">
            <div className="relative">
              <ChefHat size={40} className="text-purple-600 drop-shadow-lg transform group-hover:rotate-12 transition-transform duration-300" />
              <Sparkles size={20} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              PantryPal
            </span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-all duration-300 hover:scale-105 border-2 border-purple-300 rounded-full hover:border-purple-400 hover:bg-purple-50"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-110"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 md:px-12 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Your Smart Cooking Companion
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Transform your pantry into delicious meals. Scan, organize, and discover recipes with AI-powered PantryPal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 transform"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 text-lg font-semibold bg-white/80 backdrop-blur-lg text-purple-600 rounded-xl border-2 border-purple-300 hover:border-purple-400 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
                <Camera size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Smart Scanning</h3>
              <p className="text-gray-600">
                Upload photos of receipts or your fridge. Our AI automatically identifies and adds items to your pantry.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Organized Pantry</h3>
              <p className="text-gray-600">
                Keep track of expiration dates, quantities, and categories. Never waste food again with smart organization.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-pink-200 hover:border-pink-400 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">AI Recipes</h3>
              <p className="text-gray-600">
                Generate personalized recipes based on what's in your pantry. Get cooking suggestions tailored to your preferences.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-20 bg-white/60 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-purple-200">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Sign Up</h3>
                <p className="text-gray-600">Create your free account and set your dietary preferences</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Add Items</h3>
                <p className="text-gray-600">Scan receipts or manually add items to your digital pantry</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Cook & Enjoy</h3>
                <p className="text-gray-600">Get AI-powered recipe suggestions and start cooking!</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Ready to Transform Your Cooking?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Join thousands of users who are cooking smarter with PantryPal
            </p>
            <Link
              href="/signup"
              className="inline-block px-10 py-5 text-xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 transform"
            >
              Start Your Free Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
