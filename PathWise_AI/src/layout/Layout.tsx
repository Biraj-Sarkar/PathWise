import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router";
import { setIntroStatus } from "../utils/introSlice";
import intro from "../assets/intro.mp4";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";

export default function Layout() {
  const dispatch = useDispatch();

  const [isFading, setIsFading] = useState(false);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  const showIntro = useSelector((state: any) => state.intro.showIntro);

  const handleVideoEnd = () => {
    setIsFading(true);
    setTimeout(() => {
      dispatch(setIntroStatus({ showIntro: false, timeout: Date.now() + 24 * 60 * 60 * 1000 }));
      setIsVideoFinished(true);
    }, 1000);
  };

  const isReadyToRenderContent = showIntro ? isVideoFinished : true;

  return (
    <>
      {showIntro && !isVideoFinished && (
        <div className={`
          fixed inset-0 bg-black flex justify-center items-center w-screen h-screen overflow-hidden z-50
          ${isFading ? 'animate-fade-out' : 'opacity-100'} transition-opacity duration-1000
        `}>
          <video
            src={intro}
            className="object-contain"
            autoPlay
            muted
            loop={false}
            playsInline
            onEnded={handleVideoEnd}
          />
        </div>
      )}

      {isReadyToRenderContent && (
        /* The main outer wrapper tracks the exact viewport height and prevents outer scrolling */
        <div className="w-full h-screen flex flex-row overflow-hidden animate-fade-in">
          
          {/* 1. Sidebar sits left, full height */}
          <Sidebar />

          {/* 2. Content container columns remaining width */}
          <div className="flex flex-col flex-1 h-full overflow-hidden relative">
            
            {/* 3. Navbar is fixed or positioned static at top of this flex container */}
            <Navbar />
            
            {/* 4. Main wrapper takes up the remaining height (h-[calc(100vh-4rem)]) and handles inner scroll */}
            <main className="flex-1 overflow-y-auto bg-gray-800 text-white">
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </>
  )
}