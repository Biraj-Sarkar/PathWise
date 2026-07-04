def calculate_mastery_score(
  accuracy: float = 0.0,
  easy_accuracy: float = 0.0,
  medium_accuracy: float = 0.0,
  hard_accuracy: float = 0.0,
  questions_attempted: int = 0,
  learning_time_seconds: int = 0,
  example_requests: int = 0,
  solution_explanations_requested: int = 0,
):
  accuracy_score = accuracy

  difficulty_score = (easy_accuracy * 0.20) + (medium_accuracy * 0.30) + (hard_accuracy * 0.50)

  experience_score = min(questions_attempted, 100)

  engagement_score = min(learning_time_seconds / 3600 * 20, 100)

  confidence_score = 100 - example_requests * 2 - solution_explanations_requested * 3
  confidence_score = max(confidence_score, 0)

  mastery_score = (
    accuracy_score * 0.40 +
    difficulty_score * 0.25 +
    experience_score * 0.15 +
    engagement_score * 0.10 +
    confidence_score * 0.10
  )

  return round(mastery_score, 2)

def get_status(mastery_score: float, questions_attempted: int, hard_attempted: int):
  if questions_attempted < 20:
    return "Beginner"
  
  if mastery_score < 41:
    return "Beginner"
  
  if mastery_score < 61:
    return "Learning"

  if mastery_score < 81:
    return "Proficient"

  if hard_attempted < 20:
    return "Proficient"

  return "Mastered"

def calculate_mastery_status(progress: dict):
  easy_accuracy = (progress["easy_correct"] / max(progress["questions_attempted"], 1)) * 100
  medium_accuracy = (progress["medium_correct"] / max(progress["questions_attempted"], 1)) * 100
  hard_accuracy = (progress["hard_correct"] / max(progress["questions_attempted"], 1)) * 100

  mastery_score = calculate_mastery_score(
    accuracy=progress["accuracy"],
    easy_accuracy=easy_accuracy,
    medium_accuracy=medium_accuracy,
    hard_accuracy=hard_accuracy,
    questions_attempted=progress["questions_attempted"],
    learning_time_seconds=progress["learning_time"],
    example_requests=progress["example_requests"],
    solution_explanations_requested=progress["solution_explanation_requests"]
  )

  status = get_status(mastery_score, progress["questions_attempted"], progress["hard_attempted"])
  
  return {"mastery_score": mastery_score, "status": status}