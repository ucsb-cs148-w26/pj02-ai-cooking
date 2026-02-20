'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, useAuth } from '@/lib/firebase';
import { getUserPreferences } from '@/services/userPreferencesService';
import { UserPreferences } from '@/types';
import { ChefHat, Mail, Calendar, LogOut, User, Sparkles } from 'lucide-react';

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

export default function AccountPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      getUserPreferences(currentUser.uid).then(prefs => {
        setUserPreferences(prefs);
        setLoading(false);
      });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [currentUser, router, authLoading]);

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

  if (authLoading || loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.cream }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent mx-auto" style={{ borderColor: colors.terracotta }} />
          <p className="mt-4" style={{ color: colors.olive }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-8 md:pt-24" style={{ backgroundColor: colors.cream }}>
      <div className="max-w-2xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div
              className="p-6 rounded-full border-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '60' }}
            >
              <User size={48} style={{ color: colors.terracotta }} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: colors.olive }}>
            My Account
          </h1>
          <p style={{ color: colors.olive, opacity: 0.8 }}>Manage your PantryPal profile</p>
        </div>

        {/* Account Info Card */}
        <div
          className="rounded-2xl p-8 space-y-6 border"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
        >
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.olive }}>
            <ChefHat style={{ color: colors.terracotta }} />
            Account Information
          </h2>

          {/* Email */}
          <div className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: colors.dustyRose + '15' }}>
            <div className="mt-1">
              <Mail style={{ color: colors.terracotta }} size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.olive, opacity: 0.7 }}>Email Address</p>
              <p className="text-lg" style={{ color: colors.olive }}>{currentUser.email}</p>
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: colors.steelBlue + '10' }}>
            <div className="mt-1">
              <User style={{ color: colors.steelBlue }} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: colors.olive, opacity: 0.7 }}>User ID</p>
              <p className="text-sm font-mono break-all" style={{ color: colors.olive }}>{currentUser.uid}</p>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: colors.olive + '10' }}>
            <div className="mt-1">
              <Calendar style={{ color: colors.olive }} size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.olive, opacity: 0.7 }}>Member Since</p>
              <p className="text-lg" style={{ color: colors.olive }}>
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

          {/* User Preferences */}
          {userPreferences && (
            <div className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: colors.terracotta + '10' }}>
              <div className="mt-1">
                <Sparkles style={{ color: colors.terracotta }} size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: colors.olive, opacity: 0.7 }}>Dietary Preferences</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userPreferences.allergies && userPreferences.allergies.length > 0 ? (
                    userPreferences.allergies.map((item, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 rounded-full text-sm font-medium border"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)', color: colors.olive, borderColor: colors.dustyRose + '40' }}
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm" style={{ color: colors.olive, opacity: 0.6 }}>No dietary restrictions set</span>
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
          className="w-full py-4 px-6 text-white font-bold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{ backgroundColor: colors.terracotta }}
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

        {/* Back to Dashboard */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 px-6 font-semibold rounded-xl transition-colors border-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: colors.olive, borderColor: colors.dustyRose + '40' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
