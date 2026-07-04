import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { ObjectId } from "bson";
import { Bot, Brain, Briefcase, Sparkles, Send, Terminal, Loader2, Lock } from "lucide-react";

import { apiClient } from "../utils/apiClient.ts";
import {
  registerSessionSilent,
  appendMessage,
  type MessageIntent,
} from "../utils/chatSlice.ts";

type TabKey = "tutor" | "quiz" | "career";

interface PlaygroundTab {
  id: TabKey;
  label: string;
  icon: React.ReactNode;
  promptPlaceholder: string;
}

const tabs: PlaygroundTab[] = [
  {
    id: "tutor",
    label: "AI Tutor",
    icon: <Bot className="w-5 h-5" />,
    promptPlaceholder: "Explain quantum computing like I'm 5 years old...",
  },
  {
    id: "quiz",
    label: "Adaptive Quiz",
    icon: <Brain className="w-5 h-5" />,
    promptPlaceholder: "Generate a quiz question on React Hooks...",
  },
  {
    id: "career",
    label: "Career AI",
    icon: <Briefcase className="w-5 h-5" />,
    promptPlaceholder: "I know Python and love automation. What careers fit me?",
  },
];

// Map tab IDs to a readable topic label stored in the session
const TAB_TOPIC: Record<TabKey, string> = {
  tutor: "AI Tutor",
  quiz: "Adaptive Quiz",
  career: "Career AI",
};

