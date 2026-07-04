import { Target, Zap, ShieldCheck, Award } from "lucide-react";
import wcu from "../assets/wcu.png"; // Reusing the platform image asset for consistency

export default function WhyPathWiseSection() {
  return (
    <section id="why-pathwise-section" className="w-full bg-gray-800 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center gap-12 px-6 py-16">
        
        {/* Left-aligned Top Header Section */}
        <div className="w-full flex flex-col px-4 items-start justify-around gap-4">
          <span className="inline-block rounded-full border border-blue-500 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            ⭐ Why Choose Us
          </span>
          <h2 className="text-5xl font-custom leading-tight lg:text-6xl">
            The Difference PathWise Makes
          </h2>
          <h3 className="text-2xl font-custom2 text-gray-300">
            Traditional learning is static. We make it adaptive, conversational, and career-aligned.
          </h3>
        </div>

        {/* 3-Column Grid Layout (Left Cards | Center Image & CTA | Right Cards) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-center px-4 mt-4">
          
          {/* Left Column - Feature Stats Cards */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            {/* Card 1 */}
            <div className="bg-gray-700 border border-gray-600 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-6 h-6 text-blue-400" />
                <h4 className="text-xl font-bold tracking-wide">Hyper-Personalized</h4>
              </div>
              <p className="text-gray-300 font-custom2 text-lg leading-relaxed">
                Every prompt, response, and study roadmap matches your explicit knowledge level, interests, and domain goals.
              </p>
              <div className="mt-4 text-2xl font-bold text-blue-400">100% Custom</div>
            </div>

            {/* Card 2 */}
            <div className="bg-gray-700/50 border border-gray-600/60 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
                <h4 className="text-xl font-bold tracking-wide">Instant Feedback Loop</h4>
              </div>
              <p className="text-gray-300 font-custom2 text-lg leading-relaxed">
                No more waiting for assignment grading. Get continuous clarity updates on your quiz evaluations instantly.
              </p>
              <div className="mt-4 text-2xl font-bold text-purple-400">24/7 Availability</div>
            </div>
          </div>

          {/* Center Column - Focal Visual & Sub-Action Button */}
          <div className="flex flex-col items-center justify-center text-center gap-6 order-1 lg:order-2 py-4">
            <div className="relative group p-2 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-white/10 max-w-sm lg:max-w-full">
              {/* Decorative background glow behind center element */}
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
              
              <img
                src={wcu}
                alt="PathWise AI Centerpiece"
                className="w-full max-w-sm rounded-xl object-cover relative z-10 mx-auto border border-gray-600/40"
              />
            </div>
            
            <div className="z-10 mt-2">
              <p className="text-gray-300 font-custom2 text-lg italic">Curious to try it out?</p>
              <p className="text-sm text-gray-400 mb-4">Transform your study efficiency today.</p>
              <button 
                className="rounded-xl border border-purple-600 px-6 py-2.5 font-semibold text-purple-300 transition hover:bg-purple-600 hover:text-white cursor-pointer"
                onClick={() => document.getElementById("how-it-works-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Right Column - Success Stats Cards */}
          <div className="flex flex-col gap-6 order-3">
            {/* Card 3 */}
            <div className="bg-gray-700/50 border border-gray-600/60 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
                <h4 className="text-xl font-bold tracking-wide">Industry Validated</h4>
              </div>
              <p className="text-gray-300 font-custom2 text-lg leading-relaxed">
                Skill profiles map cleanly into direct career path suggestions that accurately match current technology markets.
              </p>
              <div className="mt-4 text-2xl font-bold text-purple-400">94% Accuracy</div>
            </div>

            {/* Card 4 */}
            <div className="bg-gray-700 border border-gray-600 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-blue-400" />
                <h4 className="text-xl font-bold tracking-wide">Mastery Focused</h4>
              </div>
              <p className="text-gray-300 font-custom2 text-lg leading-relaxed">
                Move past superficial rote memorization. Our interactive quizzes measure critical thinking and contextual application.
              </p>
              <div className="mt-4 text-2xl font-bold text-blue-400">4.9★ Engagement</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}