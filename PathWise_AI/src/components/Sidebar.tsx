import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../utils/sidebarSlice.ts";
import { clearCredentials } from "../utils/authSlice.ts";
import { clearProfile } from "../utils/profileSlice.ts";
import { apiClient } from "../utils/apiClient.ts";
import { 
  LayoutDashboard, 
  User, 
  Terminal, 
  BrainCircuit, 
  Briefcase, 
  Compass,
  Settings, 
  X,
  LogOut,
  MessageSquare,
  BookOpen,
  EllipsisVertical,
  Trash2
} from "lucide-react";
import logo from "../assets/logo.png";

export default function Sidebar() {
  const isOpen = useSelector((state: any) => state.sidebar.isSidebarOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); 
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const isPlaygroundActive = isAuthenticated && location.pathname.startsWith("/playground");

  const chatSessions = useSelector((state: any) => state.chat.sessions || []);
  const activeSessionId = useSelector((state: any) => state.chat.activeSessionId);

  // Local UI State flags for Dropdown context and Deletion Modal target
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close context dropdown automatically if clicking elsewhere in DOM view
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuSessionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Profile", path: "/profile", icon: <User className="w-5 h-5" /> },
    { label: "Playground", path: "/playground", icon: <Terminal className="w-5 h-5" /> },
    { label: "Learning", path: "/learning", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Quiz", path: "/quiz", icon: <BrainCircuit className="w-5 h-5" /> },
    { label: "Career", path: "/opportunities", icon: <Briefcase className="w-5 h-5" /> },
    { label: "Roadmap", path: "/roadmap", icon: <Compass className="w-5 h-5" /> },
  ];

  // Dispatches network deletion request and wipes frontend redux configuration state
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);

    try {
      const response = await apiClient(`/chat-history/${sessionToDelete.session_id}`, {
        method: "DELETE"
      }, dispatch);

      if (response.ok) {
        // Redux Dispatch actions to drop entity arrays on frontend context
        dispatch({ type: "chat/deleteSession", payload: sessionToDelete.session_id });
        
        // Fallback cleanup if the current viewing stream was dropped
        if (activeSessionId === sessionToDelete.session_id) {
          dispatch({ type: "chat/clearActiveSession" });
        }
        
        setSessionToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete chat session context:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <aside 
        className={`
          bg-gray-800 text-white h-screen border-r border-gray-700/50
          flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-30
          ${isOpen ? "w-64 p-4 opacity-100 block" : "w-0 p-0 opacity-0 hidden"}
        `}
      >
        {/* 1. Header Segment */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-700/50">
          <button 
            className="flex items-center gap-3 cursor-pointer group bg-transparent border-none text-left"
            onClick={() => navigate("/")}
          >
            <img 
              src={logo} 
              alt="PathWise AI Logo" 
              className="w-9 h-9 rounded-full object-contain transition-transform duration-300 group-hover:rotate-6" 
            />
            <span className="text-lg font-bold font-mono tracking-wide bg-linear-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PathWise AI
            </span>
          </button>
          
          <button 
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer border-none"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Main Scrollable Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1.5 mt-6 overflow-y-auto no-scrollbar">
          <span className="px-3 text-[10px] font-bold font-mono tracking-widest text-gray-500 uppercase block mb-1">
            Core Platform
          </span>
          
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`
                  w-full px-3 py-3 rounded-xl flex items-center gap-3 font-medium text-sm
                  transition-all duration-200 group relative cursor-pointer border-none text-left
                  ${isActive 
                    ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full" />
                )}
                <div className={isActive ? "text-white" : "text-gray-400 group-hover:text-blue-400 transition-colors"}>
                  {item.icon}
                </div>
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}

          {/* Dynamic Contextual Segment: Recent Playground Streams */}
          {isPlaygroundActive && (
            <div className="mt-4 pt-4 border-t border-gray-700/30 flex flex-col gap-1">
              <span className="px-3 text-[10px] font-bold font-mono tracking-widest text-gray-500 uppercase block mb-1">
                Active Streams
              </span>
              
              <div className="max-h-48 overflow-y-auto no-scrollbar flex flex-col gap-1 px-1 relative">
                {chatSessions.length === 0 ? (
                  <span className="px-3 py-2 text-xs italic text-gray-500 font-custom2">
                    No previous active canvas
                  </span>
                ) : (
                  chatSessions.map((session: any) => {
                    const isSessionActive = activeSessionId === session.session_id;
                    const isMenuOpen = activeMenuSessionId === session.session_id;

                    return (
                      <div key={session.session_id} className="relative w-full group">
                        <button
                          onClick={() => {
                            dispatch({ type: "chat/setActiveSession", payload: session.session_id });
                          }}
                          className={`
                            w-full pl-2.5 pr-8 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium
                            transition-all duration-150 border-none text-left cursor-pointer truncate
                            ${isSessionActive 
                              ? "bg-gray-700 text-blue-400 font-semibold" 
                              : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/20"
                            }
                          `}
                        >
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSessionActive ? "text-blue-400" : "text-gray-500"}`} />
                          <span className="truncate tracking-wide w-full">
                            {session.subtopic || session.topic || "Untitled Workspace"}
                          </span>
                        </button>

                        {/* Actions Control Node Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuSessionId(isMenuOpen ? null : session.session_id);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-white hover:bg-gray-600 transition cursor-pointer border-none bg-transparent"
                          aria-label="Chat Actions"
                        >
                          <EllipsisVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Inline Context Menu Portal Dropdown */}
                        {isMenuOpen && (
                          <div 
                            ref={menuRef}
                            className="absolute right-2 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-1 z-50 min-w-27.5"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionToDelete(session);
                                setActiveMenuSessionId(null);
                              }}
                              className="w-full px-2.5 py-1.5 flex items-center gap-2 text-[11px] font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-md transition cursor-pointer border-none bg-transparent text-left"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Chat
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </nav>

        {/* 3. Lower Action Footer */}
        <div className="pt-4 border-t border-gray-700/50 flex flex-col gap-1.5">
          <span className="px-3 text-[10px] font-bold font-mono tracking-widest text-gray-500 uppercase block mb-1">
            Preferences
          </span>
          
          <button
            onClick={() => navigate("/settings")}
            className={`
              w-full px-3 py-3 rounded-xl flex items-center gap-3 font-medium text-sm
              transition-all duration-200 group border-none text-left cursor-pointer
              ${location.pathname === "/settings"
                ? "bg-blue-600 text-white" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
              }
            `}
          >
            <Settings className={`w-5 h-5 ${location.pathname === "/settings" ? "text-white" : "text-gray-400"}`} />
            <span className="tracking-wide">Settings</span>
          </button>

          <button
            onClick={async () => {
              await apiClient("/auth/logout", { method: "POST" }, dispatch);
              dispatch(clearCredentials());
              dispatch(clearProfile());
              navigate("/auth");
            }}
            className="w-full px-3 py-3 rounded-xl flex items-center gap-3 font-medium text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 border-none text-left cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            <span className="tracking-wide">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* GLOBAL MODAL COMPONENT: SESSION PURGE SYSTEM */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold tracking-tight">Delete Workspace Stream?</h3>
              <p className="text-xs text-gray-400 leading-normal">
                This will permanently delete <span className="text-gray-200 font-semibold font-mono">"{sessionToDelete.subtopic || sessionToDelete.topic || "Untitled Workspace"}"</span>. This database clearing vector cannot be reversed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                disabled={isDeleting}
                onClick={() => setSessionToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-transparent hover:bg-gray-800 transition cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteSession}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer border-none shadow-md shadow-rose-600/10 disabled:opacity-50"
              >
                {isDeleting ? "Purging..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}