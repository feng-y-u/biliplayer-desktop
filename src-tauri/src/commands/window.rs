use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowPosition {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[tauri::command]
pub async fn window_move(
    app: tauri::AppHandle,
    x: f64,
    y: f64,
) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;
    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: x as i32,
        y: y as i32,
    })).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn window_resize(
    app: tauri::AppHandle,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;
    window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: width as u32,
        height: height as u32,
    })).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_position(app: tauri::AppHandle) -> Result<WindowPosition, String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok(WindowPosition {
        x: pos.x as f64,
        y: pos.y as f64,
        width: size.width as f64,
        height: size.height as f64,
    })
}

#[tauri::command]
pub async fn set_min_size(
    app: tauri::AppHandle,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("Window not found")?;
    window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
        width: width as u32,
        height: height as u32,
    }))).map_err(|e| e.to_string())?;
    Ok(())
}
