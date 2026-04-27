import React, { useState } from 'react';
import type { Screen, Preset } from './types';
import { AuthProvider } from './context/AuthContext';
import { useSession } from './hooks/useSession';
import { saveSession } from './firebase/sessions';
import { updateStreak } from './utils/localStorage';
import { useAuth } from './context/AuthContext';
import { usePWAUpdate } from './hooks/usePWAUpdate';

import BottomNav from './components/BottomNav';
import UpdateBanner from './components/UpdateBanner';
import HomeScreen from './screens/HomeScreen';
import EditorScreen from './screens/EditorScreen';
import SessionScreen from './screens/SessionScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

const AppInner: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const { user } = useAuth();
  const { sessionData, start, pause, resume, stop, sessionSavedRef } = useSession();
  const { updateAvailable, updateApp } = usePWAUpdate();

  const handleStart = (preset: Preset) => {
    setActivePreset(preset);
    setScreen('session');
    start(preset);
  };

  /**
   * Called either when timer completes OR when user manually taps "End".
   * We save to history only if:
   *   - We haven't already saved this session (guard via sessionSavedRef)
   *   - The user completed ≥ 75% of the total duration
   */
  const handleEndSession = async () => {
    // Prevent triple / double saves
    if (sessionSavedRef.current) {
      stop();
      setScreen('home');
      setActivePreset(null);
      return;
    }

    const { elapsed, total, status } = sessionData;
    const completedFully = status === 'complete';
    // 75% threshold: either timer ran to end, or user did ≥ 75% of the session
    const meetsThreshold = completedFully || (total > 0 && elapsed >= total * 0.75);

    if (meetsThreshold && activePreset) {
      sessionSavedRef.current = true;
      updateStreak();
      await saveSession({
        userId: user?.uid ?? 'anonymous',
        timestamp: Date.now(),
        duration: Math.round(elapsed),
        presetName: activePreset.name,
        completed: completedFully,
      });
    }

    stop();
    setScreen('home');
    setActivePreset(null);
  };

  // Session screen is full-screen, no bottom nav
  if (screen === 'session' && activePreset) {
    return (
      <SessionScreen
        preset={activePreset}
        sessionData={sessionData}
        onPause={pause}
        onResume={resume}
        onEnd={handleEndSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* PWA update banner — floats at top when new version is ready */}
      {updateAvailable && <UpdateBanner onUpdate={updateApp} />}

      {screen === 'home' && (
        <HomeScreen
          onStartSession={handleStart}
          onGoEditor={() => setScreen('editor')}
        />
      )}
      {screen === 'editor' && (
        <EditorScreen onDone={() => setScreen('home')} />
      )}
      {screen === 'history' && <HistoryScreen />}
      {screen === 'profile' && <ProfileScreen />}

      <BottomNav current={screen === 'session' ? 'home' : screen} onChange={setScreen} />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
