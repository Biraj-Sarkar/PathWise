import { useNavigate, useLocation } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ObjectId } from "bson";
import { Send, Sparkles, Plus, AlertCircle, Bot, User as UserIcon, Loader2 } from "lucide-react";
import {
  appendMessage,
  appendStreamToken,
  setLastAssistantMessage,
  setChatStatus,
  setChatError,
  createNewSessionSuccess,
  type MessageIntent,
} from "../utils/chatSlice.ts";
import { apiClient } from "../utils/apiClient.ts";

// These intents return a plain string answer — use the typewriter effect.
// All other intents return structured data handled differently.
const TEXT_INTENTS = new Set(["doubt", "followup"]);

// These intents navigate the user away to a dedicated page.
// We still store the user message in Redux (session history), but there's
// no assistant bubble to render in the chat — the page IS the response.
const NAVIGATE_INTENTS = new Set(["quiz", "roadmap", "opportunity"]);

export default function Playground() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const session_id = (location.state as { session_id?: string })?.session_id;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const activeSessionId = useSelector((state: any) => state.chat.activeSessionId);
  const messagesMap = useSelector((state: any) => state.chat.messages || {});
  const status = useSelector((state: any) => state.chat.status);
  const error = useSelector((state: any) => state.chat.error);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentMessages = activeSessionId ? messagesMap[activeSessionId] || [] : [];

  useEffect(() => {
    if (session_id && session_id !== activeSessionId) {
      dispatch({ type: "chat/setActiveSession", payload: session_id });
    }
  }, [session_id, activeSessionId, dispatch]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, status]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setChatError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || status !== "idle") return;

    const isNewSession = !activeSessionId;
    const targetSessionId: string = activeSessionId || new ObjectId().toString();
    const currentPrompt = input.trim();
    setInput("");

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      intent: "aiResponse" as MessageIntent,
      content: currentPrompt,
      timestamp: new Date().toISOString(),
    };

    if (isNewSession) {
      dispatch(
        createNewSessionSuccess({
          session_id: targetSessionId,
          topic: "General Stream",
          subtopic: currentPrompt.slice(0, 40),
          last_message_time: userMessage.timestamp,
          preview: currentPrompt,
        })
      );
    }

    dispatch(appendMessage({ sessionId: targetSessionId, message: userMessage }));

    // Placeholder only for non-navigate intents; for quiz/roadmap/opportunity
    // we navigate away so there's no bubble to populate.
    const placeholderAssistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      intent: "aiResponse" as MessageIntent,
      content: "",
      timestamp: new Date().toISOString(),
    };

    dispatch(setChatStatus("loading"));
    dispatch(appendMessage({ sessionId: targetSessionId, message: placeholderAssistantMessage }));

    try {
      const response = await apiClient(
        "/playground/intent",
        {
          method: "POST",
          body: JSON.stringify({ session_id: targetSessionId, message: currentPrompt }),
        },
        dispatch
      );

      if (response && response.ok) {
        const body = await response.json();
        // Backend shape: { intent, confidence, success, message, data: {...} }
        const intent: MessageIntent = body.intent || "aiResponse";
        const payload = body.data ?? {};

        if (TEXT_INTENTS.has(intent)) {
          // Build the full text string, then typewriter-stream it character by character.
          let fullReply = "";
          if (payload.answer) fullReply += payload.answer;
          if (payload.examples?.length) fullReply += `\n\nExamples:\n${payload.examples.join("\n")}`;
          if (payload.real_world_application) fullReply += `\n\nReal World Application:\n${payload.real_world_application}`;
          if (payload.additional_resources?.length) fullReply += `\n\nAdditional Resources:\n${payload.additional_resources.join("\n")}`;

          dispatch(setChatStatus("streaming"));

          let idx = 0;
          const interval = setInterval(() => {
            if (idx < fullReply.length) {
              dispatch(appendStreamToken({ sessionId: targetSessionId, token: fullReply.charAt(idx) }));
              idx++;
            } else {
              clearInterval(interval);
              dispatch(setChatStatus("idle"));
            }
          }, 8);

          if (fullReply.length === 0) dispatch(setChatStatus("idle"));

        } else if (intent === "example") {
          // Render the structured example list inline in the chat.
          dispatch(setLastAssistantMessage({ sessionId: targetSessionId, intent, content: payload }));
          dispatch(setChatStatus("idle"));

        } else if (NAVIGATE_INTENTS.has(intent)) {
          // These intents open a dedicated page. Drop the placeholder assistant
          // bubble and navigate — the destination page IS the response.
          dispatch(setLastAssistantMessage({
            sessionId: targetSessionId,
            intent,
            content: null, // placeholder cleared; bubble won't render
          }));
          dispatch(setChatStatus("idle"));

          switch (intent) {
            case "quiz":
              navigate("/quiz/attempt_quiz", { state: { quizData: payload } });
              break;
            case "roadmap":
              navigate("/roadmap", { state: { roadmapData: payload } });
              break;
            case "opportunity":
              navigate("/opportunities", { state: { filterCriteria: payload } });
              break;
          }

        } else {
          dispatch(setChatStatus("idle"));
        }
      } else {
        dispatch(setChatError("AI inference cycle broken. Please try again."));
        dispatch(setChatStatus("idle"));
      }
    } catch (err) {
      dispatch(setChatError("Runtime prompt pipeline interruption."));
      dispatch(setChatStatus("idle"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render the content inside an assistant bubble based on its intent.
  // Note: quiz/roadmap/opportunity are never rendered here — they navigate away.
  const renderAssistantContent = (msg: any) => {
    // Loading spinner while waiting for the API response
    if (msg.content === "" && status !== "idle") {
      return (
        <div className="flex items-center gap-1.5 text-gray-400 py-1 font-mono text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Inference queue processing...</span>
        </div>
      );
    }

    // Navigated-away intents: placeholder was cleared (content: null), render nothing.
    if (msg.content === null) return null;

    switch (msg.intent as MessageIntent) {
      case "doubt":
      case "followup":
        return <span className="whitespace-pre-wrap">{msg.content}</span>;

      case "example": {
        const examples = Array.isArray(msg.content?.examples)
          ? msg.content.examples
          : Array.isArray(msg.content)
          ? msg.content
          : [];
        if (examples.length === 0) return <span className="text-gray-400 text-xs italic">No examples returned.</span>;
        return (
          <div className="flex flex-col gap-4">
            {examples.map((ex: any, i: number) => (
              <div key={i} className="border-l-2 border-blue-300 pl-3 flex flex-col gap-1">
                <p className="font-bold text-xs text-gray-700">{ex.title}</p>
                <p className="text-sm">{ex.example}</p>
                {ex.explanation && <p className="text-xs text-gray-500">{ex.explanation}</p>}
                {ex.real_world_application && (
                  <p className="text-xs text-gray-400 italic">{ex.real_world_application}</p>
                )}
              </div>
            ))}
          </div>
        );
      }

      default:
        return typeof msg.content === "string"
          ? <span className="whitespace-pre-wrap">{msg.content}</span>
          : null;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-screen relative overflow-hidden font-custom2">
      <header className="h-14 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <h1 className="text-sm font-bold text-gray-800 font-ar-one-sans tracking-wide">
            {activeSessionId ? "AI Sandbox Context Node" : "Interactive Playground Workspace"}
          </h1>
        </div>
        {/* New Chat button — top-right corner of the header */}
        <button
          onClick={() => dispatch({ type: "chat/setActiveSession", payload: null })}
          className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </header>

      {error && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-2 flex items-center gap-2 text-rose-700 text-xs font-mono z-10">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
          <div className="w-full h-full flex justify-end items-center">
            <Loader2 
              className="w-4 h-4 text-rose-500 animate-spin shrink-0" 
              style={{
                animationDuration: "5s",
                animationIterationCount: 1,
                animationTimingFunction: "linear",
                animationFillMode: "forwards"
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col no-scrollbar bg-linear-to-b from-gray-50 to-white">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-end">
          {currentMessages.length === 0 ? (
            <div className="my-auto py-12 flex flex-col items-center text-center gap-4 animate-fadeIn">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100 shadow-xs">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold font-ar-one-sans text-gray-800 tracking-tight">
                  Accelerate Your Engineering Velocity
                </h2>
                <p className="text-xs text-gray-400 max-w-sm">
                  Query foundational structures, audit roadmap metrics, or launch specialized
                  ecosystem drills instantly.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-6">
                {[
                  "Explain graph data structure optimizations.",
                  "Help me debug an async task queue worker route.",
                  "What skills do I need for high-frequency trading roles?",
                  "Generate a dynamic mock system interview sequence.",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="p-3 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50/10 text-left rounded-2xl text-xs font-medium text-gray-700 transition duration-150 cursor-pointer shadow-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full pb-24">
              {currentMessages.map((msg: any) => {
                const isAI = msg.role === "assistant";
                // Don't render navigate-intent placeholders (content: null)
                if (isAI && msg.content === null) return null;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-4 w-full text-sm leading-relaxed animate-fadeIn ${
                      isAI ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isAI && (
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex flex-col max-w-[85%] gap-1">
                      <span
                        className={`text-[10px] font-mono tracking-wider font-bold text-gray-400 ${
                          !isAI ? "text-right" : ""
                        }`}
                      >
                        {isAI ? "PATHWISE COACH" : "DEVELOPER NODE"}
                      </span>
                      <div
                        className={`px-4 py-3 rounded-2xl font-custom2 ${
                          isAI
                            ? "bg-gray-100 text-gray-800 border border-gray-200/50 rounded-tl-xs"
                            : "bg-blue-600 text-white rounded-tr-xs shadow-md shadow-blue-600/10"
                        }`}
                      >
                        {isAI ? renderAssistantContent(msg) : msg.content}
                      </div>
                    </div>
                    {!isAI && (
                      <div className="w-8 h-8 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-white via-white/95 to-transparent pt-10 pb-6 px-4 z-10">
        <div className="max-w-3xl w-full mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="w-full bg-white border border-gray-300 rounded-2xl shadow-xl shadow-gray-200/50 flex flex-col focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition duration-150 overflow-hidden"
          >
            <div className="flex items-end px-4 py-3 gap-3">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  status !== "idle"
                    ? "AI Engine writing context..."
                    : "Message PathWise AI... (Press Enter to transmit)"
                }
                disabled={status !== "idle"}
                className="flex-1 bg-transparent border-none text-gray-800 focus:outline-none resize-none max-h-44 py-1 text-sm font-custom2 placeholder-gray-400 leading-relaxed no-scrollbar"
              />
              <button
                type="submit"
                disabled={!input.trim() || status !== "idle"}
                className={`p-2 rounded-xl shrink-0 transition flex items-center justify-center cursor-pointer border-none ${
                  input.trim() && status === "idle"
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="bg-gray-50 px-4 py-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Shift + Enter for line break</span>
              <span>Model Context: Advanced Engineering v2</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}