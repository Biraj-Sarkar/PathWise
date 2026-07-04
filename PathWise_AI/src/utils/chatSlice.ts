import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type MessageIntent =
  | "aiResponse"
  | "doubt"
  | "example"
  | "roadmap"
  | "quiz"
  | "opportunity"
  | "followup";

export interface Message {
  id: string;
  role: "user" | "assistant";
  intent: MessageIntent;
  content: any; // string for doubt/followup, structured object/array for example/quiz/opportunity/roadmap
  timestamp: string;
}

export interface ChatSession {
  session_id: string;
  topic: string;
  subtopic?: string;
  last_message_time?: string;
  preview?: string;
}

interface ChatState {
  sessions: ChatSession[];
  messages: Record<string, Message[]>; // Keyed by session_id
  activeSessionId: string | null;
  status: "idle" | "loading" | "streaming";
  error: string | null;
}

const initialState: ChatState = {
  sessions: [],
  messages: {},
  activeSessionId: null,
  status: "idle",
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Session Management Matrix
    hydrateChatData: (state, action: PayloadAction<Record<string, any[]>>) => {
      const incomingSessions = action.payload || {};

      const parsedSessions: ChatSession[] = [];
      const parsedMessages: Record<string, Message[]> = {};

      Object.entries(incomingSessions).forEach(([sessionId, msgs]) => {
        if (!sessionId || !msgs || msgs.length === 0) return;

        const chronologicalMessages = [...msgs]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map((msg) => ({
            id: msg.id || crypto.randomUUID(),
            // Backend persists sender as "user" | "assistant" (see services/learning.py)
            role: msg.sender === "assistant" ? ("assistant" as const) : ("user" as const),
            intent: (msg.intent || "aiResponse") as MessageIntent,
            content: msg.message,
            timestamp: msg.timestamp,
          }));

        parsedMessages[sessionId] = chronologicalMessages;

        const latestMsg = chronologicalMessages.length > 0 ? msgs[msgs.length - 1] : msgs[0];
        parsedSessions.push({
          session_id: sessionId,
          topic: latestMsg.topic || "General Stream",
          subtopic: latestMsg.subtopic || "",
          last_message_time: latestMsg.timestamp,
          preview: typeof latestMsg.message === "string" ? latestMsg.message : "",
        });
      });

      state.sessions = parsedSessions.sort(
        (a, b) => new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
      );
      state.messages = parsedMessages;
    },
    setActiveSession: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
    },

    // Used by the main Playground page — registers session AND sets it as active
    // so the chat view immediately shows the new conversation.
    createNewSessionSuccess: (state, action: PayloadAction<ChatSession>) => {
      const exists = state.sessions.some((s) => s.session_id === action.payload.session_id);
      if (!exists) {
        state.sessions.unshift(action.payload);
      }
      state.activeSessionId = action.payload.session_id;
      if (!state.messages[action.payload.session_id]) {
        state.messages[action.payload.session_id] = [];
      }
    },

    // Used by InteractivePlayground (home page) — registers the session in the
    // sidebar list WITHOUT changing activeSessionId. This way sessions started
    // from the home page show up in the sidebar when the user navigates to
    // /playground, but don't disrupt the current active session while they're
    // still on the home page.
    registerSessionSilent: (state, action: PayloadAction<ChatSession>) => {
      const exists = state.sessions.some((s) => s.session_id === action.payload.session_id);
      if (!exists) {
        state.sessions.unshift(action.payload);
      }
      if (!state.messages[action.payload.session_id]) {
        state.messages[action.payload.session_id] = [];
      }
      // activeSessionId intentionally NOT changed
    },

    // Message Logs Pipeline
    setMessagesForSession: (
      state,
      action: PayloadAction<{ sessionId: string; messages: Message[] }>
    ) => {
      const { sessionId, messages } = action.payload;
      state.messages[sessionId] = messages;
    },
    appendMessage: (
      state,
      action: PayloadAction<{ sessionId: string; message: Message }>
    ) => {
      const { sessionId, message } = action.payload;
      if (!state.messages[sessionId]) {
        state.messages[sessionId] = [];
      }
      state.messages[sessionId].push(message);

      // Sync preview in the sidebar session entry
      const session = state.sessions.find((s) => s.session_id === sessionId);
      if (session) {
        session.preview = typeof message.content === "string" ? message.content : session.preview;
        session.last_message_time = message.timestamp;
      }
    },

    // Stream Tokenizer Vectors (only for string content: doubt/followup)
    appendStreamToken: (
      state,
      action: PayloadAction<{ sessionId: string; token: string }>
    ) => {
      const { sessionId, token } = action.payload;
      const sessionMessages = state.messages[sessionId];
      if (sessionMessages && sessionMessages.length > 0) {
        const lastMessage = sessionMessages[sessionMessages.length - 1];
        if (lastMessage.role === "assistant" && typeof lastMessage.content === "string") {
          lastMessage.content += token;
        }
      }
    },

    // Directly set the full content + intent of the last assistant message.
    // Used for structured intents (example/quiz/opportunity/roadmap) that
    // shouldn't be typewriter-streamed since their payload isn't a flat string.
    setLastAssistantMessage: (
      state,
      action: PayloadAction<{ sessionId: string; intent: MessageIntent; content: any }>
    ) => {
      const { sessionId, intent, content } = action.payload;
      const sessionMessages = state.messages[sessionId];
      if (sessionMessages && sessionMessages.length > 0) {
        const lastMessage = sessionMessages[sessionMessages.length - 1];
        if (lastMessage.role === "assistant") {
          lastMessage.intent = intent;
          lastMessage.content = content;
        }
      }
    },

    // Runtime Engine States
    setChatStatus: (state, action: PayloadAction<"idle" | "loading" | "streaming">) => {
      state.status = action.payload;
    },
    setChatError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearChatWorkspace: (state) => {
      state.sessions = [];
      state.messages = {};
      state.activeSessionId = null;
      state.status = "idle";
      state.error = null;
    },
    deleteSession: (state, action) => {
      state.sessions = state.sessions.filter(
        (session: any) => session.session_id !== action.payload
      );
    },
    clearActiveSession: (state) => {
      state.activeSessionId = null;
    }
  },
});

export const {
  hydrateChatData,
  setActiveSession,
  createNewSessionSuccess,
  registerSessionSilent,
  setMessagesForSession,
  appendMessage,
  appendStreamToken,
  setLastAssistantMessage,
  setChatStatus,
  setChatError,
  clearChatWorkspace,
} = chatSlice.actions;

export default chatSlice.reducer;