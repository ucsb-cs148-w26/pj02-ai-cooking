"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white">
      
      {/* Header */}
      <header className="w-full border-b px-8 py-4">
        <h1 className="text-xl font-semibold">AI Cooking</h1>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6">
        <h2 className="text-4xl font-bold text-pink-500">
          Hello World
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This is the home page of the website.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Back
          </button>
          <button
            onClick={() => router.push("/next")}
            className="rounded bg-pink-500 px-4 py-2 text-white hover:bg-pink-600"
          >
            Next
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t px-8 py-4 text-center text-sm text-gray-500">
      
      </footer>
    </div>
  );
}