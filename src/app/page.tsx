'use client';

import { useStore } from '@/store/useStore';
import Navigation from '@/components/Navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';

const QuizModule = dynamic(() => import('@/components/quiz/QuizModule'), { ssr: false });
const DiseaseMapModule = dynamic(() => import('@/components/diseases/DiseaseMapModule'), { ssr: false });
const FoodModule = dynamic(() => import('@/components/food/FoodModule'), { ssr: false });
const FastingModule = dynamic(() => import('@/components/fasting/FastingModule'), { ssr: false });
const ExerciseModule = dynamic(() => import('@/components/exercise/ExerciseModule'), { ssr: false });
const ProtocolModule = dynamic(() => import('@/components/protocol/ProtocolModule'), { ssr: false });
const KnowledgeModule = dynamic(() => import('@/components/knowledge/KnowledgeModule'), { ssr: false });

const modules = [
  QuizModule,
  DiseaseMapModule,
  FoodModule,
  FastingModule,
  ExerciseModule,
  ProtocolModule,
  KnowledgeModule,
];

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );
}

export default function Home() {
  const { activeTab } = useStore();
  const ActiveModule = modules[activeTab];

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navigation />
      <main className="lg:ml-20 pb-20 lg:pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 max-w-5xl mx-auto"
          >
            <Suspense fallback={<LoadingSpinner />}>
              <ActiveModule />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
