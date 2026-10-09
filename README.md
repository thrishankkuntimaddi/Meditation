# Meditation

A calm, distraction-free meditation and breathing app — on the web, Android and desktop — that keeps your practice in sync across devices and **silences every other device while you meditate**.

**Web app:** https://thrishankkuntimaddi.github.io/Meditation/
**Android & desktop downloads:** [Releases](https://github.com/thrishankkuntimaddi/Meditation/releases/latest)

---

## Features

**Practice**
- **Meditate** with presets made of phases — *breathing* (guided box or triangle breath), *interval* (silent sitting with a bell every N seconds) and *silent*.
- **Breathe** with five built-in exercises: Box (4·4·4·4), Relaxing 4-7-8, Coherent (5·5), Calming (4·6) and Energizing (6·2·3), for 1–10 minutes.
- Breathing orb with an eased in/out rhythm, a countdown for each step, and a session progress ring.
- Bells synthesized on-device (Crystal, Bowl, Chime): one bell to start, two at each phase change, four at the end, plus optional soft breath cues and haptics.
- **Focus mode** keeps the screen awake. **Hold to end** means an accidental tap can't stop a session. **Eyes-closed mode** dims the screen to near-black.

**Journey**
- Streak, weekly and all-time minutes, a 7-day chart, and history grouped by day (including which device you used).
- A session counts once you complete it, or end it after at least 75% of the planned time.

**Sync & focus across devices** (sign in with email)
- Presets, history and settings sync through Firestore and work offline: changes queue up and sync when you're back online.
- **One device meditates, every device goes quiet.** When you start a session, every other device and window with the app open:
  - shows a calm "Meditating on *Pixel 8* · 07:21 remaining" screen,
  - silences all of the app's sounds,
  - on **Android**, turns on Do Not Disturb (alarms only) and mutes media,
  - on **Mac**, mutes system audio.

  Everything is restored automatically when the session ends, even if the meditating device goes offline, because each session carries its end time.
- The meditating device itself turns on Do Not Disturb (Android) or runs your `Meditation Focus On` / `Meditation Focus Off` Shortcuts (macOS).

**Design**
- Warm stone palette, light Inter type, one consistent SVG icon set, and automatic light/dark themes.

## What each platform can do

| | Web (PWA) | Android app | Desktop app (macOS / Windows / Linux) |
|---|---|---|---|
| Sessions, breathing, sync | ✅ | ✅ | ✅ |
| Screen stays awake | ✅ (Wake Lock) | ✅ | ✅ |
| Silenced while another device meditates | App sounds | App sounds + DND + media mute | App sounds + system mute (macOS) |
| System Do Not Disturb while meditating | ❌ (browsers can't) | ✅ (grant access once) | macOS via Shortcuts |

**iPhone/iPad:** install the PWA (Safari → Share → *Add to Home Screen*). iOS doesn't let apps change Focus or Silent mode, so the app reminds you to switch it on.

## Install

- **Android:** download `Meditation-android.apk` from Releases and open it (allow "install unknown apps" when asked). On first launch, go to Profile → *System Do Not Disturb* → **Allow**.
- **macOS:** download the `.dmg` and drag Meditation to Applications. The build isn't notarized, so the first time, right-click the app → **Open**.
- **Windows:** run the `.exe` installer.
- **Web:** open the link above and choose *Install app* (Chrome or Edge) or *Add to Home Screen*.

## Development

```bash
npm install
npm run dev            # http://localhost:5173/Meditation/
npm run lint
npm run build          # PWA → dist/
```

### Native builds

```bash
npm run desktop        # run the desktop app locally
npm run desktop:mac    # → release/*.dmg   (also desktop:win, desktop:linux)
npm run android:sync   # build the web bundle and copy it into android/
npm run android:open   # open in Android Studio (needs the Android SDK + JDK 21)
npm run android:apk    # build a debug APK locally
```

Every push to `main` deploys the web app to GitHub Pages automatically (**Deploy web app** workflow). You don't need the Android SDK locally. **GitHub Actions → "Build apps"** builds the APK and the macOS, Windows and Linux installers in the cloud. Run it manually from the Actions tab, or push a tag such as `v2.0.0` to publish a Release.

### Firestore rules (required for sync)

All app data lives under `meditation_users/{uid}/…`. The `nistha-passi-core` Firebase project is shared with other apps, so **merge** the blocks from [`firebase/meditation.rules`](firebase/meditation.rules) into the project's existing rules in the Firebase console. Don't deploy that file on its own. If the rules are missing, Profile shows "Sync problem — Cloud access denied", and everything keeps working locally.

## Architecture

```
src/
  engines/     TimerEngine (wall-clock, background-safe) · PhaseManager (pure snapshot of any moment) · SoundEngine (Web Audio)
  lib/         store (local-first, useSyncExternalStore) · sync (Firestore mirror) · focusSync (cross-device focus lock)
  native/      one API over Web / Capacitor (Android) / Electron (desktop)
  screens/     Home · Presets · Session · Journey · Profile
  components/  ui/ (Button, Card, Segmented, Toggle, Stepper, Dialog, HoldButton, Icon) + app components
electron/      desktop shell: app:// scheme, keep-awake, macOS mute & Shortcuts
android/       Capacitor project + FocusModePlugin.java (Do Not Disturb, media mute, keep-awake)
```

- **Timing:** session position is computed from absolute elapsed wall-clock time, never by accumulating ticks. A throttled background tab or a locked phone always resumes at the exact right point, and each bell fires once.
- **Sync:** last write wins for presets (with tombstones so deletions sync), sessions deduplicated by id, and a one-time import of history from v1's `sessions` collection.
- **Focus lock:** BroadcastChannel covers windows on the same device; a Firestore doc (`meta/focus`, with `endsAt` and a heartbeat) covers other devices.

Built with React 19, TypeScript, Vite, Tailwind CSS, Firebase, Capacitor 8 and Electron.
