import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

import heroImage from "../assets/heroImage.png";

export default function HeroSection() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const navigate = useNavigate();

  return (
    <section id="hero-section" className="w-full bg-gray-800 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-between gap-16 px-6 py-16 md:flex-row">
        {/* Left */}
        <div className="flex-1">
          <span className="inline-block rounded-full border border-blue-500 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            🤖 AI Powered Learning Platform
          </span>

          <h1 className="mt-6 text-5xl font-custom leading-tight lg:text-6xl">
            Learn Smarter with{" "}
            <span className="text-blue-500">AI</span>
          </h1>

          <h2 className="mt-4 text-3xl font-custom2 text-gray-200">
            Designed for Every Student
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-400">
            Personalized learning paths, adaptive quizzes,
            and career guidance—all in one platform.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button 
              className="rounded-xl bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700 cursor-pointer"
              onClick={() => (isAuthenticated ? navigate("/dashboard") : navigate("/auth"))}
            >
              Get Started
            </button>

            <button 
              className="rounded-xl border border-purple-600 px-8 py-3 font-semibold text-purple-300 transition hover:bg-purple-600 hover:text-white cursor-pointer"
              onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-gray-300">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>AI Tutor</span>
            </div>

            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Adaptive Quiz</span>
            </div>

            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Career Guidance</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-1 justify-center">
          <img
            src={heroImage}
            alt="AI Learning"
            className="w-full max-w-xl rounded-2xl"
          />
        </div>
      </div>
    </section>
  )
}