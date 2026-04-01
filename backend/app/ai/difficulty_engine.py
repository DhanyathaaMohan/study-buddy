def next_difficulty(current_difficulty: str, score: int):
    levels = ["easy", "medium", "hard"]

    if current_difficulty not in levels:
        current_difficulty = "easy"

    idx = levels.index(current_difficulty)

    if score >= 8:
        idx = min(idx + 1, len(levels) - 1)
    elif score <= 4:
        idx = max(idx - 1, 0)

    return levels[idx]