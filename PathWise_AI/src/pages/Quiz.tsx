import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { AlertCircle, Calendar, ChevronRight, HelpCircle, Loader2, PlayCircle, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { apiClient } from "../utils/apiClient.ts";

type QuizQuestion = {
  question_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
};

type QuizHistoryItem = {
  quiz_id: string;
  topic?: string;
  difficulty_level?: string;
  level?: string;
  attempted_at?: string;
  percentage_score?: number;
  obtained_marks?: number;
  total_marks?: number;
  questions?: QuizQuestion[];
  review_results?: QuizQuestion[];
};

export default function Quiz() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousQuizzes, setPreviousQuizzes] = useState<QuizHistoryItem[]>([]);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const fetchQuizHistory = async () => {
    setLoadingHistory(true);
    setError(null);

    try {
      const response = await apiClient("/learning/history", { method: "GET" }, dispatch);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to fetch previous quizzes logs");
        return;
      }

      setPreviousQuizzes(Array.isArray(data.data) ? data.data : data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred retrieving quiz aggregates");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchQuizHistory();
  }, [dispatch]);

  const openQuiz = (quiz: QuizHistoryItem) => {
    navigate(`/quiz/${quiz.quiz_id}`, { state: { quizData: quiz } });
  };

  const handleInitiateQuizAttempt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topic.trim()) return;

    setLoadingQuiz(true);
    setError(null);

    try {
      const response = await apiClient(
        "/quiz/request",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            level: difficulty,
            requested_at: new Date().toISOString(),
          }),
        },
        dispatch
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to initiate quiz request");
        return;
      }

      const quizData = data.data || data;
      if (quizData?.quiz_id) {
        navigate("/quiz/attempt_quiz", { state: { quizData } });
      } else {
        setError("Quiz initiation response missing required data.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate quiz request");
    } finally {
      setLoadingQuiz(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto font-custom2 relative">
      <header className="sticky top-0 bg-white border-b border-gray-200/80 px-8 py-4 flex items-center justify-between z-20 shadow-xs">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold font-ar-one-sans text-gray-900 tracking-tight">Assessment Evaluation & Quiz Engine</h1>
          <p className="text-xs text-gray-400">Launch a new quiz, review earlier attempts, and inspect question-level explanations.</p>
        </div>
        <button
          onClick={fetchQuizHistory}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
        </button>
      </header>

      {error && (
        <div className="mx-8 mt-4 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      <div className="max-w-300 mx-auto px-8 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs sticky top-24">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <PlayCircle className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-bold text-gray-700 font-mono tracking-wider uppercase">Attempt Quiz</h2>
          </div>

          <form onSubmit={handleInitiateQuizAttempt} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold font-mono text-gray-400 uppercase tracking-wider">Target Domain Topic</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Redis Architecture, React Hooks..."
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold font-mono text-gray-400 uppercase tracking-wider">Difficulty Level Matrix</label>
              <div className="grid grid-cols-2 gap-2">
                {["easy", "medium", "hard", "adaptive"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`p-2 border text-xs font-mono font-medium rounded-xl capitalize transition cursor-pointer text-center ${
                      difficulty === level
                        ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/10 border-none"
            >
              <span>{loadingQuiz ? "Preparing Quiz..." : "Initialize Dynamic Quiz"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-700 font-mono tracking-wider uppercase">How this page works</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-500 leading-relaxed">
              <p>Start a new quiz from the form above.</p>
              <p>Open any attempted quiz and inspect the full question set.</p>
              <p>Review explanations and grow your ideas.</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold text-gray-700 font-mono tracking-wider uppercase">Attempted Quiz Metrics Summary</h2>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Parsing quiz metadata...</p>
            </div>
          ) : previousQuizzes.length === 0 ? (
            <div className="py-16 border-2 border-dashed border-gray-200 bg-white rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-2">
              <HelpCircle className="w-8 h-8 text-gray-300" />
              <h3 className="text-xs font-bold text-gray-700 font-mono uppercase tracking-tight mt-1">No Evaluated Logs Available</h3>
              <p className="text-xs text-gray-400 max-w-xs">Initialize your first quiz using the setup panel on the left.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {previousQuizzes.map((quiz, idx) => {
                const totalQs = 10;
                const correctAns = 10 * (quiz.percentage_score ?? 0) / 100;
                const accuracy = quiz.percentage_score ?? (totalQs > 0 ? Math.round((correctAns / totalQs) * 100) : 0);

                return (
                  <div key={quiz.quiz_id || idx} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 shadow-xs transition flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">{quiz.topic || "Unknown Domain Node"}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono uppercase mt-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 font-bold border border-gray-200 text-gray-600">
                            {quiz.difficulty_level || quiz.level || "unknown"}
                          </span>
                          {quiz.attempted_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(quiz.attempted_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span className={`text-base font-extrabold ${accuracy >= 75 ? "text-emerald-600" : accuracy >= 45 ? "text-amber-500" : "text-rose-600"}`}>
                          {accuracy}%
                        </span>
                        <span className="text-[9px] font-mono tracking-wider text-gray-400 uppercase font-medium">Accuracy Metric</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center items-center divide-x divide-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{totalQs}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight">Total Questions</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-600">{correctAns}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight">Correct Answers</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-rose-500">{totalQs - correctAns}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight">Incorrect Answers</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => openQuiz(quiz)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer border-none"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>Open Quiz</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}