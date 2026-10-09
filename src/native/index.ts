/**
 * Native bridge — one API over the shells the app runs in.
 *
 *              this device meditating            another device meditating
 *   android    Do Not Disturb (alarms only),     DND + media muted
 *              screen kept on
 *   mac        notification sounds muted,        system audio muted
 *              Focus via Shortcuts (optional),
 *              display kept awake
 *   windows    display kept awake                system audio muted
 *   linux      display kept awake                system audio muted (PulseAudio/PipeWire)
 *   web        Wake Lock only                    app sounds only (browsers can't do more)
 *
 * Every call reports what it actually did, so the UI never claims silence it
 * didn't achieve.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { invoke } from '@tauri-apps/api/core';

interface FocusModePlugin {
  getStatus(): Promise<{ policyAccess: boolean }>;
  requestPolicyAccess(): Promise<void>;
  enable(options: { muteMedia: boolean }): Promise<{ dnd: boolean; muted: boolean }>;
  disable(): Promise<void>;
  keepAwake(options: { on: boolean }): Promise<void>;
}

const FocusMode = registerPlugin<FocusModePlugin>('FocusMode');

export type Platform = 'android' | 'ios' | 'desktop' | 'web';
export type DesktopOS = 'macos' | 'windows' | 'linux';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const platform: Platform = isTauri
  ? 'desktop'
  : Capacitor.isNativePlatform()
    ? (Capacitor.getPlatform() as 'android' | 'ios')
    : 'web';

export const isNative = platform !== 'web';

export type FocusRole = 'self' | 'listener';

export interface DesktopInfo {
  os: DesktopOS;
  version: string;
  focusShortcuts: boolean; // "Meditation Focus On/Off" Shortcuts exist (macOS)
}

export interface FocusCapabilities {
  /** System Do Not Disturb while this device meditates */
  systemDnd: 'granted' | 'needs-permission' | 'needs-shortcut' | 'unsupported';
  /** Can mute the whole device while another device meditates */
  systemMute: boolean;
  /** Can mute notification/alert sounds while keeping the bells (macOS) */
  alertMute: boolean;
}

export interface FocusReport {
  dnd: boolean;
  muted: boolean;
  alertsMuted: boolean;
  awake: boolean;
}

let desktopInfo: Promise<DesktopInfo> | null = null;
export const getDesktopInfo = (refresh = false): Promise<DesktopInfo> | null => {
  if (platform !== 'desktop') return null;
  if (refresh) desktopInfo = null;
  desktopInfo ??= invoke<DesktopInfo>('desktop_info');
  return desktopInfo;
};

const desktop = {
  keepAwake: (on: boolean) => invoke<boolean>('keep_awake', { on }).catch(() => false),
  setSystemMuted: (muted: boolean) => invoke<boolean>('set_system_muted', { muted }).catch(() => false),
  setAlertsMuted: (muted: boolean) => invoke<boolean>('set_alerts_muted', { muted }).catch(() => false),
  setFocusShortcut: (on: boolean) => invoke<boolean>('set_focus_shortcut', { on }).catch(() => false),
};

const NONE: FocusReport = { dnd: false, muted: false, alertsMuted: false, awake: false };

export const native = {
  async capabilities(): Promise<FocusCapabilities> {
    if (platform === 'android') {
      try {
        const { policyAccess } = await FocusMode.getStatus();
        return { systemDnd: policyAccess ? 'granted' : 'needs-permission', systemMute: true, alertMute: false };
      } catch {
        return { systemDnd: 'unsupported', systemMute: false, alertMute: false };
      }
    }
    if (platform === 'desktop') {
      const info = await getDesktopInfo()!.catch(() => null);
      if (!info) return { systemDnd: 'unsupported', systemMute: false, alertMute: false };
      const mac = info.os === 'macos';
      return {
        systemDnd: mac ? (info.focusShortcuts ? 'granted' : 'needs-shortcut') : 'unsupported',
        systemMute: true,
        alertMute: mac,
      };
    }
    return { systemDnd: 'unsupported', systemMute: false, alertMute: false };
  },

  async requestDndPermission() {
    if (platform === 'android') await FocusMode.requestPolicyAccess().catch(() => {});
  },

  /**
   * Enter system-level focus.
   *  - role 'self': this device is meditating → silence interruptions, keep the bells.
   *  - role 'listener': another device is meditating → silence everything.
   */
  async enterFocus(role: FocusRole, useSystemDnd: boolean): Promise<FocusReport> {
    try {
      if (platform === 'android') {
        const r = useSystemDnd || role === 'listener'
          ? await FocusMode.enable({ muteMedia: role === 'listener' })
          : { dnd: false, muted: false };
        if (role === 'self') await FocusMode.keepAwake({ on: true });
        return { dnd: r.dnd, muted: r.muted, alertsMuted: r.dnd, awake: role === 'self' };
      }
      if (platform === 'desktop') {
        if (role === 'self') {
          const [awake, alertsMuted, dnd] = await Promise.all([
            desktop.keepAwake(true),
            desktop.setAlertsMuted(true),
            useSystemDnd ? desktop.setFocusShortcut(true) : Promise.resolve(false),
          ]);
          return { dnd, muted: false, alertsMuted, awake };
        }
        const [muted, dnd] = await Promise.all([
          desktop.setSystemMuted(true),
          useSystemDnd ? desktop.setFocusShortcut(true) : Promise.resolve(false),
        ]);
        return { dnd, muted, alertsMuted: muted, awake: false };
      }
    } catch { /* never let native failures break a session */ }
    return NONE;
  },

  async exitFocus(role: FocusRole, useSystemDnd: boolean) {
    try {
      if (platform === 'android') {
        await FocusMode.disable();
        await FocusMode.keepAwake({ on: false });
      } else if (platform === 'desktop') {
        if (role === 'self') {
          await Promise.all([desktop.keepAwake(false), desktop.setAlertsMuted(false)]);
        } else {
          await desktop.setSystemMuted(false);
        }
        if (useSystemDnd) await desktop.setFocusShortcut(false);
      }
    } catch { /* ignore */ }
  },
};

/** Desktop only: start with the computer (quietly, in the tray). */
export const autostart = {
  get: () => (platform === 'desktop' ? invoke<boolean>('get_autostart').catch(() => false) : Promise.resolve(false)),
  set: (on: boolean) => (platform === 'desktop' ? invoke<boolean>('set_autostart', { on }).catch(() => false) : Promise.resolve(false)),
};
