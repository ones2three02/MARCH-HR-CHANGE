use tauri::Manager;
use tauri::path::BaseDirectory;
use std::process::Command;

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

      // 自动在后台启动 Node.js 代理服务 (直接通过 Tauri 资源路径解析器定位 server.js 资源)
      if let Ok(server_path) = app.path().resolve("server.js", BaseDirectory::Resource) {
        if server_path.exists() {
          let path_str = server_path.to_string_lossy().to_string();
          
          #[cfg(target_os = "windows")]
          {
            // 使用 CREATE_NO_WINDOW 避免在 Windows 上弹出控制台黑窗口
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            let _ = Command::new("cmd")
                .creation_flags(CREATE_NO_WINDOW)
                .args(&["/C", &format!("node \"{}\"", path_str)])
                .spawn();
          }

          #[cfg(not(target_os = "windows"))]
          {
            let _ = Command::new("node")
                .arg(&path_str)
                .spawn();
          }
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
