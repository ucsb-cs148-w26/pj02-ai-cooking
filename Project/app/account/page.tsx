'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, useAuth } from '@/lib/firebase';
import { getUserPreferences, saveUserPreferences } from '@/services/userPreferencesService';
import { UserPreferences } from '@/types';
import { ChefHat, Mail, Calendar, LogOut, User, Sparkles } from 'lucide-react';

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

const DEFAULT_PREFS: UserPreferences = {
  name: '',
  allergies: [],
  dietType: 'None',
  cuisinePreferences: [],
  cookingSkillLevel: 'Intermediate',
  onboardingComplete: true,
};

export default function AccountPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<UserPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      getUserPreferences(currentUser.uid).then(prefs => {
        setUserPreferences(prefs);
        const next = prefs
          ? { ...DEFAULT_PREFS, ...prefs, onboardingComplete: prefs.onboardingComplete ?? true }
          : DEFAULT_PREFS;
        setForm(next);
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

  const handleSavePreferences = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const toSave: UserPreferences = {
        name: form.name.trim() || '',
        allergies: form.allergies ?? [],
        customAllergies: form.customAllergies?.trim() || undefined,
        dietType: form.dietType || 'None',
        cuisinePreferences: form.cuisinePreferences ?? [],
        cookingSkillLevel: form.cookingSkillLevel || 'Intermediate',
        onboardingComplete: form.onboardingComplete ?? true,
        cuisine: form.cuisine?.trim() || undefined,
        restrictions: form.restrictions?.trim() || undefined,
      };
      await saveUserPreferences(currentUser.uid, toSave);
      setUserPreferences(toSave);
      setSaveMessage({ type: 'success', text: 'Preferences saved.' });
    } catch (err) {
      console.error('Save preferences error:', err);
      setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
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

          {/* Editable Preferences */}
          <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: colors.terracotta + '10' }}>
            <div className="flex items-center gap-2">
              <Sparkles style={{ color: colors.terracotta }} size={24} />
              <p className="text-sm font-semibold" style={{ color: colors.olive }}>Preferences</p>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.olive }}>Display name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.olive }}>Diet type</label>
                <select
                  value={form.dietType}
                  onChange={e => setForm({ ...form, dietType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                >
                  <option value="None">None</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Pescatarian">Pescatarian</option>
                  <option value="Keto">Keto</option>
                  <option value="Gluten-free">Gluten-free</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.olive }}>Cooking skill level</label>
                <select
                  value={form.cookingSkillLevel}
                  onChange={e => setForm({ ...form, cookingSkillLevel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.olive }}>Allergies (comma-separated)</label>
                <input
                  type="text"
                  value={form.allergies?.join(', ') ?? ''}
                  onChange={e => setForm({ ...form, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  placeholder="e.g. nuts, shellfish"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.olive }}>Cuisine preferences (comma-separated)</label>
                <input
                  type="text"
                  value={form.cuisinePreferences?.join(', ') ?? ''}
                  onChange={e => setForm({ ...form, cuisinePreferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  placeholder="e.g. Italian, Mexican"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.olive }}>Recipe restrictions (e.g. vegetarian, no nuts)</label>
                <input
                  type="text"
                  value={form.restrictions ?? ''}
                  onChange={e => setForm({ ...form, restrictions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
                  placeholder="Optional"
                />
              </div>
            </div>
            {saveMessage && (
              <p className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {saveMessage.text}
              </p>
            )}
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={saving}
              className="px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: colors.terracotta }}
            >
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
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