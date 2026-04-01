import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("YOUTUBE_API_KEY")


def fetch_youtube_videos(topic: str):
    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": f"{topic} tutorial",
        "maxResults": 3,
        "type": "video",
        "key": API_KEY
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        print("YouTube API error:", response.text)
        return []

    data = response.json()

    videos = []

    for item in data.get("items", []):
        video_id = item["id"]["videoId"]
        title = item["snippet"]["title"]

        videos.append({
            "title": title,
            "url": f"https://www.youtube.com/watch?v={video_id}"
        })

    return videos


def generate_recommendations(topic: str, difficulty: str, score: int):
    videos = fetch_youtube_videos(topic)

    if not videos:
        return {
            "topic": topic,
            "videos": [
                {
                    "title": f"Search {topic} on YouTube",
                    "url": f"https://www.youtube.com/results?search_query={topic.replace(' ', '+')}"
                }
            ],
            "type": "search"
        }

    
    if score <= 4:
        selected = videos[0]
        reason = "Basic explanation recommended"
    elif score <= 7:
        selected = videos[1] if len(videos) > 1 else videos[0]
        reason = "Intermediate level video"
    else:
        selected = videos[-1]
        reason = "Advanced deep dive"

    return {
        "topic": topic,
        "videos": [selected],
        "type": "direct",
        "reason": reason
    }