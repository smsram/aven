pub mod commands;

use commands::window::{app_close, app_is_maximized, app_maximize, app_minimize};
use commands::system::get_system_info;
use commands::computer::get_computer_status;
use commands::agent::get_agent_status;
use commands::http::execute_native_http;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_minimize,
            app_maximize,
            app_close,
            app_is_maximized,
            get_system_info,
            get_computer_status,
            get_agent_status,
            execute_native_http
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aven desktop application");
}
