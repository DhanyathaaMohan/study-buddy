from app.db import progress_collection

def update_progress(user_id: str, topic: str, score: int, difficulty: str, next_difficulty: str):
    existing = progress_collection.find_one({
        "user_id": user_id,
        "topic": topic
    })

    if existing:
        scores = existing.get("scores", [])
        scores.append(score)

        progress_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "scores": scores,
                    "current_difficulty": next_difficulty,
                    "last_score": score,
                    "attempts": len(scores)
                }
            }
        )
    else:
        progress_collection.insert_one({
            "user_id": user_id,
            "topic": topic,
            "scores": [score],
            "current_difficulty": next_difficulty,
            "last_score": score,
            "attempts": 1
        })

    return {
        "message": "Progress updated successfully"
    }


def get_user_progress(user_id: str):
    records = list(progress_collection.find({"user_id": user_id}, {"_id": 0}))

    total_topics = len(records)
    total_attempts = sum(item.get("attempts", 0) for item in records)

    all_topic_averages = []
    for item in records:
        scores = item.get("scores", [])
        avg = sum(scores) / len(scores) if scores else 0
        all_topic_averages.append((item["topic"], avg))

    average_score = (
        sum(avg for _, avg in all_topic_averages) / len(all_topic_averages)
        if all_topic_averages else 0
    )

    strongest_topic = max(all_topic_averages, key=lambda x: x[1])[0] if all_topic_averages else None
    weakest_topic = min(all_topic_averages, key=lambda x: x[1])[0] if all_topic_averages else None

    return {
        "user_id": user_id,
        "topics": records,
        "total_topics": total_topics,
        "total_attempts": total_attempts,
        "average_score": round(average_score, 2),
        "strongest_topic": strongest_topic,
        "weakest_topic": weakest_topic
    }
def get_recommended_topic(user_id: str):
    records = list(progress_collection.find({"user_id": user_id}))

    if not records:
        return None

    topic_scores = []

    for item in records:
        scores = item.get("scores", [])
        avg = sum(scores) / len(scores) if scores else 0
        topic_scores.append((item["topic"], avg))

    # weakest topic first
    topic_scores.sort(key=lambda x: x[1])

    return topic_scores[0][0] if topic_scores else None