import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { ArrowRight, Sparkles, GraduationCap } from "lucide-react";

export default function FinalCTABanner() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const navigate = useNavigate();

  const handleActionClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section id="final-cta-section" className="w-full bg-gray-800 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-20">
        
        {/* Banner Layout Container */}
        <div className="
          w-full bg-gray-900 border border-gray-700 rounded-3xl p-8 md:p-12 lg:p-16 
          flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden shadow-2xl
        ">
          
          {/* Ambient Decorative Gradient Accents */}
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Side Content Column */}
          <div className="flex flex-col items-start gap-4 max-w-2xl z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400">
              <Sparkles className="w-4 h-4" /> Future-Proof Your Skills
            </span>
            
            <h2 className="text-4xl font-custom leading-tight md:text-5xl mt-2">
              Ready to Accelerate Your Learning Journey?
            </h2>
            
            <p className="text-xl font-custom2 text-gray-300 leading-relaxed">
              Join thousands of students and professionals using personalized roadmaps, adaptive testing modules, and live Gemini tutor sessions to master new domains.
            </p>
          </div>

          {/* Right Side Interaction Actions Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-stretch gap-4 shrink-0 w-full lg:w-auto z-10">
            <button
              onClick={handleActionClick}
              className="
                px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl 
                transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 
                shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 group
              "
            >
              <span>{isAuthenticated ? "Go to Dashboard" : "Get Started Now"}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })}
              className="
                px-8 py-4 border border-gray-600 hover:bg-gray-800 text-gray-300 hover:text-white 
                font-semibold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2
              "
            >
              <GraduationCap className="w-5 h-5" />
              <span>Explore Features</span>
            </button>
          </div>

          {/* Bottom Accent Highlight Line matching FeatureSection slider track palette */}
          <div className="w-full h-1.5 bg-linear-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] absolute bottom-0 left-0" />

        </div>

      </div>
    </section>
  );
}