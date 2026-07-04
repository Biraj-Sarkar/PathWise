import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { apiClient } from "../utils/apiClient.ts";

type ReviewResult = {
  question_id: string;
  topic?: string;
  subtopic?: string;
  difficulty_level?: string;
  question: string;
  options: string[];
  correct_answer: string;
  submitted_answer?: string;
  is_correct?: boolean;
  explanation?: string;
};

type EvaluationData = {
  total_questions?: number;
  correct_answers?: number;
  incorrect_answers?: number;
  percentage_score?: number;
  review_results?: ReviewResult[];
  weak_subtopics?: string[];
  strong_subtopics?: string[];
  analysis?: any;
};

type QuizState = {
  quizData?: {
    quiz_id: string;
    topic?: string;
    difficulty_level?: string;
    review_results?: ReviewResult[];
  };
  evaluationData?: EvaluationData;
  analysisData?: any;
};

export default function Evaluation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  const quizId = params.quiz_id;
  const state = location.state as QuizState | null;

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openExplanationMap, setOpenExplanationMap] = useState<Record<string, boolean>>({});
  const [reviewExplanationMap, setReviewExplanationMap] = useState<Record<string, any>>({});
  const [loadedQuizData, setLoadedQuizData] = useState<any>(state?.quizData || null);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(state?.evaluationData || null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (!quizId) {
      navigate("/quiz");
    }
  }, [isAuthenticated, navigate, quizId]);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!quizId) return;

      if (evaluationData && loadedQuizData) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient(`/quiz/fetch/${quizId}`, { method: "GET" }, dispatch);
        const data = await response.json();

        if (!response.ok) {
          navigate("/quiz");
          return;
        }

        const fetchedQuiz = data.data || data;
        const reviewResults = Array.isArray(fetchedQuiz.review_results) ? fetchedQuiz.review_results : [];

        setLoadedQuizData((prev: any) => prev || fetchedQuiz);
        setEvaluationData((prev) => prev || {
          review_results: reviewResults,
          total_questions: reviewResults.length,
          correct_answers: reviewResults.filter((item: ReviewResult) => item.is_correct).length,
          incorrect_answers: reviewResults.filter((item: ReviewResult) => !item.is_correct).length,
          percentage_score: fetchedQuiz.percentage_score,
        });
      } catch {
        navigate("/quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [dispatch, evaluationData, loadedQuizData, navigate, quizId]);

  const reviewResults = useMemo(() => evaluationData?.review_results || loadedQuizData?.review_results || [], [evaluationData, loadedQuizData]);

  const toggleExplanation = (questionId: string) => {
    setOpenExplanationMap((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const fetchReview = async () => {
    if (!quizId || reviewResults.length === 0) return;

    setReviewLoading(true);
    setError(null);

    try {
      const response = await apiClient(
        "/quiz/review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quiz_id: quizId,
            question_ids: reviewResults.map((item: ReviewResult) => item.question_id),
          }),
        },
        dispatch
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || data.detail || "Failed to fetch quiz review");
        return;
      }

      const reviewMap: Record<string, any> = {};
      (data.data?.reviews || []).forEach((item: any) => {
        reviewMap[item.question_id] = item.ai_review || item.explanation || item;
      });
      setReviewExplanationMap(reviewMap);
      setOpenExplanationMap((prev) => {
        const next = { ...prev };
        Object.keys(reviewMap).forEach((questionId) => {
          next[questionId] = true;
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quiz review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (!quizId) return null;

  return (
    <div className="flex-1 min-h-screen bg-gray-50 font-custom2 relative overflow-y-auto">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/quiz")}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-base font-bold font-ar-one-sans text-gray-900">Quiz Evaluation</h1>
            <p className="text-xs text-gray-400">{loadedQuizData?.topic || "Quiz review"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/quiz")}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl flex items-center gap-2"
        >
          <span>Preview Done</span>
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-4 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <aside className="xl:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs sticky top-24">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-bold text-gray-700 font-mono tracking-wider uppercase">Evaluation Summary</h2>
          </div>

          <button
            type="button"
            onClick={fetchReview}
            disabled={reviewLoading || reviewResults.length === 0}
            className="w-full mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            {reviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{reviewLoading ? "Fetching Review..." : "Review Quiz"}</span>
          </button>

          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <div className="text-gray-400 font-mono uppercase text-[10px]">Questions</div>
                <div className="mt-1 text-lg font-bold text-gray-900">{evaluationData?.total_questions ?? reviewResults.length}</div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <div className="text-gray-400 font-mono uppercase text-[10px]">Correct</div>
                <div className="mt-1 text-lg font-bold text-emerald-600">{evaluationData?.correct_answers ?? reviewResults.filter((item: ReviewResult) => item.is_correct).length}</div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <div className="text-gray-400 font-mono uppercase text-[10px]">Incorrect</div>
                <div className="mt-1 text-lg font-bold text-rose-600">{evaluationData?.incorrect_answers ?? reviewResults.filter((item: ReviewResult) => !item.is_correct).length}</div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <div className="text-gray-400 font-mono uppercase text-[10px]">Score</div>
                <div className="mt-1 text-lg font-bold text-blue-600">{Math.round(evaluationData?.percentage_score ?? 0)}%</div>
              </div>
            </div>
          )}

          {evaluationData?.analysis && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-gray-700">
              <div className="font-mono text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-2">Analysis</div>
              <pre className="whitespace-pre-wrap font-custom2">{JSON.stringify(evaluationData.analysis, null, 2)}</pre>
            </div>
          )}
        </aside>

        <main className="xl:col-span-9 flex flex-col gap-4 pb-16">
          {loading ? (
            <div className="py-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : reviewResults.length === 0 ? (
            <div className="py-16 bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center gap-2">
              <AlertCircle className="w-8 h-8 text-gray-300" />
              <p className="text-xs text-gray-400 font-mono">No evaluation data found for this quiz.</p>
            </div>
          ) : (
            reviewResults.map((question: ReviewResult, index: number) => {
              const isOpen = !!openExplanationMap[question.question_id];

              return (
                <section key={question.question_id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-400">Question {index + 1}</span>
                      <h3 className="text-sm font-bold text-gray-900 leading-relaxed">{question.question}</h3>
                    </div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full border ${question.is_correct ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                      {question.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(question.options || []).map((option) => {
                      const selected = question.submitted_answer === option;
                      const correct = question.correct_answer === option;
                      return (
                        <div
                          key={option}
                          className={`rounded-xl border px-4 py-3 text-sm ${correct ? "border-emerald-300 bg-emerald-50 text-emerald-800" : selected ? "border-rose-200 bg-rose-50 text-rose-700" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{option}</span>
                            {correct && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-mono">
                    <span className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">Your Answer: <strong className={question.is_correct ? "text-emerald-600" : "text-rose-600"}>{question.submitted_answer || "None"}</strong></span>
                    <span className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">Correct Answer: <strong className="text-emerald-600">{question.correct_answer}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExplanation(question.question_id)}
                    className="mt-4 text-[11px] font-mono font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>{isOpen ? "Hide Explanation" : "Show Explanation"}</span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-gray-700">
                      <div className="font-mono text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-2">Explanation</div>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {reviewExplanationMap[question.question_id]?.explanation || reviewExplanationMap[question.question_id]?.concept_review || question.explanation || "No explanation available."}
                      </div>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}