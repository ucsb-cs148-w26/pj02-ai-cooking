'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase';
import { ChefHat, Camera, ShoppingBag, BookOpen, UtensilsCrossed, Apple, Carrot, Wheat, Coffee, Leaf, Cherry } from 'lucide-react';
import { Playfair_Display, Roboto } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto' });

// Palette: C97064, 515B3A, ECDCC9, CF9D8C, 33658A
const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

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
      <div
        className={`min-h-screen flex items-center justify-center ${roboto.className}`}
        style={{ backgroundColor: colors.cream }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent mx-auto mb-4"
            style={{ borderColor: colors.terracotta }}
          />
          <p style={{ color: colors.olive }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const iconSize = 44;
  const bgIcons = [
    // Top row
    { Icon: UtensilsCrossed, top: '6%', left: '12%', size: iconSize, color: colors.dustyRose },
    { Icon: Apple, top: '6%', left: '32%', size: iconSize, color: colors.terracotta },
    { Icon: Wheat, top: '6%', left: '52%', size: iconSize, color: colors.steelBlue },
    { Icon: Cherry, top: '6%', left: '72%', size: iconSize, color: colors.olive },
    // Bottom row
    { Icon: Leaf, bottom: '6%', left: '12%', size: iconSize, color: colors.terracotta },
    { Icon: Carrot, bottom: '6%', left: '32%', size: iconSize, color: colors.olive },
    { Icon: Coffee, bottom: '6%', left: '52%', size: iconSize, color: colors.steelBlue },
    { Icon: UtensilsCrossed, bottom: '6%', left: '72%', size: iconSize, color: colors.dustyRose },
    // Left column
    { Icon: Carrot, top: '38%', left: '4%', size: iconSize - 4, color: colors.olive },
    { Icon: Leaf, top: '62%', left: '4%', size: iconSize - 4, color: colors.terracotta },
    // Right column 
    { Icon: Apple, top: '38%', right: '4%', size: iconSize - 4, color: colors.dustyRose },
    { Icon: Wheat, top: '62%', right: '4%', size: iconSize - 4, color: colors.steelBlue },
  ];

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${playfair.variable} ${roboto.variable}`}
      style={{ backgroundColor: colors.cream }}
    >
      {/* Food-themed background icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {bgIcons.map(({ Icon, size, color, top, left, right, bottom }, i) => (
          <div
            key={i}
            className="absolute opacity-30"
            style={{ top, left, right, bottom, color }}
          >
            <Icon size={size} strokeWidth={1.5} />
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 md:px-12 md:py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className={`flex items-center gap-3 font-bold text-xl md:text-2xl tracking-tight ${playfair.className}`} style={{ color: colors.olive }}>
            <ChefHat size={32} style={{ color: colors.terracotta }} />
            PantryPal
          </div>
          <nav className={`flex gap-3 ${roboto.className}`}>
            <Link
              href="/login"
              className="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{ color: colors.steelBlue, backgroundColor: 'transparent' }}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.terracotta }}
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 md:px-12 pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="max-w-5xl mx-auto">
          <section className="text-center mb-16 md:mb-24">
            <h1
              className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight max-w-2xl mx-auto leading-tight ${playfair.className}`}
              style={{ color: colors.olive }}
            >
              Your smart cooking companion
            </h1>
            <p
              className={`text-lg md:text-xl mb-10 max-w-xl mx-auto opacity-90 ${roboto.className}`}
              style={{ color: colors.olive }}
            >
              Transform your ingredients into delicious, tailored meals. Scan, organize, and discover recipes with PantryPal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className={`w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white rounded-lg text-center transition-opacity hover:opacity-90 ${roboto.className}`}
                style={{ backgroundColor: colors.terracotta }}
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className={`w-full sm:w-auto px-8 py-4 text-lg font-medium rounded-lg text-center border-2 transition-colors ${roboto.className}`}
                style={{ color: colors.steelBlue, borderColor: colors.steelBlue }}
              >
                Sign in
              </Link>
            </div>
          </section>

          {/* Features */}
          <section className={`grid md:grid-cols-3 gap-6 md:gap-8 ${roboto.className}`}>
            <div
              className="rounded-2xl p-6 md:p-8 border border-[#CF9D8C]/40"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: colors.dustyRose }}
              >
                <Camera size={24} style={{ color: colors.olive }} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${playfair.className}`} style={{ color: colors.olive }}>
                Smart scanning
              </h3>
              <p className="text-sm leading-relaxed opacity-90" style={{ color: colors.olive }}>
                Upload photos of receipts or your fridge. AI identifies and adds items to your pantry.
              </p>
            </div>

            <div
              className="rounded-2xl p-6 md:p-8 border border-[#CF9D8C]/40"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: colors.steelBlue }}
              >
                <ShoppingBag size={24} className="text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${playfair.className}`} style={{ color: colors.olive }}>
                Organized pantry
              </h3>
              <p className="text-sm leading-relaxed opacity-90" style={{ color: colors.olive }}>
                Track expiration dates, quantities, and categories. Waste less and cook more.
              </p>
            </div>

            <div
              className="rounded-2xl p-6 md:p-8 border border-[#CF9D8C]/40"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: colors.terracotta }}
              >
                <BookOpen size={24} className="text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${playfair.className}`} style={{ color: colors.olive }}>
                AI recipes
              </h3>
              <p className="text-sm leading-relaxed opacity-90" style={{ color: colors.olive }}>
                Get personalized recipe suggestions based on what’s in your pantry.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center mt-16 md:mt-24">
            <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${playfair.className}`} style={{ color: colors.olive }}>
              Ready to cook smarter?
            </h2>
            <Link
              href="/signup"
              className={`inline-block px-8 py-4 text-lg font-semibold text-white rounded-lg transition-opacity hover:opacity-90 ${roboto.className}`}
              style={{ backgroundColor: colors.terracotta }}
            >
              Start your free account
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
