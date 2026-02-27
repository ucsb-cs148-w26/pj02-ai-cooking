'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase';

export default function SavedRecipesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-700">Loading saved recipes...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          My Saved Recipes
        </h1>
        <p className="text-gray-700">
          This page will show all of your saved recipes. In a later step, we&apos;ll
          fetch them from Firestore and display them here.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-6 text-gray-600">
          <p>
            Saved recipes list coming soon. For now, you can use the Save button on
            generated recipes to start populating this view.
          </p>
        </div>
      </div>
    </main>
  );
}


