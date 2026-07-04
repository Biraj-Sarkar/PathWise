import { useSelector } from "react-redux";
import { Award, BrainCircuit, Target, CheckCircle2, AlertTriangle, Globe } from "lucide-react";

export default function DashboardMetricsBar() {
  // Extract userProfile and userInfo safely from Redux store
  const userProfile = useSelector((state: any) => state.profile?.userProfile) || {};

  // Safely extract arrays with fallback defaults
  const skillsCount = Array.isArray(userProfile.skills) ? userProfile.skills.length : 0;
  const interestsCount = Array.isArray(userProfile.interests) ? userProfile.interests.length : 0;
  const careerGoalsCount = Array.isArray(userProfile.career_goals) ? userProfile.career_goals.length : 0;
  const strongTopicsCount = Array.isArray(userProfile.strong_topics) ? userProfile.strong_topics.length : 0;
  const weakTopicsCount = Array.isArray(userProfile.weak_topics) ? userProfile.weak_topics.length : 0;

  // Configuration for metric cards to iterate over cleanly
  const metrics = [
    {
      title: "Core Skills Tracked",
      value: skillsCount,
      subtitle: skillsCount > 0 ? `${userProfile.skills.slice(0, 2).join(", ")}${skillsCount > 2 ? "..." : ""}` : "No skills set",
      icon: Award,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Active Interests",
      value: interestsCount,
      subtitle: interestsCount > 0 ? `${userProfile.interests.slice(0, 2).join(", ")}${interestsCount > 2 ? "..." : ""}` : "No interests added",
      icon: BrainCircuit,
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Career Focus Vectors",
      value: careerGoalsCount,
      subtitle: careerGoalsCount > 0 ? userProfile.career_goals[0] : "Set a target role",
      icon: Target,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Strong Topics",
      value: strongTopicsCount,
      subtitle: "Validated Proficiencies",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-200/10",
    },
    {
      title: "Review Priority Areas",
      value: weakTopicsCount,
      subtitle: "Targeted Growth Nodes",
      icon: AlertTriangle,
      iconColor: "text-rose-400",
      bgColor: "bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Localization Profile",
      value: userProfile.preferred_language || "English",
      subtitle: userProfile.preferred_location || "Remote Vector",
      icon: Globe,
      iconColor: "text-cyan-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  return (
    <div className="w-full mt-6">
      {/* 6-column grid structure collapsing dynamically down to mobile devices */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between transition duration-200 hover:border-gray-700 shadow-xs"
            >
              {/* Header Icon Placement Row */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase truncate max-w-[80%]">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.bgColor} ${card.iconColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Numerical / Value Data Block */}
              <div className="flex flex-col gap-0.5 mt-auto">
                <span className="text-2xl font-mono font-bold text-white tracking-tight truncate">
                  {card.value}
                </span>
                <span className="text-xs text-gray-400 truncate max-w-full font-ar-one-sans">
                  {card.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}