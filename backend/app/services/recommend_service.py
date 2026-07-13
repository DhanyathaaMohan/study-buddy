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
        "videoEmbeddable": "true",
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


FALLBACK_VIDEOS = {
    "react": {
        "title": "React JS Tutorial for Beginners",
        "url": "https://www.youtube.com/watch?v=Ke90Tje7VS0"
    },
    "python": {
        "title": "Python for Beginners - Full Course",
        "url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc"
    },
    "javascript": {
        "title": "JavaScript Tutorial for Beginners",
        "url": "https://www.youtube.com/watch?v=W6NZfCO5SIk"
    },
    "database": {
        "title": "Introduction to Database Systems",
        "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY"
    },
    "science": {
        "title": "Introduction to Photosynthesis",
        "url": "https://www.youtube.com/watch?v=sQK3Yr4Sc_k"
    },
    "binary tree": {
        "title": "Binary Trees and Binary Search Trees",
        "url": "https://www.youtube.com/watch?v=qH6yxkw0u78"
    },
    "default": {
        "title": "How my friend ranked 1st at Medical School - Active Recall Framework",
        "url": "https://www.youtube.com/watch?v=fDbxPVn02VU"
    }
}


def generate_recommendations(topic: str, difficulty: str, score: int):
    videos = fetch_youtube_videos(topic)

    if not videos:
        # Match fallback video by keyword
        topic_lower = topic.lower()
        selected = FALLBACK_VIDEOS["default"]
        for key, video_info in FALLBACK_VIDEOS.items():
            if key in topic_lower:
                selected = video_info
                break
        reason = "Using high-quality fallback video tutorial"
    else:
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