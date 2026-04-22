# 🧘 Nistha — Meditation

> *A calm, distraction-free meditation timer with synthesized bell sounds, breathing guidance, and phase-based sessions.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-1C1917?style=for-the-badge&logo=github)](https://thrishankkuntimaddi.github.io/Meditation/)
[![PWA](https://img.shields.io/badge/PWA-Installable-4A90D9?style=for-the-badge&logo=pwa)](https://thrishankkuntimaddi.github.io/Meditation/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 📌 Description

**Nistha** (Sanskrit: *निष्ठा* — devotion, steadfastness) is a minimal, elegant Progressive Web App built for serious meditators who want a distraction-free timer that just works.

Modern meditation apps are bloated with subscriptions, guided audio tracks, and social features that undermine the very stillness they promise. Nistha strips everything back to the fundamentals:

- A **precise, drift-free timer** built on `performance.now()` + `requestAnimationFrame` — no background thread drift, no inaccurate `setInterval` counting.
- **Synthesized bell sounds** generated entirely on-device via the Web Audio API — no audio files to load, no network dependency.
- **Configurable breathing phases** with visual guidance and animated cues for inhale, hold, and exhale cycles.
- **Offline-first design** — works completely without an internet connection once installed.
- **Optional cloud sync** via Firebase for cross-device session history.

---

## 🚀 Live Demo

**Deployed on GitHub Pages:**
🔗 [https://thrishankkuntimaddi.github.io/Meditation/](https://thrishankkuntimaddi.github.io/Meditation/)

The app is installable as a **Progressive Web App (PWA)**. On mobile, tap the browser's "Add to Home Screen" prompt to install it natively. On desktop, click the install icon in the browser address bar.

---

## 🔐 Login / Demo Credentials

Authentication is **optional**. The app is fully functional without an account:

- Sessions are automatically saved to **local storage** on your device.
- Streaks and history are tracked locally with no login required.

To **sync sessions across devices**, create a free account via the Profile tab:
- Tap **Profile** → **Create account** with any email and password.
- Once signed in, session history is fetched from Firebase Firestore and merged with local data.

> There are no demo credentials — simply create a new account for free.

---

## 🧩 Features

### Core Timer
- ⏱️ **Drift-free timing** using `performance.now()` and `requestAnimationFrame` — immune to browser throttling.
- ▶️ **3-second countdown** overlay before each session begins.
- ⏸️ **Pause / Resume** support with accurate elapsed-time tracking across pauses.
- 🖥️ **Screen Wake Lock** — prevents the device screen from sleeping during an active session.

### Breathing Guidance
- 🌬️ **Animated breathing circle** that expands and contracts in sync with inhale/exhale cycles.
- 🔲 **Square breathing** (4-4-4-4: inhale, hold, exhale, hold after exhale) — a structured, symmetrical pattern for focus.
- 🔺 **Triangle / 4-7-8 breathing** (inhale, hold, exhale) — a calming pattern for evening and sleep.
- Configurable step durations per phase, per preset.

### Synthesized Bell Sounds
- 🔔 **Crystal bell** (880 Hz fundamental) — bright, clear ring for morning sessions.
- 🎵 **Singing bowl** (220 Hz fundamental) — deep, resonant tone for evening and night sessions.
- 🎐 **Chime** (660 Hz fundamental) — airy, lighter bell for shorter sessions.
- **Single bell** — rings on each breath step transition.
- **Double bell** — rings at the end of each phase.
- **Quad bell** — rings on full session completion.
- 📳 **Haptic feedback** — vibration patterns accompany every bell sound on supported devices.
- 🔇 No audio files required — all sounds are procedurally synthesized using oscillators and gain envelopes via the Web Audio API.

### Session Presets
- 🌅 **Morning** (10 min) — Square breathing (3 min) → Interval stillness with 60s bells (7 min). Crystal bell.
- 🌇 **Evening** (15 min) — 4-7-8 breathing (5 min) → Interval (5 min) → Silent (5 min). Singing bowl.
- 🌙 **Night** (10 min) — Deep 4-7-8 breathing only (10 min). Singing bowl.
- ✦ **Custom** — Blank canvas to create your own preset from scratch.

### Preset Editor
- ✏️ Create, rename, and delete presets.
- ➕ Add, reorder (move up/down), and delete individual phases within a preset.
- 🎚️ Per-phase configuration: type (breathing / interval / silent), duration, breathing pattern, and interval bell timing.
- 🔔 Bell sound selection per preset with a live preview tap.

### History & Analytics
- 📅 Session log with preset name, date, duration, and completion status.
- 📊 **7-day bar chart** showing minutes meditated per day.
- 🔥 **Day streak** tracking — consecutive days with at least one session.
- Sessions are marked as completed only if the full preset duration was reached.

### Profile & Sync
- 🔐 Firebase Email/Password authentication (sign up and sign in).
- ☁️ Cloud session sync via Firestore — sessions stored under the authenticated user's UID.
- 🔔 Bell sound preview from the Profile screen.
- 🔄 **PWA update banner** — notifies users when a new app version is available and allows one-tap update.
- 📴 Full functionality without an account (local-only mode).

### PWA / Installable App
- 📲 Installable to home screen on iOS, Android, and desktop browsers.
- 🌐 **Offline-first** with Workbox service worker caching all static assets, JS, CSS, and fonts.
- 🔔 Prompt-based service worker update flow — new versions are offered, not forced.
- Portrait orientation lock for consistent mobile experience.

### Eyes Closed Mode
- 🙈 Tap "Eyes closed mode" during a session to reduce the screen to near-invisible opacity (4%) — so you can keep your eyes closed without the light being a distraction, while still being able to tap controls if needed.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript 6 |
| **Build Tool** | Vite 8 |
| **Styling** | TailwindCSS 3 (utility classes) + inline styles |
| **PWA** | `vite-plugin-pwa` + Workbox service worker |
| **Authentication** | Firebase Authentication (Email/Password) |
| **Database** | Firebase Firestore (cloud session history) |
| **Local Storage** | Browser `localStorage` (offline sessions, streaks, presets) |
| **Audio** | Web Audio API — synthesized oscillators, no audio files |
| **Timer Precision** | `performance.now()` + `requestAnimationFrame` |
| **Deployment** | GitHub Pages via `gh-pages` |
| **Language** | TypeScript (strict mode) |
| **Linting** | ESLint 9 + `eslint-plugin-react-hooks` |

---

## 📂 Project Structure

```
Meditation/
├── public/
│   ├── manifest.json          # PWA manifest (name, icons, theme)
│   ├── favicon.svg            # App favicon
│   └── icons/                 # PWA icons (192×192, 512×512)
│
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Root component — screen routing, session lifecycle
│   ├── App.css                # Global animations (fade-in, etc.)
│   ├── index.css              # Tailwind base + CSS resets
│   │
│   ├── engines/               # ⚙️ Core logic engines (pure TypeScript classes)
│   │   ├── TimerEngine.ts     # Drift-free timer using performance.now() + rAF
│   │   ├── SoundEngine.ts     # Web Audio API bell synthesizer (crystal/bowl/chime)
│   │   └── PhaseManager.ts    # Phase sequencing, breath step cycling, interval bells
│   │
│   ├── hooks/                 # React custom hooks
│   │   ├── useSession.ts      # Coordinates TimerEngine + PhaseManager + SoundEngine
│   │   ├── usePresets.ts      # CRUD for presets stored in localStorage
│   │   └── usePWAUpdate.ts    # Detects and triggers PWA service worker updates
│   │
│   ├── screens/               # Full-page view components
│   │   ├── HomeScreen.tsx     # Preset selector, stats, start button
│   │   ├── SessionScreen.tsx  # Active session UI — circle, timer, controls
│   │   ├── EditorScreen.tsx   # Preset builder — phases, bell, duration
│   │   ├── HistoryScreen.tsx  # Session log, 7-day chart, streak
│   │   └── ProfileScreen.tsx  # Auth (sign in/up), bell preview, PWA update
│   │
│   ├── components/            # Reusable UI components
│   │   ├── BreathingCircle.tsx  # Animated SVG/CSS circle for breath cues
│   │   ├── PhaseCard.tsx        # Single phase editor card (type, duration, breathing)
│   │   ├── BellPicker.tsx       # Bell sound selector with preview
│   │   ├── BottomNav.tsx        # 4-tab bottom navigation bar
│   │   ├── CountdownOverlay.tsx # 3-2-1 countdown before session starts
│   │   └── UpdateBanner.tsx     # Floating PWA update notification banner
│   │
│   ├── firebase/              # Firebase integrations
│   │   ├── config.ts          # Firebase app initialization
│   │   ├── auth.ts            # signIn, signUp, signOut helpers
│   │   └── sessions.ts        # Firestore: saveSession, fetchSessions
│   │
│   ├── context/
│   │   └── AuthContext.tsx    # React context wrapping Firebase auth state
│   │
│   ├── utils/
│   │   ├── defaultPresets.ts  # Built-in preset definitions (Morning/Evening/Night/Custom)
│   │   ├── localStorage.ts    # Session persistence, streak calculation
│   │   └── formatTime.ts      # Time formatting helpers (MM:SS, dates)
│   │
│   └── types/
│       └── index.ts           # Shared TypeScript types (Preset, Phase, Session, etc.)
│
├── vite.config.ts             # Vite + PWA plugin configuration
├── tailwind.config.js         # Tailwind theme customization
├── tsconfig.app.json          # TypeScript compiler config for source
└── package.json               # Dependencies and npm scripts
```

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Firebase project** (free Spark plan is sufficient)

### 1. Clone the Repository

```bash
git clone https://github.com/thrishankkuntimaddi/Meditation.git
cd Meditation
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note:** Firebase credentials are only required for cloud sync and authentication. The app runs fully offline without them (local storage mode).

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy to GitHub Pages

```bash
npm run deploy
```

This runs the `predeploy` build step and pushes the `dist/` folder to the `gh-pages` branch.

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app identifier |

All variables are prefixed with `VITE_` so Vite exposes them to the client bundle. Never commit a `.env` file with real credentials to a public repository.

---

## 📸 UI Flow

```
┌──────────────────────────────────────────────────┐
│  Home Screen                                     │
│  ┌────────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Sessions   │ │ Minutes  │ │ Day Streak 🔥│   │
│  └────────────┘ └──────────┘ └──────────────┘   │
│                                                  │
│  ● Morning         10 min · 2 phases       ✓     │
│  ○ Evening         15 min · 3 phases             │
│  ○ Night           10 min · 1 phase              │
│  ○ Custom           5 min · 1 phase              │
│                                                  │
│  + Create or edit preset                         │
│  ┌──────────────────────────────────────────┐    │
│  │                 BEGIN                    │    │
│  └──────────────────────────────────────────┘    │
│  [Home]  [Editor]  [History]  [Profile]          │
└──────────────────────────────────────────────────┘
              │
              ▼ BEGIN pressed
┌──────────────────────────────────────────────────┐
│  Session Screen (full-screen, no nav bar)        │
│                                                  │
│              Morning                             │
│              Breathing                           │
│              Phase 1 of 2                        │
│                                                  │
│         ╭────────────────╮                       │
│         │   ◯  INHALE    │  ← Animated Circle   │
│         ╰────────────────╯                       │
│                                                  │
│               07:23                              │
│             remaining                            │
│                                                  │
│         Eyes closed mode                         │
│  ┌─────────────┐  ┌──────┐                       │
│  │    Pause    │  │  End │                       │
│  └─────────────┘  └──────┘                       │
└──────────────────────────────────────────────────┘
```

---

## 🧠 How It Works

### Drift-Free Timer (`TimerEngine`)

The timer does **not** use `setInterval` or `Date.now()` — both are known to drift under background throttling or CPU load. Instead:

1. `performance.now()` is captured at `start()` as the reference epoch.
2. `requestAnimationFrame` fires a `tick()` callback approximately every 16ms (60fps).
3. `getElapsedMs()` computes `performance.now() - startTime - totalPausedMs` — a simple subtraction that is always accurate.
4. On `pause()`, the current `performance.now()` is captured. On `resume()`, the pause duration is added to `totalPaused`.

Result: elapsed time is always exact, regardless of how long the tab was backgrounded.

### Phase Management (`PhaseManager`)

A `PhaseManager` instance is created with the preset's phase array. Each animation frame, `tick(deltaSec)` is called with the delta since the previous frame. The manager:

- Accumulates time into `phaseElapsed`.
- For **breathing phases**: cycles through inhale → hold → exhale → holdAfterExhale steps, playing a single bell on each step boundary.
- For **interval phases**: plays a single bell every `intervalSeconds`.
- Transitions to the next phase (playing a double bell) when `phaseElapsed >= phase.duration`.
- Emits a `PhaseManagerState` object on every tick for the UI to consume.

### Sound Synthesis (`SoundEngine`)

Each bell type is defined by a `BellConfig` with a fundamental frequency and an array of partials (harmonic overtones). On each bell strike:

1. A `masterGain` node is created.
2. For each partial, an `OscillatorNode` (sine wave) is created at `fundamental × partialFreqMultiplier`.
3. A `GainNode` models the envelope: a sharp linear attack (5ms) followed by an exponential decay to near-zero.
4. All oscillators connect to `masterGain`, which connects to `AudioContext.destination`.

This produces a physically plausible bell timbre from pure mathematics — no audio files, no network requests.

### Data Flow

```
User taps BEGIN
      │
      ▼
useSession.start(preset)
      │
      ├─ SoundEngine.unlock()          ← required user gesture to init AudioContext
      ├─ 3-second countdown (setTimeout)
      │
      ▼
beginSession()
      │
      ├─ PhaseManager(preset.phases, onUpdate → setPhaseState)
      ├─ TimerEngine(totalDuration)
      │     │
      │     └─ onTick → compute delta → PhaseManager.tick(delta)
      │     └─ onComplete → SoundEngine.playQuadBell() → setStatus('complete')
      │
      ▼
Session ends (user taps End OR timer completes)
      │
      ├─ updateStreak()                ← updates localStorage streak
      └─ saveSession()                 ← saves to Firestore (if logged in)
                                         AND localStorage (always)
```

### Offline-First Architecture

Workbox (via `vite-plugin-pwa`) pre-caches all static assets at install time. On subsequent loads:
- The service worker intercepts all navigation requests and serves from cache.
- Google Fonts are cached with a `CacheFirst` strategy (365-day expiration).
- Firebase Firestore uses its own IndexedDB-based offline persistence (enabled by default in the Firebase SDK).

---

## 🚧 Challenges & Solutions

| Challenge | Solution |
|---|---|
| **Timer drift** under background throttling | Replaced `setInterval` with `performance.now()` subtraction inside `requestAnimationFrame` |
| **Audio context suspended** on iOS/Android (browser policy requires user gesture) | `SoundEngine.unlock()` is called synchronously from the "BEGIN" button tap handler, prior to any async operations |
| **Haptic + audio synchronization** | `navigator.vibrate()` is called immediately after `AudioContext` scheduling to keep tactile and sonic feedback in sync |
| **PWA update UX** | Service worker registered with `registerType: 'prompt'` — new versions are detected silently, then offered via a dismissible banner or profile button, not forced |
| **Cross-device session sync** | Sessions are always written to `localStorage` first (instant, offline-safe), then mirrored to Firestore when the user is authenticated |
| **Phase/breath animation accuracy** | `PhaseManagerState` exposes `breathStepElapsedSec` and the current step's `duration`, allowing the `BreathingCircle` to compute precise animation progress independent of React render timing |

---

## 🔮 Future Improvements

- [ ] **Background audio** — ambient soundscapes (white noise, rain) using Web Audio API oscillator networks.
- [ ] **Binaural beats** — synthesized stereo tones in the alpha/theta range for deeper focus.
- [ ] **Apple Watch / WearOS integration** — vibration-only guided breathing for wrist devices.
- [ ] **Statistics dashboard** — weekly/monthly trends, average session length, most-used presets.
- [ ] **Preset sharing** — export a preset as a URL hash or QR code for community sharing.
- [ ] **Google / Apple Sign-In** — social auth for faster onboarding.
- [ ] **Guided session mode** — optional text prompts at the start of each phase.
- [ ] **Session notes** — a simple post-session reflection text field, synced to Firestore.
- [ ] **Streak recovery grace period** — allow one missed day per week without breaking a streak.
- [ ] **Accessibility** — VoiceOver/TalkBack support for the breathing circle and session controls.

---

## 🤝 Contributing

Contributions are welcome. Please follow these steps:

1. **Fork** this repository.
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes** with a clear, descriptive message:
   ```bash
   git commit -m "feat: add binaural beat support to SoundEngine"
   ```
4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against the `main` branch with a description of what was changed and why.

### Code Style

- Use **TypeScript** with strict type annotations.
- Keep **engines** (`TimerEngine`, `SoundEngine`, `PhaseManager`) as pure TypeScript classes with no React imports — they must remain framework-agnostic.
- Keep **hooks** as thin orchestration layers that connect engines to React state.
- Use **functional components** with hooks only — no class components.
- Run `npm run lint` before submitting a PR.

---

## 📜 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Thrisha Kuntimaddi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">
  <p>Built with intention. 🧘</p>
  <p><a href="https://thrishankkuntimaddi.github.io/Meditation/">thrishankkuntimaddi.github.io/Meditation</a></p>
</div>
