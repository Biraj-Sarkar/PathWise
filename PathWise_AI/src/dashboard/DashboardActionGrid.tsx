import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { 
  Play, ChevronRight, HelpCircle, Code2, Flame, Sparkles, RefreshCw,
  BookOpen, Compass, Award, AlertCircle, MessageSquare, Briefcase, ArrowRight 
} from "lucide-react";
import { apiClient } from "../utils/apiClient.ts";

export default function DashboardActionGrid() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Dashboard Aggregated States
  const [loading, setLoading] = useState(true);
  const [refreshAI, setRefreshAI] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any>(null);
  const [learningHistory, setLearningHistory] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // Core Hydration Function
  async function fetchDashboardMetrics(showFullSkeleton: boolean = true) {
    if (showFullSkeleton) setLoading(true);
    try {
      const [chatRes, progressRes, historyRes, oppRes] = await Promise.allSettled([
        apiClient("/learning/chat-history", { method: "GET" }, dispatch),
        apiClient("/learning/progress", { method: "GET" }, dispatch),
        apiClient("/learning/history", { method: "GET" }, dispatch),
        apiClient("/opportunities/cached", { method: "GET" }, dispatch)
      ]);

      if (chatRes.status === "fulfilled" && chatRes.value.ok) {
        const body = await chatRes.value.json();
        const historyData = body.data || body;
        // historyData is { [session_id]: message[] }, each message[] already
        // sorted newest-first by the backend. Turn it into a session list
        // sorted by each session's most recent message.
        const sessions = Object.entries(historyData).map(([session_id, messages]) => ({
          session_id,
          messages: messages as any[],
        }));
        sessions.sort((a, b) => {
          const aTime = new Date(a.messages[0]?.timestamp || 0).getTime();
          const bTime = new Date(b.messages[0]?.timestamp || 0).getTime();
          return bTime - aTime;
        });
        setChatSessions(sessions);
      }
      if (progressRes.status === "fulfilled" && progressRes.value.ok) {
        const body = await progressRes.value.json();
        setProgressData(body.data || body);
      }
      if (historyRes.status === "fulfilled" && historyRes.value.ok) {
        const body = await historyRes.value.json();
        setLearningHistory(body.data || body);
      }
      if (oppRes.status === "fulfilled" && oppRes.value.ok) {
        const body = await oppRes.value.json();
        const internships = (body.data || body).internships || [];
        const jobs = (body.data || body).jobs || [];
        const courses = (body.data || body).courses || [];
        const certifications = (body.data || body).certifications || [];
        const hackathons = (body.data || body).hackathons || [];
        const competitions = (body.data || body).competitions || [];
        const scholarships = (body.data || body).scholarships || [];
        const bootcamps = (body.data || body).bootcamps || [];
        const workshops = (body.data || body).workshops || [];
        setOpportunities([...internships, ...jobs, ...courses, ...certifications, ...hackathons, ...competitions, ...scholarships, ...bootcamps, ...workshops]);
      }
    } catch (err) {
      console.error("Dashboard synchronization error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Orchestrate Concurrent Dashboard Server Hydration
  useEffect(() => {
    fetchDashboardMetrics(true);
  }, [dispatch]);

  // Handle AI Refresh Trigger
  const handleRefreshAI = async () => {
    if (refreshAI) return;
    setRefreshAI(true);
    setRefreshMessage("Initiating custom AI sync...");

    try {
      const response = await apiClient("/opportunities/refresh", { method: "POST" }, dispatch);
      if (response && response.ok) {
        const body = await response.json();
        setRefreshMessage(body.message || "AI Engine working! Syncing cache...");

        // Re-fetch dashboard metrics after refresh
        setTimeout(async () => {
          await fetchDashboardMetrics(false);
          setRefreshAI(false);
          setRefreshMessage("");
        }, 3000);
      } else {
        setRefreshAI(false);
        setRefreshMessage("AI refresh failed. Please try again later.");
      }
    } catch (err) {
      console.error("Failed to run background worker opportunity compilation:", err);
      setRefreshAI(false);
      setRefreshMessage("");
    }
  }

  // Derived Values Matrix
  const latestSession = chatSessions.length > 0 ? chatSessions[0] : null;
  const latestMessage = latestSession?.messages?.[0] || null;

  const sortedTopics = progressData?.topics && Array.isArray(progressData.topics)
    ? [...progressData.topics].sort((a, b) => (a.mastery_score || 0) - (b.mastery_score || 0))
    : [];

  const lowestMasteryTopic = sortedTopics[0] || null;
  const criticalWeakTopics = sortedTopics.slice(0, 3);
  
  const totalQuestionsAttempted = progressData?.topics?.reduce((acc: number, curr: any) => acc + (curr.questions_attempted || 0), 0) || 0;

  // Local AI Coach Generator Logic Engine
  const generateCoachTelemetry = () => {
    if (!lowestMasteryTopic) {
      return {
        headline: "Welcome back, Ready to start?",
        text: "Initialize your learning track vectors to begin generating metrics.",
        cta: "Build Roadmap",
        mastery: 0
      };
    }
    const m = lowestMasteryTopic.mastery_score || 0;
    if (m < 40) {
      return {
        headline: "Let's focus on foundations!",
        text: `Your mastery in ${lowestMasteryTopic.topic} is at ${m}%. Reviewing active node docs is recommended.`,
        cta: "Review Learning Pathway",
        mastery: m
      };
    } else if (m >= 40 && m < 70) {
      return {
        headline: "You are doing great!",
        text: `Mastery for ${lowestMasteryTopic.topic} reached ${m}%. Let's secure it via a target assessment query.`,
        cta: "Launch Target Quiz",
        mastery: m
      };
    } else {
      return {
        headline: "Excellent Proficiency!",
        text: `Mastery metrics are locked at an elite ${m}%. Advance your career vector targets now.`,
        cta: "Expand Learning Tree",
        mastery: m
      };
    }
  };
  const coachData = generateCoachTelemetry();

  // Modular Premium Skeleton Helper Node
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-gray-200/60 rounded-xl ${className}`} />
  );

  return (
    <div className="w-full mt-6 flex flex-col gap-6 font-custom2">
      
      {/* ========================================================================= */}
      {/* --- PREMIUM QUICK ACTIONS ROW ------------------------------------------- */}
      {/* ========================================================================= */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: "Learn with AI", path: "/playground", icon: BookOpen, color: "text-blue-500" },
          { name: "Quiz Arena", path: "/quiz", icon: HelpCircle, color: "text-purple-500" },
          { name: "Global Roadmap", path: "/roadmap", icon: Compass, color: "text-amber-500" },
          { name: "Opportunities", path: "/opportunities", icon: Briefcase, color: "text-emerald-500" },
        ].map((act, i) => (
          <div 
            key={i} 
            onClick={() => navigate(act.path)}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-xs hover:shadow-md hover:border-gray-300 transition duration-200 group"
          >
            <div className={`p-2.5 bg-gray-50 border border-gray-100 rounded-xl ${act.color} group-hover:scale-105 transition duration-200`}>
              <act.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-gray-800 tracking-wide font-ar-one-sans">{act.name}</span>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* --- RESPONSIVE WORKSPACE MATRIX ----------------------------------------- */}
      {/* ========================================================================= */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- LEFT COLUMNS: PRIMARY ACTIVITY HUBS (7 Columns Wide) ---------------- */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* CARD 1: CONTINUE LEARNING (HERO NODE) */}
          {loading ? (
            <div className="bg-[#1e2530] border border-gray-800 rounded-3xl p-6 h-56 flex flex-col gap-4">
              <Skeleton className="w-32 h-4 bg-gray-700/50" />
              <Skeleton className="w-3/4 h-8 bg-gray-700/50" />
              <Skeleton className="w-1/2 h-4 bg-gray-700/50 mt-auto" />
            </div>
          ) : latestSession && latestMessage ? (
            <div className="w-full bg-[#1e2530] text-white border border-gray-800 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between gap-5 group">
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/15 transition duration-300" />
              <div className="flex flex-col gap-2 z-10">
                <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md w-max">
                  Active Roadmap Node
                </span>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-ar-one-sans mt-2">
                  {latestMessage.subtopic || "Active Module Tracking"}
                </h2>
                <p className="text-xs text-gray-400 font-mono tracking-wide mt-0.5">
                  Topic: {latestMessage.topic || "General Parameters"} • {latestSession.messages.length} messages
                </p>
              </div>
              <div className="w-full flex sm:flex-row flex-col sm:items-center justify-between gap-4 border-t border-gray-800/60 pt-4 z-10">
                <span className="text-xs font-mono text-gray-500">
                  Last Sync: {latestMessage.timestamp ? new Date(latestMessage.timestamp).toLocaleDateString() : "Active Now"}
                </span>
                <button
                  onClick={() => navigate("/playground", { state: { session_id: latestSession.session_id } })}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Learning</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full bg-[#1e2530] text-white border border-dashed border-gray-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-3 bg-gray-800 rounded-2xl text-gray-400"><Code2 className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold font-ar-one-sans">No active learning session.</h3>
              <p className="text-xs text-gray-400 max-w-sm -mt-1">Start learning with PathWise AI to compile roadmap streams and metrics.</p>
              <button onClick={() => navigate("/playground")} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-xs rounded-xl transition cursor-pointer hover:scale-105">
                Start Learning
              </button>
            </div>
          )}

          {/* CARD 2: RECENT CONVERSATIONS STREAM */}
          <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Recent Conversations</h3>
            </div>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((n) => <Skeleton key={n} className="w-full h-12" />)}
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No telemetry streams captured yet.</div>
            ) : (
              <div className="flex flex-col max-h-90 overflow-y-auto divide-y divide-gray-100 pr-1">
                {chatSessions.slice(0, 5).map((session, idx) => {
                  const msg = session.messages[0];
                  return (
                    <div 
                      key={idx} 
                      onClick={() => navigate("/playground", { state: { session_id: session.session_id } })}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 px-2 rounded-xl transition group"
                    >
                      <div className="flex flex-col truncate gap-0.5">
                        <span className="text-sm font-bold text-gray-800 truncate font-ar-one-sans">{msg?.subtopic || msg?.topic || "Untitled Session"}</span>
                        <p className="text-xs text-gray-400 truncate max-w-md">
                          {msg?.subtopic ? msg?.topic : `${session.messages.length} messages`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-gray-400">
                          {msg?.timestamp ? new Date(msg.timestamp).toLocaleDateString() : "Archive"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition duration-200" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CARD 3: RECOMMENDED ASSESSMENT NODES */}
          <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Recommended Assessment</h3>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-purple-50 text-purple-600 font-bold border border-purple-100">AI Recommendation</span>
            </div>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="w-1/3 h-6" />
                <Skeleton className="w-full h-12" />
              </div>
            ) : lowestMasteryTopic ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-linear-to-r from-purple-50/30 to-transparent p-4 border border-purple-100/50 rounded-2xl">
                <div className="flex flex-col gap-1">
                  <h4 className="text-base font-bold text-gray-900 font-ar-one-sans">{lowestMasteryTopic.topic}</h4>
                  <p className="text-xs text-gray-500">
                    Current Mastery Index: <span className="font-bold text-purple-600 font-mono">{lowestMasteryTopic.mastery_score || 0}%</span> • Accuracy: <span className="font-semibold text-gray-700">{lowestMasteryTopic.accuracy || 0}%</span>
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-gray-400">
                    <span>📝 {lowestMasteryTopic.questions_attempted || 0} Questions Attempted</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate("/quiz", { state: { topic: lowestMasteryTopic.topic, difficulty: "Adaptive" } })}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition shadow-sm whitespace-nowrap self-start md:self-auto"
                >
                  Start Quiz
                </button>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">Set domain parameters to initialize validation nodes.</div>
            )}
          </div>

        </div>

        {/* --- RIGHT COLUMNS: DIAGNOSTICS RAIL (5 Columns Wide) --------------------- */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* CARD 1: GLOBAL DIAGNOSTICS */}
          <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono mb-4">Learning Diagnostics</h3>
            {loading ? (
              <div className="flex flex-col gap-4 items-center"><Skeleton className="w-24 h-24 rounded-full" /><Skeleton className="w-full h-8" /></div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="relative w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center font-mono font-bold text-gray-800 text-base shadow-inner shrink-0">
                    {progressData?.overall_mastery || 0}%
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin-slow pointer-events-none" style={{ transform: `rotate(${(progressData?.overall_mastery || 0) * 3.6}deg)` }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Overall Status</span>
                    <span className="text-base font-bold font-ar-one-sans text-gray-800">{progressData?.overall_status || "Active Assessment Syncing"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="text-xs font-mono text-gray-400 block uppercase">Topics Logged</span>
                    <span className="text-xl font-bold font-mono text-gray-800 mt-0.5 block">{progressData?.topics?.length || 0}</span>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="text-xs font-mono text-gray-400 block uppercase">Queries Resolved</span>
                    <span className="text-xl font-bold font-mono text-gray-800 mt-0.5 block">{totalQuestionsAttempted}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: SYSTEM RUNTIME STREAK CONTAINER */}
          <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
            {loading ? (
              <Skeleton className="w-full h-16" />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl">
                    <Flame className="w-5 h-5 fill-current animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Quiz Activity</span>
                    <span className="text-base font-bold font-mono text-gray-800 mt-0.5">
                      {learningHistory?.length || 0} Quiz Attempts
                    </span>
                  </div>
                </div>
                <button onClick={() => navigate("/history")} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl transition">
                  History Matrix
                </button>
              </div>
            )}
          </div>

          {/* CARD 3: CRITICAL DEFICIT NODES (NEEDS IMPROVEMENT) */}
          <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono mb-3">Review Priority Nodes</h3>
            {loading ? (
              <div className="flex flex-col gap-2">{[1, 2].map(n => <Skeleton key={n} className="w-full h-10" />)}</div>
            ) : criticalWeakTopics.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">All evaluation scores optimal.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {criticalWeakTopics.map((topic: any, i) => (
                  <div 
                    key={i}
                    onClick={() => navigate("/roadmap", { state: { targetTopic: topic.topic } })}
                    className="p-2.5 bg-rose-50/30 border border-rose-100 rounded-xl flex items-center justify-between cursor-pointer hover:border-rose-300 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-xs font-bold font-ar-one-sans text-gray-800 truncate">{topic.topic}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-sm bg-rose-100 text-rose-700">
                      {topic.mastery_score || 0}% Mastery
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 4: CORE AI COACH WIDGET */}
          <div className="w-full bg-linear-to-br from-blue-50/40 via-white to-transparent border border-blue-100 rounded-3xl p-6 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 p-3 text-blue-500/10 pointer-events-none"><Sparkles className="w-16 h-16" /></div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">Personal AI Mentor</h4>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2"><Skeleton className="w-1/2 h-5" /><Skeleton className="w-full h-10" /></div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h5 className="text-sm font-bold text-gray-900 font-ar-one-sans">{coachData.headline}</h5>
                  <p className="text-xs text-gray-600 leading-relaxed font-custom2">{coachData.text}</p>
                </div>
                <button onClick={() => navigate("/roadmap")} className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1">
                  <span>{coachData.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* CARD 5: RECOMMENDED ECOSYSTEM OPENING (WITH PREMIUM REFRESH ENGINE) */}
          <div className="w-full bg-white border border-gray-200 rounded-3xl p-6 shadow-xs relative">
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Target Ecosystem Alignment</h3>
              <button 
                onClick={handleRefreshAI}
                disabled={refreshAI}
                title="Force refresh matches from AI pipeline"
                className={`p-1.5 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg text-gray-400 hover:text-blue-500 transition duration-200 flex items-center justify-center cursor-pointer ${refreshAI ? "opacity-70" : ""}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshAI ? "animate-spin text-blue-500" : ""}`} />
              </button>
            </div>

            {/* Dynamic Status Notification Overlay */}
            {refreshMessage && (
              <div className="text-[10px] font-mono text-blue-500 bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-1 mb-2 animate-pulse">
                ℹ️ {refreshMessage}
              </div>
            )}

            {loading ? (
              <Skeleton className="w-full h-24" />
            ) : opportunities.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">No matching ecosystem targets found.</div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-900 font-ar-one-sans truncate">{opportunities[0].title}</span>
                  <span className="text-[11px] text-gray-500 font-medium">{opportunities[0].organization} • {opportunities[0].mode || "Remote Vector"}</span>
                  <div className="flex items-center justify-between w-full mt-2 text-[10px] font-mono text-gray-400 border-t border-gray-200/40 pt-1.5">
                    <span>Type: {opportunities[0].type || "Opportunity"}</span>
                    <span className="text-rose-500 font-semibold">Closing: {opportunities[0].deadline ? new Date(opportunities[0].deadline).toLocaleDateString() : "Soon"}</span>
                  </div>
                </div>
                <button onClick={() => navigate("/opportunities")} className="w-full py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 font-bold text-xs rounded-xl transition">
                  View Alignment Matrix
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}