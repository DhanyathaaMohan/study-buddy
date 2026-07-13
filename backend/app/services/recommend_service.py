import os
import requests
from dotenv import load_dotenv
import json
import re
import urllib.parse

load_dotenv()

API_KEY = os.getenv("YOUTUBE_API_KEY")


def fetch_youtube_videos(topic: str):
    # 1. Try using the official API key if configured
    if API_KEY and API_KEY.strip() and API_KEY != "YOUR_YOUTUBE_API_KEY_HERE":
        try:
            url = "https://www.googleapis.com/youtube/v3/search"
            params = {
                "part": "snippet",
                "q": f"{topic} tutorial",
                "maxResults": 3,
                "type": "video",
                "videoEmbeddable": "true",
                "key": API_KEY
            }
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                videos = []
                for item in data.get("items", []):
                    video_id = item["id"]["videoId"]
                    title = item["snippet"]["title"]
                    videos.append({
                        "title": title,
                        "url": f"https://www.youtube.com/watch?v={video_id}"
                    })
                if videos:
                    return videos
            else:
                print("[WARNING] YouTube API returned status:", response.status_code)
        except Exception as e:
            print("[WARNING] YouTube API call failed:", e)

    # 2. Fall back to keyless search/scraping
    try:
        query = urllib.parse.quote(topic + " tutorial")
        search_url = f"https://www.youtube.com/results?search_query={query}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        response = requests.get(search_url, headers=headers, timeout=5)
        if response.status_code == 200:
            html = response.text
            matches = re.findall(r'var ytInitialData = (\{.*?\});', html)
            if matches:
                data = json.loads(matches[0])
                contents = data["contents"]["twoColumnSearchResultsRenderer"]["primaryContents"]["sectionListRenderer"]["contents"]
                videos = []
                for content in contents:
                    if "itemSectionRenderer" in content:
                        items = content["itemSectionRenderer"]["contents"]
                        for item in items:
                            if "videoRenderer" in item:
                                v = item["videoRenderer"]
                                video_id = v.get("videoId")
                                title = ""
                                if "title" in v and "runs" in v["title"] and v["title"]["runs"]:
                                    title = v["title"]["runs"][0].get("text", "")
                                if video_id and title:
                                    videos.append({
                                        "title": title,
                                        "url": f"https://www.youtube.com/watch?v={video_id}"
                                    })
                if videos:
                    return videos
    except Exception as e:
        print("[WARNING] Keyless YouTube search failed:", e)

    # 3. If both API and scraping fail, return empty to trigger local dictionary fallback
    return []



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