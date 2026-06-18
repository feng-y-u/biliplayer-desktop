#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::bilibili::api,
            commands::store::store_get,
            commands::store::store_set,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
