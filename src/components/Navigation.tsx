'use client';

import { useStore } from '@/store/useStore';
import {
  ClipboardCheck,
  Heart,
  UtensilsCrossed,
  Timer,
  Dumbbell,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { icon: ClipboardCheck, label: 'Тест' },
  { icon: Heart, label: 'Болести' },
  { icon: UtensilsCrossed, label: 'Храни' },
  { icon: Timer, label: 'Гладуване' },
  { icon: Dumbbell, label: 'Тренировка' },
  { icon: CheckSquare, label: 'Протокол' },
  { icon: BookOpen, label: 'Знание' },
];

export default function Navigation() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-20 flex-col items-center py-6 gap-2 z-50"
        style={{ background: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid rgba(51, 65, 85, 0.5)' }}>
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">IR</span>
          </div>
        </div>
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === i;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
                isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={20} className="relative z-10" />
              <span className="text-[10px] mt-1 relative z-10 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-1 safe-area-bottom"
        style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === i;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`relative flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive ? 'text-teal-400' : 'text-slate-500'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-active"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(20, 184, 166, 0.1)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={18} className="relative z-10" />
              <span className="text-[9px] mt-0.5 relative z-10 font-medium truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
