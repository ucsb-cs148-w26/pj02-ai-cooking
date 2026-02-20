'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      
      const message = err.code === "auth/user-not-found"
        ? "No account found with this email. Please sign up first."
        : err.code === "auth/wrong-password"
        ? "Incorrect password. Please try again."
        : err.code === "auth/invalid-email"
        ? "Please enter a valid email address."
        : err.code === "auth/invalid-credential"
        ? "Invalid email or password. Please check your credentials."
        : err.code === "auth/too-many-requests"
        ? "Too many failed login attempts. Please try again later."
        : err.message || "Login failed. Please try again.";
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8" style={{ backgroundColor: colors.cream }}>
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ChefHat size={48} style={{ color: colors.terracotta }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: colors.olive }}>
            Welcome Back
          </h2>
          <p style={{ color: colors.olive, opacity: 0.8 }}>Sign in to your PantryPal account</p>
        </div>
        
        {/* Form Card */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl p-8 space-y-6 border"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.dustyRose + '40' }}
        >
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: colors.terracotta + '15', color: colors.terracotta, border: `1px solid ${colors.terracotta}40` }}>
              {error}
            </div>
          )}
          
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
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
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
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              style={{ borderColor: colors.dustyRose + '60', color: colors.olive }}
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium transition-colors" style={{ color: colors.steelBlue }}>
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.terracotta }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center text-sm pt-2">
            <span style={{ color: colors.olive, opacity: 0.7 }}>Don&apos;t have an account? </span>
            <Link href="/signup" className="font-bold transition-colors" style={{ color: colors.steelBlue }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
