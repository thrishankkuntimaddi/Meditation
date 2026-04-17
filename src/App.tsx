import React, { useState } from 'react';
import type { Screen, Preset } from './types';
import { AuthProvider } from './context/AuthContext';
import { useSession } from './hooks/useSession';
import { saveSession } from './firebase/sessions';
import { updateStreak } from './utils/localStorage';
import { useAuth } from './context/AuthContext';

import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import EditorScreen from './screens/EditorScreen';
import SessionScreen from './screens/SessionScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

const AppInner: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const { user } = useAuth();
  const { sessionData, start, pause, resume, stop } = useSession();

  const handleStart = (preset: Preset) => {
    setActivePreset(preset);
    setScreen('session');
    start(preset);
  };

  const handleEndSession = async () => {
    const { elapsed, status } = sessionData;
    const completed = status === 'complete';
    if (elapsed > 10 && activePreset) {
      updateStreak();
      await saveSession({
        userId: user?.uid ?? 'anonymous',
        timestamp: Date.now(),
        duration: Math.round(elapsed),
        presetName: activePreset.name,
        completed,
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
