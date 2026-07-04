import os
import json

from google import genai
from google.genai import types
from pydantic import BaseModel

from models.Learning import QuizQuestion, AnswerSubmission
from models.AIResponse import IntentRecognitionResponse, QuizResponse, QuizDifficultyResponse, PerformanceResponse, TopicRecognitionResponse, DoubtResponse, ExampleResponse, QuizReviewResponse, LearningRoadmapResponse, OpportunityResponse, OpportunityFilterResponse, FilterExtractResponse

AI_API_KEY = os.getenv("AI_API_KEY")
client = genai.Client(api_key=AI_API_KEY)

MODEL_POOL = [
  "gemini-2.5-flash",
  "gemma-4-26b-a4b-it",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
]

def invoke_llm(prompt: str, schema: type[BaseModel] | None = None):
  for model in MODEL_POOL:
    try:
      response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
          temperature=0.2,
          max_output_tokens=4096,
          top_p=0.8,
          top_k=40,
          response_mime_type="application/json",
          response_schema=schema
        )
      )
      
      if schema:
        return response.parsed

      return response.text
    except Exception as e:
      print(f"Error invoking model {model}: {e}")
      continue

# =====================================================
# INTENT RECOGNITION
# =====================================================

def recognize_intent(prompt: str):
  return invoke_llm(prompt, schema=IntentRecognitionResponse)

# =====================================================
# QUIZ DIFFICULTY RECOGNITION
# =====================================================

def recognize_difficulty_level(prompt: str):
  return invoke_llm(prompt, schema=QuizDifficultyResponse).difficulty_level

# =====================================================
# QUIZ GENERATION
# =====================================================

def quiz_generate(prompt: str):
  return invoke_llm(prompt, schema=QuizResponse)

# =====================================================
# PERFORMANCE ANALYSIS
# =====================================================

def performance_analysis(prompt: str):
  return invoke_llm(prompt, schema=PerformanceResponse)

# =====================================================
# TOPIC RECOGNITION
# =====================================================

def recognize_topic(prompt: str):
  return invoke_llm(prompt, schema=TopicRecognitionResponse)

# =====================================================
# DOUBT RESOLUTION
# =====================================================

def doubt_resolution(prompt: str):
  return invoke_llm(prompt, schema=DoubtResponse)

# =====================================================
# EXAMPLE GENERATION
# =====================================================

def example_generation(prompt: str):
  return invoke_llm(prompt, schema=ExampleResponse)

# =====================================================
# QUIZ REVIEW
# =====================================================

def quiz_review_explanation(prompt: str):
  return invoke_llm(prompt, schema=QuizReviewResponse)

# =====================================================
# LEARNING ROADMAP
# =====================================================

def generate_learning_roadmap(prompt: str):
  return invoke_llm(prompt, schema=LearningRoadmapResponse)

# =====================================================
# LOCAL QUIZ EVALUATION
# =====================================================

def evaluate_quiz(questions: list[QuizQuestion], answers: list[AnswerSubmission]):
  answers_map = {a.question_id: a.answer_submitted for a in answers}

  review_results = []
  correct_count = 0

  weak_subtopics = {}
  strong_subtopics = {}

  for question in questions:
    submitted_answer = answers_map.get(question.question_id)

    is_correct = submitted_answer == question.correct_answer

    if is_correct:
      correct_count += 1
      strong_subtopics[question.subtopic] = strong_subtopics.get(question.subtopic, 0) + 1
    else:
      weak_subtopics[question.subtopic] = weak_subtopics.get(question.subtopic, 0) + 1

    review_results.append({
      "question_id": question.question_id,
      "topic": question.topic,
      "subtopic": question.subtopic,
      "difficulty_level": question.difficulty_level.value,
      "question": question.question,
      "options": question.options,
      "correct_answer": question.correct_answer,
      "submitted_answer": submitted_answer,
      "is_correct": is_correct,
      "explanation": question.explanation
    })
  
  total_questions = len(questions)
  percentage_score = (correct_count / total_questions) * 100 if total_questions > 0 else 0.0
  
  return {
    "total_questions": total_questions,
    "correct_answers": correct_count,
    "incorrect_answers": total_questions - correct_count,
    "percentage_score": percentage_score,
    "review_results": review_results,
    "weak_subtopics": list(weak_subtopics.keys()),
    "strong_subtopics": list(strong_subtopics.keys()),
  }

# =====================================================
# OPPORTUNITY RECOMMENDATION
# =====================================================

def recommend_opportunities(prompt: str):
  return invoke_llm(prompt, schema=OpportunityResponse)

def filter_opportunities(prompt: str):
  return invoke_llm(prompt, schema=OpportunityFilterResponse)

# =====================================================
# OPPORTUNITY FILTER EXTRACTION
# =====================================================

def filter_extract(prompt: str):
  return invoke_llm(prompt, schema=FilterExtractResponse)