use regex_lite::Regex;
use reqwest::header::{HeaderMap, HeaderValue};
use serde_json::{json, Value};

const BILIBILI_REFERER: &str = "https://www.bilibili.com/";
const USER_AGENT: &str = "Mozilla/5.0";
const PLAYLIST_PAGE_SIZE: u32 = 20;
const AUDIO_URL_EXPIRY_MS: u64 = 10 * 60 * 1000;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct Track {
    pub bvid: String,
    pub cid: u64,
    pub title: String,
    pub author: String,
    pub cover: String,
    pub duration: Option<u64>,
}

#[derive(serde::Deserialize, Debug)]
#[serde(tag = "type")]
pub enum BilibiliMessage {
    #[serde(rename = "GET_VIDEO_INFO")]
    GetVideoInfo { bvid: String },
    #[serde(rename = "GET_PLAYLIST")]
    GetPlaylist { url: String },
    #[serde(rename = "GET_AUDIO_URL")]
    GetAudioUrl { bvid: String, cid: u64 },
}

#[derive(serde::Serialize)]
#[serde(untagged)]
pub enum ApiResponse {
    Success { success: bool, data: Value },
    Error { success: bool, error: String },
}

fn default_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert("Referer", HeaderValue::from_static(BILIBILI_REFERER));
    headers.insert("User-Agent", HeaderValue::from_static(USER_AGENT));
    headers
}

fn client() -> reqwest::Client {
    reqwest::Client::builder()
        .default_headers(default_headers())
        .build()
        .expect("failed to create HTTP client")
}

async fn get_video_info(bvid: &str) -> Result<Track, String> {
    let client = client();
    let url = format!("https://api.bilibili.com/x/web-interface/view?bvid={bvid}");
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let data: Value = resp.json().await.map_err(|e| e.to_string())?;

    if data["code"].as_i64() != Some(0) {
        return Err(data["message"].as_str().unwrap_or("unknown error").to_string());
    }

    let v = &data["data"];
    Ok(Track {
        bvid: v["bvid"].as_str().unwrap_or("").to_string(),
        cid: v["cid"].as_u64().unwrap_or(0),
        title: v["title"].as_str().unwrap_or("").to_string(),
        author: v["owner"]["name"].as_str().unwrap_or("").to_string(),
        cover: v["pic"].as_str().unwrap_or("").to_string(),
        duration: v["duration"].as_u64(),
    })
}

fn parse_playlist_url(url: &str) -> Option<(String, String)> {
    let re1 = Regex::new(r"medialist/play/dlista/(\d+)/(\d+)").ok()?;
    if let Some(caps) = re1.captures(url) {
        let season_id = caps.get(1)?.as_str().to_string();
        let mid = caps.get(2)?.as_str().to_string();
        return Some((mid, season_id));
    }

    let re2 = Regex::new(r"space\.bilibili\.com/(\d+)/favlist\?.*fid=(\d+)").ok()?;
    if let Some(caps) = re2.captures(url) {
        let mid = caps.get(1)?.as_str().to_string();
        let season_id = caps.get(2)?.as_str().to_string();
        return Some((mid, season_id));
    }

    None
}

async fn get_playlist(url: &str) -> Result<Vec<Track>, String> {
    let (_mid, season_id) =
        parse_playlist_url(url).ok_or_else(|| "Invalid playlist URL".to_string())?;

    let client = client();
    let mut all: Vec<Value> = Vec::new();
    let mut pn: u32 = 1;

    loop {
        let api_url = format!(
            "https://api.bilibili.com/x/v3/fav/resource/list?media_id={season_id}&pn={pn}&ps={PLAYLIST_PAGE_SIZE}"
        );
        let resp = client.get(&api_url).send().await.map_err(|e| e.to_string())?;
        let data: Value = resp.json().await.map_err(|e| e.to_string())?;

        if data["code"].as_i64() != Some(0) {
            return Err(
                data["message"]
                    .as_str()
                    .unwrap_or("unknown error")
                    .to_string(),
            );
        }

        let medias = data["data"]["list"]
            .as_array()
            .or_else(|| data["data"]["medias"].as_array())
            .cloned()
            .unwrap_or_default();

        if medias.is_empty() {
            break;
        }
        let count = medias.len() as u32;
        all.extend(medias);

        let has_more = data["data"]["has_more"].as_bool().unwrap_or(false);
        if !has_more || count < PLAYLIST_PAGE_SIZE {
            break;
        }
        pn += 1;
    }

    // Fetch correct cid for each track (favorites API returns avid, not cid)
    let mut results = Vec::with_capacity(all.len());
    for item in &all {
        let bvid = item["bvid"].as_str().unwrap_or("").to_string();
        let track = match get_video_info(&bvid).await {
            Ok(info) => Track {
                bvid: item["bvid"].as_str().unwrap_or("").to_string(),
                cid: info.cid,
                title: item["title"].as_str().unwrap_or("").to_string(),
                author: item["upper"]["name"].as_str().unwrap_or("").to_string(),
                cover: item["cover"].as_str().unwrap_or("").to_string(),
                duration: item["duration"].as_u64(),
            },
            Err(_) => Track {
                bvid: item["bvid"].as_str().unwrap_or("").to_string(),
                cid: 0,
                title: item["title"].as_str().unwrap_or("").to_string(),
                author: item["upper"]["name"].as_str().unwrap_or("").to_string(),
                cover: item["cover"].as_str().unwrap_or("").to_string(),
                duration: item["duration"].as_u64(),
            },
        };
        results.push(track);
    }

    Ok(results)
}

async fn get_audio_url(bvid: &str, cid: u64) -> Result<(String, u64), String> {
    let client = client();
    let url = format!(
        "https://api.bilibili.com/x/player/playurl?bvid={bvid}&cid={cid}&qn=0&fnval=16&fnver=0&fourk=1"
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let data: Value = resp.json().await.map_err(|e| e.to_string())?;

    if data["code"].as_i64() != Some(0) {
        return Err(
            data["message"]
                .as_str()
                .unwrap_or("unknown error")
                .to_string(),
        );
    }

    let audio_track = data["data"]["dash"]["audio"]
        .as_array()
        .and_then(|arr| arr.first());

    let audio_track = audio_track.ok_or("No audio track found")?;
    let audio_url = audio_track["baseUrl"]
        .as_str()
        .or_else(|| audio_track["base_url"].as_str())
        .ok_or("No audio URL")?;

    Ok((audio_url.to_string(), AUDIO_URL_EXPIRY_MS))
}

#[tauri::command]
pub async fn api(message: BilibiliMessage) -> Result<ApiResponse, String> {
    let result = match message {
        BilibiliMessage::GetVideoInfo { bvid } => {
            let track = get_video_info(&bvid).await?;
            Ok(json!(track))
        }
        BilibiliMessage::GetPlaylist { url } => {
            let tracks = get_playlist(&url).await?;
            Ok(json!(tracks))
        }
        BilibiliMessage::GetAudioUrl { bvid, cid } => {
            let (url, expires_at) = get_audio_url(&bvid, cid).await?;
            Ok(json!({ "url": url, "expiresAt": expires_at }))
        }
    };

    match result {
        Ok(data) => Ok(ApiResponse::Success {
            success: true,
            data,
        }),
        Err(error) => Ok(ApiResponse::Error {
            success: false,
            error,
        }),
    }
}
