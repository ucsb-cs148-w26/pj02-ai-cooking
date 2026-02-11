'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, useAuth } from '@/lib/firebase';
import { getUserPreferences } from '@/services/userPreferencesService';
import { UserPreferences } from '@/types';
import { ChefHat, Mail, Calendar, LogOut, User, Sparkles } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const currentUser = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser && !loading) {
      router.push('/login');
      return;
    }

    // Load user preferences
    if (currentUser) {
      getUserPreferences(currentUser.uid).then(prefs => {
        setUserPreferences(prefs);
        setLoading(false);
      });
    }
  }, [currentUser, router, loading]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 via-blue-50 to-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 via-blue-50 to-yellow-100 relative overflow-hidden px-4 py-8 md:pt-24">
      {/* Colorful Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-300 to-orange-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-400 to-purple-500 opacity-20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-pink-400 to-red-400 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
            <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-full border-4 border-purple-200">
              <User size={48} className="text-purple-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            My Account
          </h1>
          <p className="text-gray-600">Manage your PantryPal profile</p>
        </div>

        {/* Account Info Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-purple-200 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ChefHat className="text-purple-600" />
            Account Information
          </h2>

          {/* Email */}
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
            <div className="mt-1">
              <Mail className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Email Address</p>
              <p className="text-lg text-gray-800">{currentUser.email}</p>
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
            <div className="mt-1">
              <User className="text-blue-600" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-600">User ID</p>
              <p className="text-sm text-gray-800 font-mono break-all">{currentUser.uid}</p>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl">
            <div className="mt-1">
              <Calendar className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Member Since</p>
              <p className="text-lg text-gray-800">
                {currentUser.metadata.creationTime 
                  ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>

          {/* User Preferences (if available) */}
          {userPreferences && (
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
              <div className="mt-1">
                <Sparkles className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Dietary Preferences</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userPreferences.dietaryRestrictions && userPreferences.dietaryRestrictions.length > 0 ? (
                    userPreferences.dietaryRestrictions.map((restriction, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-white/60 rounded-full text-sm font-medium text-gray-700 border border-yellow-200"
                      >
                        {restriction}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No dietary restrictions set</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
        >
          {loggingOut ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging out...
            </>
          ) : (
            <>
              <LogOut size={24} />
              Logout
            </>
          )}
        </button>

        {/* Back to Home */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 px-6 bg-white/60 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl hover:bg-white/80 transition-all border-2 border-gray-200"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}