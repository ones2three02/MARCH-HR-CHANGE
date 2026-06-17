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

      // 动态检测 server.js 的定位 (Release 打包状态下由于相对路径 ../ 会被归入 _up_ 目录)
      let server_path = app.path().resolve("_up_/server.js", BaseDirectory::Resource)
        .ok()
        .filter(|p| p.exists())
        .or_else(|| {
          app.path().resolve("server.js", BaseDirectory::Resource)
            .ok()
            .filter(|p| p.exists())
        });

      if let Some(server_path) = server_path {
        let mut path_str = server_path.to_string_lossy().to_string();
        // 移除 Windows UNC 路径前缀 \\?\，避免 cmd 路径解析异常导致模块找不到
        if path_str.starts_with(r"\\?\") {
          path_str = path_str.replace(r"\\?\", "");
        }
        
        #[cfg(target_os = "windows")]
        {
          // 使用 CREATE_NO_WINDOW 避免在 Windows 上弹出控制台黑窗口
          use std::os::windows::process::CommandExt;
          const CREATE_NO_WINDOW: u32 = 0x08000000;
          
          // 尝试在系统临时目录下写入启动日志以供故障排查 (避免 C:\Program Files 的写入权限不足问题)
          let log_path = std::env::temp_dir().join("node_server.log");
          let mut cmd = Command::new("node");
          cmd.creation_flags(CREATE_NO_WINDOW)
             .arg(&path_str);
          
          if let Ok(log_file) = std::fs::File::create(log_path) {
            if let Ok(log_file_err) = log_file.try_clone() {
              cmd.stdout(log_file).stderr(log_file_err);
            }
          }
          let _ = cmd.spawn();
        }

        #[cfg(not(target_os = "windows"))]
        {
          let _ = Command::new("node")
              .arg(&path_str)
              .spawn();
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