export default function InteractivePlayground() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<TabKey>("tutor");
  const [userInput, setUserInput] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const currentTabData = tabs.find((t) => t.id === activeTab)!;

  useEffect(() => {
    setUserInput(currentTabData.promptPlaceholder);
    setDisplayedResponse("");
  }, [activeTab]);

  const handleAISubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated || isGenerating) return;

    setIsGenerating(true);
    setDisplayedResponse("");

    // Generate the session id here so we can store messages in Redux
    // and send the same id to the backend for conversation history.
    const sessionId = new ObjectId().toString();
    const messageTimestamp = new Date().toISOString();

    // Register the session silently — adds to the sidebar without changing
    // activeSessionId, so the home page view is unaffected. The session will
    // be visible when the user navigates to /playground.
    dispatch(
      registerSessionSilent({
        session_id: sessionId,
        topic: TAB_TOPIC[activeTab],
        subtopic: userInput.slice(0, 40),
        last_message_time: messageTimestamp,
        preview: userInput,
      })
    );

    // Store the user's message in Redux for session history
    dispatch(
      appendMessage({
        sessionId,
        message: {
          id: crypto.randomUUID(),
          role: "user",
          intent: "aiResponse" as MessageIntent,
          content: userInput,
          timestamp: messageTimestamp,
        },
      })
    );

    try {
      const response = await apiClient(
        "/playground/intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: userInput }),
        },
        dispatch
      );

      if (!response.ok) throw new Error("API Execution Failed");

      const data = await response.json();
      // Backend shape: { intent, confidence, success, message, data: {...} }
      const intent: string = data.intent;
      const payload = data.data ?? {};

      // Store the assistant's response in Redux as well
      dispatch(
        appendMessage({
          sessionId,
          message: {
            id: crypto.randomUUID(),
            role: "assistant",
            intent: (intent || "aiResponse") as MessageIntent,
            content: payload,
            timestamp: new Date().toISOString(),
          },
        })
      );

      switch (intent) {
        case "doubt":
        case "followup": {
          const answer = payload.answer ?? "";
          const examples: string[] = payload.examples ?? [];
          const realWorldApp: string = payload.real_world_application ?? "";
          const additionalResources: string[] = payload.additional_resources ?? [];

          if (!answer) {
            setDisplayedResponse("❌ Incomplete response from the AI model. Please try again.");
            break;
          }

          let displayText = `Answer:\n${answer}`;
          if (examples.length) displayText += `\n\nExamples:\n${examples.join("\n")}`;
          if (realWorldApp) displayText += `\n\nReal World Application:\n${realWorldApp}`;
          if (additionalResources.length) displayText += `\n\nAdditional Resources:\n${additionalResources.join("\n")}`;

          setDisplayedResponse(displayText);
          break;
        }

        case "example": {
          // payload is the examples array from generate_example → data.data
          const examples: any[] = Array.isArray(payload) ? payload : (payload.examples ?? []);
          if (!examples.length) {
            setDisplayedResponse("❌ No examples returned from the AI model. Please try again.");
            break;
          }

          let displayText = "Examples:\n\n";
          examples.forEach((ex: any, index: number) => {
            displayText += `Example ${index + 1}:\n`;
            displayText += `  Title: ${ex.title}\n`;
            displayText += `  Example: ${ex.example}\n`;
            displayText += `  Explanation: ${ex.explanation}\n`;
            if (ex.real_world_application) {
              displayText += `  Real World Application: ${ex.real_world_application}\n`;
            }
            displayText += "\n";
          });

          setDisplayedResponse(displayText);
          break;
        }

        case "quiz": {
          // payload = data.data from generate_quiz, which is the full quiz object
          if (!payload || !payload.quiz_id) {
            setDisplayedResponse("❌ No quiz data returned from the AI model. Please try again.");
            break;
          }
          navigate("/quiz/attempt_quiz", { state: { quizData: payload } });
          break;
        }

        case "opportunity": {
          // payload = filter_criteria object from opportunity_filter → data.data
          const filterCriteria: Record<string, unknown> = payload ?? {};
          if (Object.keys(filterCriteria).length === 0) {
            setDisplayedResponse("❌ No filter criteria returned from the AI model. Please try again.");
            break;
          }
          navigate("/opportunities", { state: { filterCriteria } });
          break;
        }

        case "roadmap": {
          // payload = data.data from get_learning_roadmap, which contains { topic, roadmap }
          if (!payload) {
            setDisplayedResponse("❌ No roadmap data returned. Please try again.");
            break;
          }
          navigate("/roadmap", { state: { roadmapData: payload } });
          break;
        }

        default:
          setDisplayedResponse(payload.answer ?? "No response from the AI model.");
      }
    } catch (error) {
      setDisplayedResponse("❌ Error communicating with Server. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="interactive-playground" className="w-full bg-gray-800 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center gap-16 px-6 py-16">

        {/* Header */}
        <div className="w-full flex flex-col px-4 items-start justify-around gap-4">
          <span className="inline-block rounded-full border border-blue-500 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            ✨ Instant Preview
          </span>
          <h2 className="text-5xl font-custom leading-tight lg:text-6xl">
            Test Drive the Intelligence
          </h2>
          <h3 className="text-2xl font-custom2 text-gray-300">
            Experience our backend AI tutor natively
          </h3>
          <p className="max-w-xl text-gray-400">
            Select a learning track below to run direct contextual prompts against our educator pipeline.
          </p>
        </div>

        {/* Playground Layout with Auth Wrapper */}
        <div className="w-full h-fit grid grid-cols-1 lg:grid-cols-12 gap-8 p-3.5 relative">

          {/* Auth blur overlay */}
          {!isAuthenticated && (
            <div className="absolute inset-0 z-20 rounded-2xl bg-gray-900/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 border border-gray-700/50">
              <div className="bg-gray-800/80 p-8 rounded-2xl border border-gray-600 max-w-md shadow-2xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold tracking-wide">Unlock the Playground</h4>
                  <p className="text-sm font-custom2 text-gray-300 mt-1 leading-relaxed">
                    Sign up or log into your account to process live queries against our Gemini educator models.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/auth")}
                  className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all duration-300 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Sign In to Access
                </button>
              </div>
            </div>
          )}

          {/* Left Column: Tab Controls */}
          <div className="lg:col-span-4 flex flex-col gap-4 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                disabled={!isAuthenticated}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full p-4 rounded-xl flex items-center gap-4 border text-left transition-all duration-300
                  ${isAuthenticated ? "cursor-pointer" : "cursor-not-allowed"}
                  ${activeTab === tab.id && isAuthenticated
                    ? "bg-gray-700 border-blue-500 shadow-lg scale-102"
                    : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
                  }
                `}
              >
                <div className={`p-2.5 rounded-lg ${activeTab === tab.id && isAuthenticated ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-400"}`}>
                  {tab.icon}
                </div>
                <div>
                  <h4 className="font-bold tracking-wide">{tab.label}</h4>
                  <p className="text-xs text-gray-400 font-custom2">Change AI context path</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Terminal Console */}
          <div className="lg:col-span-8 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-100">
            <div className="bg-gray-950 px-4 py-3 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 ml-2 font-mono flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> main-playground.sh
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 bg-green-950/40 text-green-400 border border-green-900/50 rounded">
                SECURE
              </span>
            </div>

            <form onSubmit={handleAISubmit} className="p-4 border-b border-gray-800 bg-gray-900/50 flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={!isAuthenticated}
                placeholder="Ask our AI anything..."
                className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-blue-500 text-gray-200 disabled:opacity-50"
                required
              />
              <button
                type="submit"
                disabled={isGenerating || !isAuthenticated}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white p-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 min-w-12"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>

            <div className="p-6 flex-1 font-mono text-sm leading-relaxed overflow-y-auto max-h-75 flex flex-col gap-4">
              {!displayedResponse && !isGenerating && (
                <div className="text-gray-500 italic flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Type your query and hit enter to stream a real response...
                </div>
              )}
              {(displayedResponse || isGenerating) && (
                <div className="text-gray-300 whitespace-pre-line bg-gray-950/50 border border-gray-800 p-4 rounded-xl">
                  <span className="text-blue-400 font-bold block mb-1">✨ SYSTEM RESPONSE:</span>
                  {displayedResponse}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}