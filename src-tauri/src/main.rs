#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::bilibili::api,
            commands::store::store_get,
            commands::store::store_set,
            commands::window::window_move,
            commands::window::window_resize,
            commands::window::get_position,
            commands::window::set_min_size,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
