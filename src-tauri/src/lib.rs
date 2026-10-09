//! Meditation — desktop shell (Tauri).
//!
//! Runs the same web app as the website, using the system's own web view
//! (so the download is a few MB instead of 100+). Adds what browsers can't do:
//! keep the display awake, silence the computer, deliver reminders, and stay
//! ready in the menu bar / system tray after the window is closed.

mod awake;
mod focus;
mod reminders;

use focus::SharedFocus;
use reminders::{Reminder, SharedReminders};
use serde::Serialize;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, RunEvent, State, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopInfo {
    os: &'static str,
    version: String,
    focus_shortcuts: bool,
}

#[tauri::command]
fn desktop_info(app: AppHandle) -> DesktopInfo {
    DesktopInfo {
        os: if cfg!(target_os = "macos") { "macos" } else if cfg!(windows) { "windows" } else { "linux" },
        version: app.package_info().version.to_string(),
        focus_shortcuts: focus::focus_shortcuts_available(),
    }
}

#[tauri::command]
async fn keep_awake(state: State<'_, SharedFocus>, on: bool) -> Result<bool, ()> {
    Ok(focus::keep_awake(&state, on))
}

// Shelling out to osascript / PowerShell takes a moment: run off the main thread
#[tauri::command]
async fn set_system_muted(state: State<'_, SharedFocus>, muted: bool) -> Result<bool, ()> {
    Ok(focus::mute_system(&state, muted))
}

#[tauri::command]
async fn set_alerts_muted(state: State<'_, SharedFocus>, muted: bool) -> Result<bool, ()> {
    Ok(focus::mute_alerts(&state, muted))
}

#[tauri::command]
async fn set_focus_shortcut(on: bool) -> Result<bool, ()> {
    Ok(focus::run_focus_shortcut(on))
}

#[tauri::command]
fn set_reminders(list: State<'_, SharedReminders>, items: Vec<Reminder>) {
    *list.lock().unwrap() = items;
}

#[tauri::command]
fn show_notification(app: AppHandle, title: String, body: String) {
    reminders::notify(&app, &title, &body);
}

#[tauri::command]
fn get_autostart(app: AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
fn set_autostart(app: AppHandle, on: bool) -> bool {
    let manager = app.autolaunch();
    let result = if on { manager.enable() } else { manager.disable() };
    result.is_ok()
}

/// Debug self-test: the page reports what every bridge call returned.
#[tauri::command]
fn selftest_report(app: AppHandle, report: String) {
    println!("SELFTEST {report}");
    if std::env::var("MEDITATION_SELFTEST").is_ok() {
        app.exit(0);
    }
}

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

pub fn run() {
    let reminders_list: SharedReminders = Default::default();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--hidden"])))
        .manage(SharedFocus::default())
        .manage(reminders_list.clone())
        .invoke_handler(tauri::generate_handler![
            desktop_info,
            keep_awake,
            set_system_muted,
            set_alerts_muted,
            set_focus_shortcut,
            set_reminders,
            show_notification,
            get_autostart,
            set_autostart,
            selftest_report
        ])
        .setup(move |app| {
            // Menu bar / system tray: the app keeps listening after the window closes
            let open = MenuItem::with_id(app, "open", "Open Meditation", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Meditation")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, e| match e.id.as_ref() {
                    "open" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, e| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = e {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            // Launched at login → start quietly in the tray
            if std::env::args().any(|a| a == "--hidden") {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.hide();
                }
            }

            reminders::start(app.handle().clone(), reminders_list.clone());

            #[cfg(debug_assertions)]
            if std::env::var("MEDITATION_SELFTEST").is_ok() {
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(5));
                    if let Some(w) = handle.get_webview_window("main") {
                        let _ = w.eval(include_str!("selftest.js"));
                    }
                });
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the window hides it; the app stays ready in the tray
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building Meditation");

    app.run(|app, event| match event {
        #[cfg(target_os = "macos")]
        RunEvent::Reopen { .. } => show_main(app),
        RunEvent::Exit => focus::restore_all(&app.state::<SharedFocus>()),
        _ => {}
    });
}
