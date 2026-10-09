import React, { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import type { Screen, Preset } from './types';
import { AuthProvider } from './context/AuthContext';
import { useSession } from './hooks/useSession';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { useListenerFocus } from './hooks/useFocusMode';
import { useSettings } from './hooks/useStore';
import { soundEngine } from './engines/SoundEngine';
import { createPreset } from './lib/presets';
import { platform } from './native';

import BottomNav from './components/BottomNav';
import UpdateBanner from './components/UpdateBanner';
import RemoteFocusOverlay from './components/RemoteFocusOverlay';
import HomeScreen from './screens/HomeScreen';
import EditorScreen from './screens/EditorScreen';
import SessionScreen from './screens/SessionScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

const AppInner: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [editorTarget, setEditorTarget] = useState<string | null>(null);
  const { data: session, start, pause, resume, end, reset } = useSession();
  const { updateAvailable, updateApp } = usePWAUpdate();
  const remoteFocus = useListenerFocus();
  const settings = useSettings();
  const inSession = screen === 'session' && session.preset !== null;

  useEffect(() => { soundEngine.setVolume(settings.volume); }, [settings.volume]);

  const handleStart = useCallback((preset: Preset) => {
    setScreen('session');
    start(preset);
  }, [start]);

  const closeSession = useCallback(() => {
    reset();
    setScreen('home');
  }, [reset]);

  const goEditor = (presetId?: string) => {
    setEditorTarget(presetId === 'new' ? createPreset().id : presetId ?? null);
    setScreen('editor');
  };

  const navigate = (s: Screen) => {
    if (s === 'editor') setEditorTarget(null);
    setScreen(s);
  };

  // Android hardware back: step back to Home instead of closing the app, and
  // never leave a running session by accident.
  const stateRef = useRef({ screen, inSession });
  useEffect(() => { stateRef.current = { screen, inSession }; }, [screen, inSession]);
  useEffect(() => {
    if (platform !== 'android') return;
    const sub = CapApp.addListener('backButton', () => {
      const { screen: s, inSession: busy } = stateRef.current;
      if (busy) return;
      if (s !== 'home') setScreen('home');
      else CapApp.minimizeApp();
    });
    return () => { sub.then(h => h.remove()); };
  }, []);

  if (inSession) {
    return (
      <SessionScreen
        session={session}
        onPause={pause}
        onResume={resume}
        onEnd={end}
        onClose={closeSession}
      />
    );
  }

  return (
    <div className="relative min-h-full mx-auto max-w-[480px]">
      {updateAvailable && <UpdateBanner onUpdate={updateApp} />}

      <main key={screen} className="animate-fade-in min-h-full">
        {screen === 'home' && <HomeScreen onStartSession={handleStart} onGoEditor={goEditor} />}
        {screen === 'editor' && (
          <EditorScreen initialPresetId={editorTarget} onDone={() => setScreen('home')} onStart={handleStart} />
        )}
        {screen === 'history' && <HistoryScreen onGoProfile={() => setScreen('profile')} />}
        {screen === 'profile' && <ProfileScreen />}
      </main>

      <BottomNav current={screen} onChange={navigate} />

      {remoteFocus && <RemoteFocusOverlay focus={remoteFocus} />}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
