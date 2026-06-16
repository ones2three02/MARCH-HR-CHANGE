// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::env;
use std::process::Command;

// 动态检索 server.js 所在的绝对路径以适配开发调试与 release 打包双状态
fn find_server_js() -> Option<PathBuf> {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            // macOS release 状态下资源文件会被打包进 Resources 目录，可执行文件在 MacOS 目录中
            // 它们之间的相对关系是: ../Resources/server.js
            let mac_resources_path = exe_dir.join("../Resources/server.js");
            if mac_resources_path.exists() {
                return Some(mac_resources_path);
            }

            // 本地开发调试状态下，当前可执行文件在 src-tauri/target/debug/ 目录，向上回退寻路
            let mut current = exe_dir.to_path_buf();
            for _ in 0..5 {
                let check_path = current.join("server.js");
                if check_path.exists() {
                    return Some(check_path);
                }
                if let Some(parent) = current.parent() {
                    current = parent.to_path_buf();
                } else {
                    break;
                }
            }
        }
    }
    // 默认备用相对路径
    Some(PathBuf::from("server.js"))
}

fn main() {
    // 自动在后台异步启动 node 代理中转服务
    if let Some(server_path) = find_server_js() {
        let path_str = server_path.to_string_lossy().to_string();
        
        #[cfg(target_os = "windows")]
        let _ = Command::new("cmd")
            .args(&["/C", &format!("node \"{}\"", path_str)])
            .spawn();

        #[cfg(not(target_os = "windows"))]
        let _ = Command::new("node")
            .arg(&path_str)
            .spawn();
    }

    app_lib::run();
}
