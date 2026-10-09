/**
 * Applies the Light / Dark / System appearance setting to the page, the
 * browser chrome (theme-color) and, inside the Android app, the status bar.
 */
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { ThemeMode } from '../types';
import { store } from './store';

const LIGHT_BG = '#FAFAF9';
const DARK_BG = '#141211';

const media = window.matchMedia?.('(prefers-color-scheme: dark)');

export const isDark = (mode: ThemeMode) => mode === 'dark' || (mode === 'system' && !!media?.matches);

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  const dark = isDark(mode);
  const bg = dark ? DARK_BG : LIGHT_BG;

  // One theme-color tag that follows the chosen mode (drop the media-specific ones)
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = bg;
  document.head.appendChild(meta);

  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: bg }).catch(() => {});
  }
}

/** Apply now, then keep in step with the setting and the OS preference. */
export function initTheme() {
  let current = store.getState().settings.theme;
  applyTheme(current);
  store.subscribe(() => {
    const next = store.getState().settings.theme;
    if (next !== current) { current = next; applyTheme(next); }
  });
  media?.addEventListener?.('change', () => { if (current === 'system') applyTheme(current); });
}
