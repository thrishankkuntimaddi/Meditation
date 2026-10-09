//! A tiny reminder scheduler. The web app plans the notifications (copy, days,
//! skip rules, quiet windows) and hands them over; this thread just delivers
//! them on time — even while the window is closed and the app lives in the
//! menu bar / system tray.

use serde::Deserialize;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Clone, Deserialize)]
pub struct Reminder {
    #[allow(dead_code)] // kept for debugging / future cancellation by id
    pub id: i64,
    pub at: i64, // epoch ms
    pub title: String,
    pub body: String,
}

pub type SharedReminders = Arc<Mutex<Vec<Reminder>>>;

/// Ignore reminders whose time passed long ago (e.g. the computer was asleep).
const STALE_MS: i64 = 15 * 60 * 1000;

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

pub fn notify(app: &AppHandle, title: &str, body: &str) {
    let _ = app.notification().builder().title(title).body(body).show();
}

pub fn start(app: AppHandle, list: SharedReminders) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(20));
        let now = now_ms();
        let due: Vec<Reminder> = {
            let mut items = list.lock().unwrap();
            let (due, later): (Vec<_>, Vec<_>) = items.drain(..).partition(|r| r.at <= now);
            *items = later;
            due
        };
        for r in due.into_iter().filter(|r| now - r.at < STALE_MS) {
            notify(&app, &r.title, &r.body);
        }
    });
}
