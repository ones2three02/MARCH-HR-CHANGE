use tauri::Manager;
use tauri::path::BaseDirectory;
use std::process::Command;

#[tauri::command]
fn get_node_log() -> Result<String, String> {
  let log_path = std::env::temp_dir().join("node_server.log");
  if log_path.exists() {
    std::fs::read_to_string(log_path).map_err(|e| e.to_string())
  } else {
    Err("未检测到日志文件。可能由于您系统上未全局安装 Node.js (或环境变量 PATH 中未配置 node)。".to_string())
  }
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
  app.package_info().version.to_string()
}

#[tauri::command]
fn run_installer(_app: tauri::AppHandle, file_path: String) -> Result<(), String> {
  let path = std::path::Path::new(&file_path);
  if !path.exists() {
    return Err(format!("安装包文件不存在: {}", file_path));
  }

  #[cfg(target_os = "windows")]
  {
    let _ = Command::new("cmd")
      .args(["/C", "start", "", &file_path])
      .spawn()
      .or_else(|_| Command::new(&file_path).spawn())
      .map_err(|e| e.to_string())?;

    std::thread::sleep(std::time::Duration::from_millis(500));
    _app.exit(0);
    Ok(())
  }

  #[cfg(not(target_os = "windows"))]
  {
    Command::new("open")
      .arg(&file_path)
      .spawn()
      .map_err(|e| e.to_string())?;
    Ok(())
  }
}

#[tauri::command]
fn save_and_run_installer(_app: tauri::AppHandle, bytes: Vec<u8>, file_name: String) -> Result<(), String> {
  let temp_path = std::env::temp_dir().join(&file_name);
  std::fs::write(&temp_path, bytes).map_err(|e| format!("写入临时安装文件失败: {}", e))?;
  let path_str = temp_path.to_string_lossy().to_string();

  #[cfg(target_os = "windows")]
  {
    let _ = Command::new("cmd")
      .args(["/C", "start", "", &path_str])
      .spawn()
      .or_else(|_| Command::new(&path_str).spawn())
      .map_err(|e| format!("启动安装程序失败: {}", e))?;

    let app_handle = _app.clone();
    std::thread::spawn(move || {
      std::thread::sleep(std::time::Duration::from_millis(800));
      app_handle.exit(0);
    });
    Ok(())
  }

  #[cfg(not(target_os = "windows"))]
  {
    Command::new("open")
      .arg(&path_str)
      .spawn()
      .map_err(|e| format!("打开安装文件失败: {}", e))?;
    Ok(())
  }
}

#[tauri::command]
fn download_and_install_url(_app: tauri::AppHandle, url: String) -> Result<(), String> {
  let temp_exe = std::env::temp_dir().join("batch_person_change_installer.exe");
  let temp_str = temp_exe.to_string_lossy().to_string();

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    
    let ps_cmd = format!(
      "$ProgressPreference = 'SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '{}' -OutFile '{}'; Start-Process -FilePath '{}'",
      url, temp_str, temp_str
    );

    Command::new("powershell")
      .creation_flags(CREATE_NO_WINDOW)
      .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &ps_cmd])
      .spawn()
      .map_err(|e| format!("下载安装包失败: {}", e))?;

    let app_handle = _app.clone();
    std::thread::spawn(move || {
      std::thread::sleep(std::time::Duration::from_millis(1500));
      app_handle.exit(0);
    });
    Ok(())
  }

  #[cfg(not(target_os = "windows"))]
  {
    let _ = Command::new("open").arg(&url).spawn();
    Ok(())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_node_log, get_app_version, run_installer, save_and_run_installer, download_and_install_url])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // 动态检测 server.js 的定位 (Release 打包状态下由于相对路径 ../ 会被归入 _up_ 目录)
      let server_path = app.path().resolve("_up_/server-backend/server.js", BaseDirectory::Resource)
        .ok()
        .filter(|p| p.exists())
        .or_else(|| {
          app.path().resolve("server-backend/server.js", BaseDirectory::Resource)
            .ok()
            .filter(|p| p.exists())
        });

      if let Some(server_path) = server_path {
        let server_dir = server_path.parent().unwrap();
        let mut path_str = server_path.to_string_lossy().to_string();
        // 移除 Windows UNC 路径前缀 \\?\，避免路径解析异常
        if path_str.starts_with(r"\\?\") {
          path_str = path_str.replace(r"\\?\", "");
        }
        
        let mut server_dir_str = server_dir.to_string_lossy().to_string();
        if server_dir_str.starts_with(r"\\?\") {
          server_dir_str = server_dir_str.replace(r"\\?\", "");
        }
        
        #[cfg(target_os = "windows")]
        {
          // 使用 CREATE_NO_WINDOW 避免在 Windows 上弹出控制台黑窗口
          use std::os::windows::process::CommandExt;
          const CREATE_NO_WINDOW: u32 = 0x08000000;
          
          // 尝试在系统临时目录下写入启动日志以供故障排查
          let log_path = std::env::temp_dir().join("node_server.log");
          let mut cmd = Command::new("node");
          cmd.current_dir(&server_dir_str)
             .creation_flags(CREATE_NO_WINDOW)
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
              .current_dir(&server_dir_str)
              .arg(&path_str)
              .spawn();
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
