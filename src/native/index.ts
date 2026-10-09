/**
 * Native bridge — one API over the three shells the app runs in:
 *
 *   web       PWA in a browser: Screen Wake Lock only (browsers cannot mute the
 *             OS or toggle Do Not Disturb).
 *   android   Capacitor app: FocusMode plugin toggles system Do Not Disturb
 *             (alarms & media allowed, so bells still play), mutes other
 *             devices' media, and keeps the screen on.
 *   desktop   Electron app: blocks display sleep, mutes system audio on
 *             listening devices (macOS), and can run user Shortcuts to switch
 *             macOS Focus on/off.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

interface FocusModePlugin {
  getStatus(): Promise<{ policyAccess: boolean }>;
  requestPolicyAccess(): Promise<void>;
  enable(options: { muteMedia: boolean }): Promise<void>;
  disable(): Promise<void>;
  keepAwake(options: { on: boolean }): Promise<void>;
}

interface DesktopBridge {
  platform: string;
  keepAwake(on: boolean): Promise<void>;
  setSystemMuted(muted: boolean): Promise<boolean>;
  setFocusShortcut(on: boolean): Promise<boolean>;
  getVersion(): Promise<string>;
}

declare global {
  interface Window { meditationDesktop?: DesktopBridge }
}

const FocusMode = registerPlugin<FocusModePlugin>('FocusMode');

export type Platform = 'android' | 'ios' | 'desktop' | 'web';

export const platform: Platform = window.meditationDesktop
  ? 'desktop'
  : Capacitor.isNativePlatform()
    ? (Capacitor.getPlatform() as 'android' | 'ios')
    : 'web';

export const isNative = platform !== 'web';

export type FocusRole = 'self' | 'listener';

export interface FocusCapabilities {
  systemDnd: 'granted' | 'needs-permission' | 'unsupported';
  systemMute: boolean;
}

export const native = {
  async capabilities(): Promise<FocusCapabilities> {
    if (platform === 'android') {
      try {
        const { policyAccess } = await FocusMode.getStatus();
        return { systemDnd: policyAccess ? 'granted' : 'needs-permission', systemMute: true };
      } catch {
        return { systemDnd: 'unsupported', systemMute: false };
      }
    }
    if (platform === 'desktop') {
      const mac = window.meditationDesktop?.platform === 'darwin';
      return { systemDnd: mac ? 'granted' : 'unsupported', systemMute: mac };
    }
    return { systemDnd: 'unsupported', systemMute: false };
  },

  async requestDndPermission() {
    if (platform === 'android') await FocusMode.requestPolicyAccess().catch(() => {});
  },

  /**
   * Enter system-level focus.
   *  - role 'self': this device is meditating → DND on, sound stays on.
   *  - role 'listener': another device is meditating → DND on and mute audio.
   */
  async enterFocus(role: FocusRole, useSystemDnd: boolean) {
    try {
      if (platform === 'android') {
        if (useSystemDnd) await FocusMode.enable({ muteMedia: role === 'listener' });
        if (role === 'self') await FocusMode.keepAwake({ on: true });
      } else if (platform === 'desktop') {
        const d = window.meditationDesktop!;
        if (role === 'self') await d.keepAwake(true);
        if (role === 'listener') await d.setSystemMuted(true);
        if (useSystemDnd) await d.setFocusShortcut(true);
      }
    } catch { /* never let native failures break a session */ }
  },

  async exitFocus(role: FocusRole, useSystemDnd: boolean) {
    try {
      if (platform === 'android') {
        if (useSystemDnd) await FocusMode.disable();
        await FocusMode.keepAwake({ on: false });
      } else if (platform === 'desktop') {
        const d = window.meditationDesktop!;
        await d.keepAwake(false);
        if (role === 'listener') await d.setSystemMuted(false);
        if (useSystemDnd) await d.setFocusShortcut(false);
      }
    } catch { /* ignore */ }
  },
};
