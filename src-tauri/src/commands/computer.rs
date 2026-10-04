use serde::Serialize;

#[derive(Serialize)]
pub struct ComputerStatus {
    pub connected: bool,
    pub primary_display: String,
    pub resolution: String,
    pub permissions_granted: bool,
    pub active_windows: Vec<String>,
}

#[tauri::command]
pub fn get_computer_status() -> ComputerStatus {
    ComputerStatus {
        connected: true,
        primary_display: "Primary Display 1".to_string(),
        resolution: "2560x1440".to_string(),
        permissions_granted: true,
        active_windows: vec![
            "Microsoft Excel - Monthly_Budget_Report.xlsx".to_string(),
            "Google Chrome - Flight Search".to_string(),
            "Windows Explorer - Downloads".to_string(),
        ],
    }
}
