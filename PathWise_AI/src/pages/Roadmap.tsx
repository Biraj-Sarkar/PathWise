import html2canvas from "html2canvas-pro";
import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { Download, Eye, Trash2 } from "lucide-react";
import { apiClient } from "../utils/apiClient.ts";
import DownloadRoadmap from "../roadmap/DownloadRoadmap.tsx";

type Roadmap = {
  step: number,
  title: string,
  description: string
}

type RoadmapItem = {
  topic: string,
  roadmap: {
    current_level: "Beginner" | "Learning" | "Proficient" | "Mastered",
    roadmap: Roadmap[],
    revision_topics: string[],
    next_topics: string[]
  }
}

interface PrevRoadmapItem extends RoadmapItem {
  updated_at: Date;
}

export default function Roadmap() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const roadmapItem = (location.state as { roadmapData?: RoadmapItem })?.roadmapData;
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const [topic, setTopic] = useState<string>("");
  const [activeTopic, setActiveTopic] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [roadmap, setRoadmap] = useState<Roadmap[]>([]);
  const [revisionTopics, setRevisionTopics] = useState<string[]>([]);
  const [nextTopics, setNextTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [prevRoadmap, setPrevRoadmap] = useState<PrevRoadmapItem[]>([]);
  const [prevLoading, setPrevLoading] = useState<boolean>(true);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<PrevRoadmapItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const fetchRoadmap = async () => {
      setPrevLoading(true);
      try {
        const response = await apiClient("/learning/roadmaps", { method: "GET" }, dispatch);
        const data = await response.json();

        setPrevRoadmap(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching previous roadmaps");
      } finally {
        setPrevLoading(false);
      }
    }
    fetchRoadmap();
  }, []);

  useEffect(() => {
    if (roadmapItem) {
      setTopic(roadmapItem.topic);
      setActiveTopic(roadmapItem.topic);
      setLevel(roadmapItem.roadmap.current_level);
      setRoadmap(roadmapItem.roadmap.roadmap);
      setRevisionTopics(roadmapItem.roadmap.revision_topics);
      setNextTopics(roadmapItem.roadmap.next_topics);
    }
  }, [roadmapItem]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const upsertPrevRoadmap = (item: PrevRoadmapItem) => {
    setPrevRoadmap((prev) => {
      const withoutTopic = prev.filter((p) => p.topic.toLowerCase() !== item.topic.toLowerCase());
      return [item, ...withoutTopic];
    });
  };

  const deletePrevRoadmap = (topicToDelete: string) => {
    setPrevRoadmap((prev) => prev.filter((item) => item.topic.toLowerCase() !== topicToDelete.toLowerCase()));
  };

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient(`/learning/roadmap/${encodeURI(topic)}`, {
        method: "GET",
      }, dispatch);

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to generate roadmap");
        return;
      }

      const generatedTopic = topic;

      setLevel(data.data.roadmap.current_level);
      setRoadmap(data.data.roadmap.roadmap);
      setRevisionTopics(data.data.roadmap.revision_topics);
      setNextTopics(data.data.roadmap.next_topics);
      setActiveTopic(generatedTopic);

      upsertPrevRoadmap({
        topic: generatedTopic,
        roadmap: data.data.roadmap,
        updated_at: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating the roadmap");
    } finally {
      setLoading(false);
    }
  }

  const handlePreviewRoadmap = (item: PrevRoadmapItem) => {
    setTopic(item.topic);
    setActiveTopic(item.topic);
    setLevel(item.roadmap.current_level);
    setRoadmap(item.roadmap.roadmap);
    setRevisionTopics(item.roadmap.revision_topics);
    setNextTopics(item.roadmap.next_topics);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleDownloadRoadmap = async (item: PrevRoadmapItem) => {
    const container = document.createElement("div");

    container.style.position = "fixed";
    container.style.left = "-100000px";
    container.style.top = "0";
    container.style.zIndex = "-1000";

    document.body.appendChild(container);

    const root = createRoot(container);

    root.render(
      <DownloadRoadmap 
        topic={item.topic}
        level={item.roadmap.current_level}
        roadmap={item.roadmap.roadmap}
        revisionTopics={item.roadmap.revision_topics}
        nextTopics={item.roadmap.next_topics}
      />
    )

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 3,
      backgroundColor: "#f9fafb",
      useCORS: true,
    });

    const link = document.createElement("a");
    link.download = `roadmap-${item.topic.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();

    root.unmount();
    document.body.removeChild(container);
  }

  const handleDeleteRoadmap = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const response = await apiClient(`/learning/roadmap/${encodeURI(deleteTarget.topic)}`, { method: "DELETE" }, dispatch);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete roadmap");
        return;
      }

      if (data.success) {
        deletePrevRoadmap(deleteTarget.topic);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting the roadmap");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  }

  const formatDate = (date: Date) => {
    try {
      return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  }

  const sortedPrevRoadmap = [...prevRoadmap].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="flex-1 bg-gray-50 min-h-screen font-custom2 pb-16">
      
      {/* HEADER SECTION WITH TOPIC GENERATION INPUT */}
      <header className="sticky top-0 bg-white border-b border-gray-200/80 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 shadow-xs">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold font-ar-one-sans text-gray-900 tracking-tight">Adaptive Learning Roadmap</h1>
          <p className="text-xs text-gray-400">Generate structured custom learning paths and tracking vectors for any technical domain.</p>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            placeholder="Enter topic (e.g., Docker, Kubernetes)..."
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition w-full sm:min-w-60"
          />
          <button
            onClick={handleGenerateRoadmap}
            disabled={loading || !topic.trim()}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition flex items-center gap-2 border-none cursor-pointer shrink-0 ${
              loading || !topic.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10"
            }`}
          >
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </div>
      </header>

      {/* ERROR HANDLER NOTIFICATION DISMISSAL ROW */}
      {error && (
        <div className="mx-8 mt-4 bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs font-mono">
          {error}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#1e2530] text-white border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Visual warning indicator row */}
            <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-custom font-bold text-gray-100 tracking-wide">Delete Roadmap</h3>
            </div>

            {/* Warning descriptive copy block */}
            <div className="flex flex-col gap-2.5">
              <p className="text-sm text-gray-300 leading-relaxed">
                Are you completely sure you want to delete this roadmap?
              </p>
            </div>

            {/* Interactive decision buttons matrix */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                  setIsDeleting(false);
                }}
                className={`
                  px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white font-medium text-sm rounded-xl transition cursor-pointer
                  ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={isDeleting}
                `}                
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRoadmap()}
                className={`
                  px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-md shadow-red-900/20
                  ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={isDeleting}
                `}
              >
                Permanently Delete
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CORE ROADMAP WORKSPACE */}
      <div className="max-w-200 mx-auto px-6 py-8 relative">

        {/* PREVIOUS ROADMAPS ARCHIVE GRID */}
        <div className="mb-14 pb-8 border-b border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold font-ar-one-sans text-gray-900 tracking-tight">Previous Roadmaps</h2>
            <span className="text-[10px] font-mono text-gray-400">{sortedPrevRoadmap.length} saved</span>
          </div>

          {prevLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-white border border-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sortedPrevRoadmap.length === 0 ? (
            <div className="py-10 border-2 border-dashed border-gray-200 bg-white rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-1">
              <span className="text-xs font-bold text-gray-700 font-mono uppercase tracking-tight">No Saved Roadmaps Yet</span>
              <p className="text-xs text-gray-400 max-w-xs">Generated roadmaps will appear here for quick preview later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPrevRoadmap.map((item, idx) => {
                const isActive = item.topic.toLowerCase() === activeTopic.toLowerCase();
                return (
                  <div
                    key={`${item.topic}-${idx}`}
                    className={`bg-white border rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-4 transition ${
                      isActive ? "border-blue-400 ring-2 ring-blue-50" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-gray-900 tracking-tight capitalize truncate">{item.topic}</h3>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md shrink-0">
                            Viewing
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 capitalize">{item.roadmap.current_level}</span>
                      <span className="text-[10px] font-mono text-gray-400">Updated {formatDate(item.updated_at)}</span>
                    </div>

                    {/* ACTIONS BUTTON BAR - RESPONDS FLUIDLY TO ALL VIEWPORTS */}
                    <div className="flex items-center gap-1.5 w-full mt-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => handlePreviewRoadmap(item)}
                        disabled={isActive}
                        title="Preview Roadmap"
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition border-none cursor-pointer ${
                          isActive
                            ? "bg-blue-50 text-blue-400 cursor-not-allowed"
                            : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      
                      <button
                        onClick={() => handleDownloadRoadmap(item)}
                        title="Download Roadmap"
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition border-none cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setDeleteTarget(item);
                        }}
                        title="Delete Roadmap"
                        className="p-1.5 text-[11px] font-bold rounded-lg transition border-none cursor-pointer bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div id="roadmap-capture-container" className="p-4 rounded-2xl">
          {/* TOP LEFT LEVEL INDICATOR */}
          {level && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="bg-white border border-gray-200 shadow-xs rounded-xl px-4 py-2.5 flex flex-col gap-0.5 self-start">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Current Level</span>
                <span className="text-xs font-extrabold text-blue-600 font-mono capitalize">{level}</span>
              </div>
              {activeTopic && (
                <span className="text-xs font-bold text-gray-500 font-mono self-start sm:self-auto">
                  Viewing: <span className="text-gray-800 capitalize">{activeTopic}</span>
                </span>
              )}
            </div>
          )}

          {/* SEQUENTIAL DRAW CONNECTOR TREE MAP */}
          {roadmap.length > 0 ? (
            <div className="relative pl-8 border-l-2 border-dashed border-gray-200 flex flex-col gap-8 ml-4">
              {roadmap
                .sort((a, b) => a.step - b.step)
                .map((stepItem, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-10.25 top-1.5 w-4 h-4 bg-blue-600 border-4 border-white rounded-full shadow-xs ring-4 ring-blue-50 z-10" />
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                          Step {stepItem.step}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                          {stepItem.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed pl-1">
                        {stepItem.description}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            !loading && (
              <div className="py-20 border-2 border-dashed border-gray-200 bg-white rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-1">
                <span className="text-xs font-bold text-gray-700 font-mono uppercase tracking-tight">No Active Path Loaded</span>
                <p className="text-xs text-gray-400 max-w-xs">Enter a topic above or provide parameters via navigation to render your adaptive journey tree.</p>
              </div>
            )
          )}

          {/* BOTTOM METRIC SUMMARY CARDS FOR SUMMARY ACTIONS */}
          {roadmap.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-8 border-t border-gray-200">
              
              {/* REVISION TOPICS METRIC CARD */}
              <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2.5 mb-3">
                  <span className="text-xs font-extrabold text-amber-800 font-mono uppercase tracking-wider">Revision Topics</span>
                </div>
                {revisionTopics.length > 0 ? (
                  <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                    {revisionTopics.map((revTopic, rIdx) => (
                      <li key={rIdx} className="text-xs text-amber-900 flex items-center gap-2 pl-1">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                        <span>{revTopic}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic pl-1">No pending revision domains mapped.</p>
                )}
              </div>

              {/* NEXT STEPS UPCOMING TOPICS CARD */}
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-emerald-200/50 pb-2.5 mb-3">
                  <span className="text-xs font-extrabold text-emerald-800 font-mono uppercase tracking-wider">Next Topics</span>
                </div>
                {nextTopics.length > 0 ? (
                  <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                    {nextTopics.map((nextTopic, nIdx) => (
                      <li key={nIdx} className="text-xs text-emerald-900 flex items-center gap-2 pl-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                        <span>{nextTopic}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic pl-1">No subsequent learning vectors scheduled.</p>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}