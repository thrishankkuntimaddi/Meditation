//! Keep the display awake during a session, using each OS's standard tool.
//! Dropping the value releases it.

#[cfg(not(windows))]
use std::process::{Child, Command};

pub struct KeepAwake {
    #[cfg(not(windows))]
    child: Child,
    #[cfg(windows)]
    stop: std::sync::mpsc::Sender<()>,
}

impl KeepAwake {
    pub fn start() -> Option<Self> {
        #[cfg(target_os = "macos")]
        {
            // -d display, -i idle sleep; -w ties it to our process so it can never outlive us
            let pid = std::process::id().to_string();
            let child = Command::new("caffeinate").args(["-d", "-i", "-w", &pid]).spawn().ok()?;
            Some(Self { child })
        }
        #[cfg(target_os = "linux")]
        {
            let child = Command::new("systemd-inhibit")
                .args(["--what=idle:sleep", "--who=Meditation", "--why=Meditation session", "sleep", "infinity"])
                .spawn()
                .ok()?;
            Some(Self { child })
        }
        #[cfg(windows)]
        {
            // The request belongs to the calling thread, so hold it on a thread of our own
            #[link(name = "kernel32")]
            extern "system" {
                fn SetThreadExecutionState(flags: u32) -> u32;
            }
            const ES_CONTINUOUS: u32 = 0x8000_0000;
            const ES_SYSTEM_REQUIRED: u32 = 0x0000_0001;
            const ES_DISPLAY_REQUIRED: u32 = 0x0000_0002;
            let (tx, rx) = std::sync::mpsc::channel::<()>();
            std::thread::spawn(move || unsafe {
                SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED);
                let _ = rx.recv();
                SetThreadExecutionState(ES_CONTINUOUS);
            });
            Some(Self { stop: tx })
        }
    }
}

impl Drop for KeepAwake {
    fn drop(&mut self) {
        #[cfg(not(windows))]
        {
            let _ = self.child.kill();
            let _ = self.child.wait();
        }
        #[cfg(windows)]
        {
            let _ = self.stop.send(());
        }
    }
}
