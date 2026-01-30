'use client';

import { useState } from 'react';
import { Layout } from '../components/Layout';
import AddFood from '../components/InputInventory';
import ScanAnalyzer from '../components/ScanAnalyzer';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pantry');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">Scan Items</h1>
            <p className="text-gray-700">Upload a receipt or fridge photo to analyze.</p>
          </div>
          <ScanAnalyzer />
        </div>
      )}
      
      {activeTab === 'pantry' && <AddFood />}
      
      {activeTab === 'recipes' && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Recipe History</h1>
          <p>Your saved recipes will appear here...</p>
        </div>
      )}
    </Layout>
  );
}