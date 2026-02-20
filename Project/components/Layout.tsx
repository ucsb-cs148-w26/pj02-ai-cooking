'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, ShoppingBag, Utensils, History, User, Calendar, Apple, Carrot, Wheat, Leaf, Cherry, UtensilsCrossed, Coffee } from 'lucide-react';
import { useAuthContext } from '@/components/AuthProvider';
import { ExpirationCalendar } from '@/components/ExpirationCalendar';

const colors = {
  terracotta: '#C97064',
  olive: '#515B3A',
  cream: '#ECDCC9',
  dustyRose: '#CF9D8C',
  steelBlue: '#33658A',
};

const iconSize = 36;
const bgIcons = [
  { Icon: UtensilsCrossed, top: '5%', left: '8%', color: colors.dustyRose },
  { Icon: Apple, top: '5%', left: '28%', color: colors.terracotta },
  { Icon: Wheat, top: '5%', right: '28%', color: colors.steelBlue },
  { Icon: Cherry, top: '5%', right: '8%', color: colors.olive },
  { Icon: Leaf, bottom: '8%', left: '8%', color: colors.terracotta },
  { Icon: Carrot, bottom: '8%', left: '28%', color: colors.olive },
  { Icon: Coffee, bottom: '8%', right: '28%', color: colors.steelBlue },
  { Icon: UtensilsCrossed, bottom: '8%', right: '8%', color: colors.dustyRose },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const router = useRouter();
  const currentUser = useAuthContext();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleLogin = () => router.push('/login');
  const handleSignUp = () => router.push('/signup');

  const navItems = [
    { key: 'scan', label: 'Scan', Icon: Utensils },
    { key: 'pantry', label: 'Pantry', Icon: ShoppingBag },
    { key: 'recipes', label: 'Recipes', Icon: History },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 relative overflow-hidden" style={{ backgroundColor: colors.cream }}>
      {/* Background food icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {bgIcons.map(({ Icon, color, ...pos }, i) => (
          <div key={i} className="absolute opacity-20" style={{ ...pos, color }}>
            <Icon size={iconSize} strokeWidth={1.5} />
          </div>
        ))}
      </div>

      {/* Desktop Header */}
      <header
        className="hidden md:flex fixed top-0 w-full h-16 px-8 items-center justify-between z-50 border-b"
        style={{ backgroundColor: colors.olive, borderColor: colors.dustyRose + '40' }}
      >
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-playfair)', color: colors.cream }}>
          <ChefHat size={30} style={{ color: colors.dustyRose }} />
          PantryPal
        </div>

        <nav className="flex gap-2">
          {navItems.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                activeTab === key
                  ? { backgroundColor: colors.terracotta, color: '#fff' }
                  : { color: colors.cream + 'cc', backgroundColor: 'transparent' }
              }
              onMouseEnter={(e) => { if (activeTab !== key) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={(e) => { if (activeTab !== key) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: colors.cream }}
            title="Expiration Calendar"
          >
            <Calendar size={20} />
          </button>
          {currentUser ? (
            <Link
              href="/account"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: colors.cream }}
              title="Account"
            >
              <User size={20} />
            </Link>
          ) : (
            <>
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: colors.cream, border: `1px solid ${colors.cream}40` }}
              >
                Log In
              </button>
              <button
                onClick={handleSignUp}
                className="px-5 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: colors.terracotta, color: '#fff' }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* Calendar modal */}
      {calendarOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
          onClick={() => setCalendarOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Expiration calendar"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ExpirationCalendar onClose={() => setCalendarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto p-4 md:p-8 z-10">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full h-16 flex items-center justify-around z-50 border-t"
        style={{ backgroundColor: colors.olive, borderColor: colors.dustyRose + '40' }}
      >
        {navItems.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className="flex flex-col items-center gap-1 transition-colors"
            style={activeTab === key ? { color: colors.dustyRose } : { color: colors.cream + '99' }}
          >
            <Icon size={22} />
            <span className="text-[10px] font-bold uppercase">{label}</span>
          </button>
        ))}
        <Link
          href={currentUser ? '/account' : '/login'}
          className="flex flex-col items-center gap-1"
          style={{ color: colors.cream + '99' }}
        >
          <User size={22} />
          <span className="text-[10px] font-bold uppercase">Account</span>
        </Link>
      </nav>
    </div>
  );
};
