use serde::Serialize;

#[derive(Serialize)]
pub struct AgentRuntimeStatus {
    pub state: String,
    pub active_task_id: Option<String>,
    pub memory_items_count: usize,
    pub recovery_points_count: usize,
}

#[tauri::command]
pub fn get_agent_status() -> AgentRuntimeStatus {
    AgentRuntimeStatus {
        state: "idle".to_string(),
        active_task_id: None,
        memory_items_count: 5,
        recovery_points_count: 2,
    }
}
