import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { AlertCircle, Loader2, X, BookOpen, BarChart2, Award, Clock, HelpCircle } from "lucide-react";
import { apiClient } from "../utils/apiClient.ts";

type Topics = {
  topic: string;
  mastery_score: number;
  status: "Beginner" | "Learning" | "Proficient" | "Mastered";
}

type ProgressData = {
  overall_mastery: number;
  overall_status: "Beginner" | "Learning" | "Proficient" | "Mastered";
  topics: Topics[];
}

type SubtopicProgress = {
  subtopic: string;
  questions_attempted: number;
  questions_correct: number;
  accuracy: number;
  mastery_score: number;
  status: "Beginner" | "Learning" | "Proficient" | "Mastered";
  learning_time: number;
  example_requests: number;
  solution_explanation_requests: number;
}

type TopicProgressData = {
  topic: string;
  overall_mastery: number;
  overall_status: "Beginner" | "Learning" | "Proficient" | "Mastered";
  subtopics: SubtopicProgress[]
}

export default function Learning() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  // Safeguard authentication redirect inside an operational cycle instead of bare component runtime
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async (showError: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient("/learning/progress", { method: "GET" }, dispatch);
      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
      }
    } catch (error) {
      if (showError) {
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicProgress = async (topic: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient(`/learning/progress/${encodeURI(topic)}`, { method: "GET" }, dispatch);

      if (!response.ok) {
        setError(`Failed to fetch progress for topic: ${topic}`);
        return;
      }

      const data = await response.json();
      setTopicProgress(data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress(false);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Mastered": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Proficient": return "bg-blue-50 text-blue-700 border-blue-100";
      case "Learning": return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen font-custom2 pb-16 relative">
      
      {/* FIXED GLOBAL TOASTS FRAMEWORK */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto max-w-sm z-50 flex flex-col gap-2">
        {error && (
          <div className="bg-white border border-rose-200 p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase text-rose-600">System Alert</span>
              <p className="text-xs text-gray-700 leading-relaxed font-mono">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-lg bg-transparent border-none cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-lg flex items-center gap-3 self-center sm:self-end">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-xs font-mono font-bold text-gray-600 uppercase tracking-tight">Syncing State...</span>
          </div>
        )}
      </div>

      {/* CORE HERO CONTROL TOP BAR */}
      <header className="bg-white border-b border-gray-200/80 px-8 py-4 sticky top-0 z-20 shadow-xs">
        <div className="max-w-300 mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold font-ar-one-sans text-gray-900 tracking-tight">Learning Vectors</h1>
            <p className="text-xs text-gray-400">Track structural subject comprehension and telemetry insights across runtime modules.</p>
          </div>
        </div>
      </header>

      {/* TWO-COLUMN GRID BOUNDARY CONTAINER */}
      <main className="max-w-300 mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* VIEW COLUMN LEFT: OVERALL METRICS PANEL */}
        <section className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-wider">Overall Progress</h2>
          </div>

          {progress ? (
            <div className="flex flex-col gap-5">
              {/* RADIAL / HORIZONTAL PERCENTAGE COMPASS BAR */}
              <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Global Mastery</span>
                  <span className="text-sm font-extrabold text-gray-900 font-mono">{progress.overall_mastery}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress.overall_mastery}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-gray-400 uppercase">Calculated Matrix</span>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded-md ${getStatusColor(progress.overall_status)}`}>
                    {progress.overall_status}
                  </span>
                </div>
              </div>

              {/* LIST VECTOR SELECTION ROWS */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Tracked Topics</span>
                <div className="flex flex-col gap-1">
                  {progress.topics.map((item, index) => {
                    const isSelected = topicProgress?.topic === item.topic;
                    return (
                      <button
                        key={index}
                        onClick={() => fetchTopicProgress(item.topic)}
                        className={`w-full text-left px-3.5 py-3 rounded-xl border flex items-center justify-between text-xs font-bold transition group cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`} />
                          <span className="capitalize truncate pr-1">{item.topic}</span>
                        </div>
                        <span className={`text-[9px] font-mono shrink-0 px-1.5 py-0.5 border rounded-md capitalize group-hover:scale-102 transition ${
                          isSelected ? "bg-white/10 text-white border-white/20" : getStatusColor(item.status)
                        }`}>
                          {item.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 border border-dashed border-gray-200 bg-gray-50/50 rounded-xl flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-gray-400">No telemetry data pipeline synced to workspace.</p>
            </div>
          )}
        </section>

        {/* VIEW COLUMN RIGHT: DETAILED COMPREHENSION TREES */}
        <section className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Award className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-wider">Comprehension Profile</h2>
          </div>

          {topicProgress ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* ACTIVE HEADER CONTEXT OVERVIEW SUMMARY BAR */}
              <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Selected Subject Domain</span>
                  <h3 className="text-sm font-bold text-gray-900 capitalize tracking-tight">{topicProgress.topic}</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[9px] font-mono uppercase text-gray-400">Context Mastery</span>
                    <span className="text-xs font-extrabold text-blue-600 font-mono">{topicProgress.overall_mastery}%</span>
                  </div>
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-mono uppercase text-gray-400">Status</span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded-md ${getStatusColor(topicProgress.overall_status)}`}>
                      {topicProgress.overall_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIST SUBTOPIC GRID / MATRIX CARDS */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Subtopic Resolution Breakdown</span>
                
                <div className="flex flex-col gap-3">
                  {topicProgress.subtopics.map((subtopic, index) => (
                    <div key={index} className="border border-gray-200 hover:border-gray-300 rounded-xl p-4 flex flex-col gap-4 transition bg-white shadow-2xs">
                      
                      {/* HEADER SUMMARY INTERACTION ROW */}
                      <div className="flex items-start justify-between gap-4 border-b border-gray-50 pb-2.5">
                        <div className="flex flex-col gap-0.5">
                          <h4 className="text-xs font-bold text-gray-900 tracking-tight capitalize">{subtopic.subtopic}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400 font-mono">{subtopic.learning_time} mins platform integration</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded-md shrink-0 ${getStatusColor(subtopic.status)}`}>
                          {subtopic.status}
                        </span>
                      </div>

                      {/* DATA MATRIX TELEMETRY BLOCKS */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        
                        <div className="flex flex-col gap-0.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight">Comprehension</span>
                          <span className="text-xs font-bold text-gray-800 font-mono">{subtopic.mastery_score}%</span>
                        </div>

                        <div className="flex flex-col gap-0.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight">Accuracy Ratio</span>
                          <span className="text-xs font-bold text-emerald-600 font-mono">{subtopic.accuracy}%</span>
                        </div>

                        <div className="flex flex-col gap-0.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight">Assessments</span>
                          <span className="text-xs font-bold text-gray-800 font-mono">
                            {subtopic.questions_correct} <span className="text-[10px] text-gray-400 font-normal">/ {subtopic.questions_attempted}</span>
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tight">AI Requests</span>
                          <span className="text-xs font-bold text-gray-800 font-mono" title={`Examples: ${subtopic.example_requests} | Solutions: ${subtopic.solution_explanation_requests}`}>
                            {subtopic.example_requests + subtopic.solution_explanation_requests} <span className="text-[9px] font-normal font-sans text-gray-400">(Ex+Sol)</span>
                          </span>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 border-2 border-dashed border-gray-200 bg-white rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-2">
              <HelpCircle className="w-8 h-8 text-gray-300 animate-pulse" />
              <div className="flex flex-col gap-0.5 max-w-xs">
                <span className="text-xs font-bold text-gray-700 font-mono uppercase tracking-tight">No Domain Target Selected</span>
                <p className="text-xs text-gray-400">Select a learning vector domain pathway from the menu list column on the left side to compile its subtopic metrics array context.</p>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}