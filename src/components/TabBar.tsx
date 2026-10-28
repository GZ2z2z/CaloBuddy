import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

const tabs = [
  { id: 'today' as const, label: '今日', icon: '📋' },
  { id: 'trends' as const, label: '趋势', icon: '📊' },
  { id: 'scan' as const, label: '扫描', icon: '📷' },
  { id: 'settings' as const, label: '设置', icon: '⚙️' },
];

export function TabBar() {
  const { currentTab, setCurrentTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-[var(--color-bg-card)]/80 border-t border-[var(--color-divider)] safe-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative"
            >
              <span className="text-xl">{tab.icon}</span>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? 'text-[var(--color-calories)]' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-px left-3 right-3 h-0.5 bg-[var(--color-calories)] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
