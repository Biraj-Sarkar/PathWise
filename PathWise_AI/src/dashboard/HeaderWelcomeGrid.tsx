import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Sparkles, Flame, Sliders } from "lucide-react";

export default function HeaderWelcomeGrid() {
  const navigate = useNavigate();
  
  // Extracting details securely from Redux slice state structures
  const userInfo = useSelector((state: any) => state.auth?.userInfo) || { name: "Learner" };
  const userProfile = useSelector((state: any) => state.profile?.userProfile) || {};

  // Extract initials for the modern fallback profile ring block
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xs">
      
      {/* Ambient background decoration element to balance focus highlights */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Left side info block structure */}
      <div className="flex items-center gap-5 z-10">
        {/* Dynamic Avatar Container Node */}
        {userInfo.avatar ? (
          <img 
            src={userInfo.avatar} 
            alt={userInfo.name} 
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-inner" 
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 ring-2 ring-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold tracking-wider shrink-0 font-mono">
            {getInitials(userInfo.name)}
          </div>
        )}

        {/* Text Block Content Column */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-ar-one-sans font-bold tracking-wide text-white">
              Welcome back, {userInfo.name}!
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Premium AI Tier
            </span>
          </div>
          
          <p className="text-sm font-ar-one-sans text-gray-400 max-w-xl leading-relaxed">
            Ready to continue? Your AI models are synced to your target field: <span className="text-blue-400 font-semibold">{userProfile.education_level || "General Track"}</span>.
          </p>
        </div>
      </div>

      {/* Right side activity tracking block column */}
      <div className="flex items-center sm:justify-start md:justify-end gap-3 w-full md:w-auto shrink-0 border-t border-gray-800/80 pt-4 md:border-none md:pt-0 z-10">
        
        {/* Metric Node Block 1: Daily Continuous Streak */}
        <div className="flex items-center gap-3 bg-gray-800/40 border border-gray-800 px-4 py-3 rounded-xl shadow-xs">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400">
            <Flame className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Streak</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5">{userInfo.streak} {userInfo.streak === 1 ? "Day" : "Days"}</span>
          </div>
        </div>

        {/* Interaction Action Link */}
        <button
          onClick={() => navigate("/profile")}
          className="
            p-3.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 
            hover:text-white transition cursor-pointer flex items-center justify-center 
            shadow-xs hover:shadow-md hover:-translate-y-0.5 duration-200
          "
          title="Adjust Learning Preferences"
        >
          <Sliders className="w-5 h-5" />
        </button>

      </div>

    </div>
  );
}