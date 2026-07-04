import { useState, useEffect } from "react";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useDispatch, useSelector } from "react-redux";

import { silentRefresh } from "./utils/apiClient.ts";
import { hydrateChatData } from "./utils/chatSlice.ts";
import { apiClient } from "./utils/apiClient.ts";

import Home from "./pages/Home.tsx";
import Auth from "./pages/Auth.tsx";
import Layout from "./layout/Layout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import Playground from "./pages/Playground.tsx";
import Opportunity from "./pages/Opportunity.tsx";
import Quiz from "./pages/Quiz.tsx";
import AttemptQuiz from "./quiz/AttemptQuiz.tsx";
import Evaluation from "./quiz/Evaluation.tsx";
import Roadmap from "./pages/Roadmap.tsx";
import Settings from "./pages/Settings.tsx";
import Learning from "./pages/Learning.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/profile", element: <Profile /> },
      { path: "/playground", element: <Playground /> },
      { path: "/opportunities", element: <Opportunity /> },
      { path: "/quiz", element: <Quiz /> },
      { path: "/quiz/attempt_quiz", element: <AttemptQuiz /> },
      { path: "/quiz/:quiz_id", element: <Evaluation /> },
      { path: "/roadmap", element: <Roadmap /> },
      { path: "/settings", element: <Settings /> },
      { path: "/learning", element: <Learning /> }
    ]
  },
  {
    path: "/auth",
    element: <Auth />
  }
]);

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await silentRefresh(dispatch);
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const hydrateChatSessions = async () => {
        try {
          const response = await apiClient("/learning/chat-history", { method: "GET" }, dispatch);
          if (response && response.ok) {
            const body = await response.json();
            dispatch(hydrateChatData(body.data || body));
          }
        } catch (error) {
          console.error("Failed to fetch chat sessions:", error);
        }
      };

      hydrateChatSessions();
    }
  }, [isAuthenticated, dispatch]);

  if (loading) {
    return (
      <div className="bg-black w-screen h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white" />
      </div>
    )
  }

  return <RouterProvider router={router} />;
}

export default App
