use std::collections::HashMap;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub body: String,
    pub headers: HashMap<String, String>,
}

#[tauri::command]
pub fn execute_native_http(
    url: String,
    method: String,
    headers: HashMap<String, String>,
    body: Option<String>,
) -> Result<HttpResponse, String> {
    let mut cmd = Command::new("curl.exe");
    cmd.arg("-s")
       .arg("-S")
       .arg("-i")
       .arg("-X")
       .arg(&method)
       .arg(&url);

    for (k, v) in &headers {
        cmd.arg("-H").arg(format!("{}: {}", k, v));
    }

    if let Some(ref b) = body {
        cmd.arg("-d").arg(b);
    }

    let output = cmd.output().map_err(|e| format!("Failed to execute curl: {}", e))?;

    let raw = String::from_utf8_lossy(&output.stdout);

    if !output.status.success() && raw.trim().is_empty() {
        let err_str = String::from_utf8_lossy(&output.stderr);
        return Err(format!("curl error: {}", err_str));
    }

    // Handle multiple header blocks (e.g. HTTP 100 Continue before HTTP 200)
    let mut status = 200;
    let mut status_text = "OK".to_string();
    let mut resp_headers = HashMap::new();
    let body_part: &str;

    // Find the last HTTP status line and body separator
    let sections: Vec<&str> = if raw.contains("\r\n\r\n") {
        raw.split("\r\n\r\n").collect()
    } else {
        raw.split("\n\n").collect()
    };

    if sections.len() >= 2 {
        let header_section = sections[sections.len() - 2];
        body_part = sections[sections.len() - 1];

        for line in header_section.lines() {
            if line.starts_with("HTTP/") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(code) = parts[1].parse::<u16>() {
                        status = code;
                    }
                }
                if parts.len() >= 3 {
                    status_text = parts[2..].join(" ");
                }
            } else if let Some(colon) = line.find(':') {
                let key = line[..colon].trim().to_lowercase();
                let val = line[colon + 1..].trim().to_string();
                resp_headers.insert(key, val);
            }
        }
    } else {
        body_part = raw.as_ref();
    }

    Ok(HttpResponse {
        status,
        status_text,
        body: body_part.to_string(),
        headers: resp_headers,
    })
}
