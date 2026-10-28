import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/stores/appStore';
import { applyTheme, watchSystemTheme } from '@/utils/theme';
import { seedFoodDatabase } from '@/db/seed';
import { OnboardingFlow } from '@/components/Onboarding';
import { TodayPage } from '@/pages/Today';
import { SearchPage } from '@/pages/Search';
import { TrendsPage } from '@/pages/Trends';
import { ScanPage } from '@/pages/Scan';
import { SettingsPage } from '@/pages/Settings';
import { TabBar } from '@/components/TabBar';

export default function App() {
  const { isOnboarded, currentTab, theme, loadProfile } = useAppStore();

  useEffect(() => {
    loadProfile();
    seedFoodDatabase();
  }, [loadProfile]);

  useEffect(() => {
    applyTheme(theme);
    const cleanup = watchSystemTheme(theme);
    return cleanup;
  }, [theme]);

  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        <OnboardingFlow />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {currentTab === 'today' && <TodayPage key="today" />}
          {currentTab === 'search' && <SearchPage key="search" />}
          {currentTab === 'trends' && <TrendsPage key="trends" />}
          {currentTab === 'scan' && <ScanPage key="scan" />}
          {currentTab === 'settings' && <SettingsPage key="settings" />}
        </AnimatePresence>
      </main>
      <TabBar />
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!bg-[var(--color-bg-card)] !text-[var(--color-text-primary)] !shadow-lg',
          duration: 2000,
        }}
      />
    </div>
  );
}
