//! System-level silence for meditation sessions.
//!
//! * mute / unmute the whole computer (used while *another* device meditates)
//! * mute / restore macOS alert & notification sounds (used while *this* device
//!   meditates — the bells keep playing because output volume is untouched)
//! * run the user's "Meditation Focus On/Off" Shortcuts to toggle macOS Focus
//!
//! Everything restores only what this app changed, so we never fight the
//! user's own settings.

use std::process::{Command, Output};
use std::sync::Mutex;

#[derive(Default)]
pub struct FocusState {
    we_muted: bool,
    saved_alert_volume: Option<String>,
    keep_awake: Option<crate::awake::KeepAwake>,
}

pub type SharedFocus = Mutex<FocusState>;

fn run(cmd: &str, args: &[&str]) -> Option<Output> {
    let mut c = Command::new(cmd);
    c.args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        c.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    c.output().ok().filter(|o| o.status.success())
}

fn stdout(o: Output) -> String {
    String::from_utf8_lossy(&o.stdout).trim().to_string()
}

// ── macOS ────────────────────────────────────────────────────────────────────

#[cfg(target_os = "macos")]
fn osa(script: &str) -> Option<String> {
    run("osascript", &["-e", script]).map(stdout)
}

#[cfg(target_os = "macos")]
fn system_muted() -> Option<bool> {
    osa("output muted of (get volume settings)").map(|s| s == "true")
}

#[cfg(target_os = "macos")]
fn set_muted(m: bool) -> bool {
    osa(if m { "set volume with output muted" } else { "set volume without output muted" }).is_some()
}

// ── Windows (Core Audio via PowerShell) ──────────────────────────────────────

#[cfg(windows)]
const WIN_AUDIO: &str = r#"
Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
  int j();
  int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, System.Guid pguidEventContext);
  int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref System.Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev); }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int f(); int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint); }
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public class MeditationAudio {
  static IAudioEndpointVolume Vol() {
    var e = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice dev = null;
    Marshal.ThrowExceptionForHR(e.GetDefaultAudioEndpoint(0, 1, out dev));
    IAudioEndpointVolume v = null;
    var id = typeof(IAudioEndpointVolume).GUID;
    Marshal.ThrowExceptionForHR(dev.Activate(ref id, 23, 0, out v));
    return v;
  }
  public static bool Mute {
    get { bool m; Marshal.ThrowExceptionForHR(Vol().GetMute(out m)); return m; }
    set { Marshal.ThrowExceptionForHR(Vol().SetMute(value, System.Guid.Empty)); }
  }
}
'@
"#;

#[cfg(windows)]
fn ps(body: &str) -> Option<String> {
    let script = format!("{WIN_AUDIO}\n{body}");
    run("powershell", &["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &script]).map(stdout)
}

#[cfg(windows)]
fn system_muted() -> Option<bool> {
    ps("[MeditationAudio]::Mute").map(|s| s.eq_ignore_ascii_case("true"))
}

#[cfg(windows)]
fn set_muted(m: bool) -> bool {
    ps(&format!("[MeditationAudio]::Mute = ${}", if m { "true" } else { "false" })).is_some()
}

// ── Linux (PulseAudio / PipeWire) ────────────────────────────────────────────

#[cfg(target_os = "linux")]
fn system_muted() -> Option<bool> {
    run("pactl", &["get-sink-mute", "@DEFAULT_SINK@"]).map(|o| stdout(o).contains("yes"))
}

#[cfg(target_os = "linux")]
fn set_muted(m: bool) -> bool {
    run("pactl", &["set-sink-mute", "@DEFAULT_SINK@", if m { "1" } else { "0" }]).is_some()
}

// ── Public API ───────────────────────────────────────────────────────────────

pub fn mute_system(state: &SharedFocus, muted: bool) -> bool {
    let mut s = state.lock().unwrap();
    if muted {
        match system_muted() {
            Some(true) => true, // already muted by the user — leave it alone
            Some(false) => {
                let ok = set_muted(true);
                s.we_muted = ok;
                ok
            }
            None => false,
        }
    } else {
        if !s.we_muted {
            return true;
        }
        s.we_muted = false;
        set_muted(false)
    }
}

pub fn mute_alerts(state: &SharedFocus, muted: bool) -> bool {
    #[cfg(target_os = "macos")]
    {
        let mut s = state.lock().unwrap();
        if muted {
            if s.saved_alert_volume.is_none() {
                s.saved_alert_volume = osa("alert volume of (get volume settings)");
            }
            return osa("set volume alert volume 0").is_some();
        }
        if let Some(v) = s.saved_alert_volume.take() {
            return osa(&format!("set volume alert volume {v}")).is_some();
        }
        true
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (state, muted);
        false
    }
}

pub fn keep_awake(state: &SharedFocus, on: bool) -> bool {
    let mut s = state.lock().unwrap();
    if on {
        if s.keep_awake.is_none() {
            s.keep_awake = crate::awake::KeepAwake::start();
        }
        s.keep_awake.is_some()
    } else {
        s.keep_awake = None; // dropping releases the assertion
        true
    }
}

/// Names of the user's Shortcuts (macOS only).
pub fn focus_shortcuts_available() -> bool {
    #[cfg(target_os = "macos")]
    {
        run("shortcuts", &["list"])
            .map(stdout)
            .map(|list| {
                let names: Vec<&str> = list.lines().map(str::trim).collect();
                names.contains(&"Meditation Focus On") && names.contains(&"Meditation Focus Off")
            })
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "macos"))]
    {
        false
    }
}

pub fn run_focus_shortcut(on: bool) -> bool {
    #[cfg(target_os = "macos")]
    {
        let name = if on { "Meditation Focus On" } else { "Meditation Focus Off" };
        run("shortcuts", &["run", name]).is_some()
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = on;
        false
    }
}

/// Undo everything this app changed (called on quit).
pub fn restore_all(state: &SharedFocus) {
    mute_system(state, false);
    mute_alerts(state, false);
    keep_awake(state, false);
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Real system calls — run with `cargo test -- --ignored --test-threads=1`.
    /// Mutes this computer for a moment and restores it exactly.
    #[test]
    #[ignore]
    fn mute_and_restore_system() {
        let state = SharedFocus::default();
        let before = system_muted().expect("can read mute state");
        assert!(mute_system(&state, true));
        assert_eq!(system_muted(), Some(true));
        assert!(mute_system(&state, false));
        assert_eq!(system_muted(), Some(before), "restored to the user's own setting");
    }

    #[cfg(target_os = "macos")]
    #[test]
    #[ignore]
    fn mute_and_restore_alerts() {
        let state = SharedFocus::default();
        let before = osa("alert volume of (get volume settings)").unwrap();
        assert!(mute_alerts(&state, true));
        assert_eq!(osa("alert volume of (get volume settings)").as_deref(), Some("0"));
        assert!(mute_alerts(&state, false));
        assert_eq!(osa("alert volume of (get volume settings)"), Some(before));
    }

    #[test]
    #[ignore]
    fn keep_awake_holds_and_releases() {
        let state = SharedFocus::default();
        assert!(keep_awake(&state, true));
        #[cfg(target_os = "macos")]
        {
            let out = run("pmset", &["-g", "assertions"]).map(stdout).unwrap_or_default();
            assert!(out.contains("caffeinate"), "display assertion is active");
        }
        assert!(keep_awake(&state, false));
    }
}
