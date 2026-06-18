use serde_json::Value;

#[tauri::command]
pub async fn store_get(
    app: tauri::AppHandle,
    key: String,
) -> Result<Value, String> {
    let store = app
        .store("store.json")
        .map_err(|e| e.to_string())?;
    let value = store.get(&key).cloned().unwrap_or(Value::Null);
    Ok(value)
}

#[tauri::command]
pub async fn store_set(
    app: tauri::AppHandle,
    key: String,
    value: Value,
) -> Result<(), String> {
    let store = app
        .store("store.json")
        .map_err(|e| e.to_string())?;
    store.set(key, value);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
