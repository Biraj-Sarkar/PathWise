import { Lightbulb, PenTool, TrendingUp, Sparkles } from "lucide-react";

interface Step {
  number: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Pick Your Path",
    icon: <Lightbulb className="w-10 h-10 text-blue-400" />,
    description: "Tell the AI what you want to learn, your target domain, or your career goals to generate a personalized roadmap."
  },
  {
    number: "02",
    title: "Learn & Interact",
    icon: <Sparkles className="w-10 h-10 text-blue-400" />,
    description: "Engage with the AI Tutor to unpack complex subjects, ask questions, and explore interactive explanations."
  },
  {
    number: "03",
    title: "Test Your Mastery",
    icon: <PenTool className="w-10 h-10 text-blue-400" />,
    description: "Take dynamically generated adaptive quizzes that challenge you at your current skill level and give instant grading."
  },
  {
    number: "04",
    title: "Grow & Succeed",
    icon: <TrendingUp className="w-10 h-10 text-blue-400" />,
    description: "Track your progress metrics and receive tailored career advice based on the exact skills you've mastered."
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works-section" className="w-full bg-gray-800 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center gap-16 px-6 py-16">
        
        {/* Left-aligned Top Section */}
        <div className="w-full flex flex-col px-4 items-start justify-around gap-4">
          <span className="inline-block rounded-full border border-purple-500 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400">
            🚀 Simple 4-Step Process
          </span>
          <h2 className="text-5xl font-custom leading-tight lg:text-6xl">
            How It Works
          </h2>
          <h3 className="text-2xl font-custom2 text-gray-300">
            Everything you need to succeed with AI
          </h3>
          <p className="max-w-xl text-gray-400">
            Your journey from curiosity to career readiness, guided entirely by intelligence.
          </p>
        </div>

        {/* Steps Grid Layout */}
        <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-3.5 relative">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="
                bg-gray-700 border border-gray-600 p-6 rounded-lg
                flex flex-col gap-6 relative overflow-hidden group
                shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
              "
            >
              {/* Background Step Number Accent */}
              <div className="absolute -right-4 -bottom-6 text-8xl font-black text-gray-600/10 select-none group-hover:text-blue-500/10 transition-colors duration-300">
                {step.number}
              </div>

              {/* Icon Container */}
              <div className="flex items-center justify-between">
                <div className="
                  flex h-12 w-12 items-center justify-center rounded-xl 
                  bg-linear-to-br from-blue-500/20 to-violet-500/20
                  ring-1 ring-blue-500/30
                ">
                  {step.icon}
                </div>
                <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">
                  Step {step.number}
                </span>
              </div>

              {/* Title & Description */}
              <div className="flex flex-col gap-2 z-10">
                <h4 className="text-xl font-bold tracking-wide">{step.title}</h4>
                <p className="text-gray-300 font-custom2 text-lg leading-relaxed mt-1">
                  {step.description}
                </p>
              </div>

              {/* Subtle interactive accent line at the bottom */}
              <div className="w-full h-1 bg-gray-600 group-hover:bg-linear-to-r group-hover:from-blue-500 group-hover:to-purple-500 absolute bottom-0 left-0 transition-all duration-300" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}