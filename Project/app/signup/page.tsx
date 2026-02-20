'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/onboarding");
    } catch (err: any) {
      console.error("Signup error:", err);
      const message = err.code === "auth/email-already-in-use"
        ? "This email is already registered. Try signing in."
        : err.code === "auth/weak-password"
          ? "Password is too weak. Use at least 6 characters."
          : err.code === "auth/invalid-email"
            ? "Please enter a valid email address."
            : err.message || "Signup failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4" style={{ backgroundColor: colors.cream }}>
      <div className="max-w-md w-full relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 w-full">
          <ChefHat size={48} style={{ color: colors.terracotta }} className="mb-4" />
          <h2 className="text-4xl font-bold" style={{ color: colors.olive }}>
            Join PantryPal
          </h2>
          <p className="mt-2" style={{ color: colors.olive, opacity: 0.8 }}>Create your account to get started</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSignup}
          className="w-full space-y-6 rounded-2xl p-8 border"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
        >
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: colors.terracotta + '15', color: colors.terracotta, border: `1px solid ${colors.terracotta}40` }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
              />
              <p className="mt-1 text-sm" style={{ color: colors.olive, opacity: 0.6 }}>Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-semibold mb-2 text-sm" style={{ color: colors.olive }}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.terracotta }}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <div className="text-center text-sm">
            <span style={{ color: colors.olive, opacity: 0.7 }}>Already have an account? </span>
            <Link href="/login" className="font-bold" style={{ color: colors.steelBlue }}>
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
