import { Bot, Brain, Briefcase, ChartColumn, ArrowRight } from "lucide-react";

const cards: Map<string, { icon: React.ReactNode; description: string }> = new Map([
  [
    "AI TUTOR",
    {
      icon: <Bot className="w-10 h-10 text-blue-400" />,
      description: "Get instant explanations and personalized learning support 24/7."
    }
  ],
  [
    "ADAPTIVE QUIZ",
    {
      icon: <Brain className="w-10 h-10 text-blue-400" />,
      description: "Questions automatically adjust to your knowledge level."
    }
  ],
  [
    "CAREER GUIDANCE",
    {
      icon: <Briefcase className="w-10 h-10 text-blue-400" />,
      description: "Discover career paths, job opportunities, and learning opportunities."
    }
  ],
  [
    "PROGRESS TRACKING",
    {
      icon: <ChartColumn className="w-10 h-10 text-blue-400" />,
      description: "Visualize your learning journey and track your progress over time."
    }
  ]
]);

export default function FeatureSection() {
  return (
    <section id="features-section" className="w-full bg-gray-800 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center gap-16 px-6 py-16">
        
        {/* Left-aligned Top Section with Feature Badge */}
        <div className="w-full flex flex-col px-4 items-start justify-around gap-4">
          <span className="inline-block rounded-full border border-blue-500 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            ⚡ Powerful Ecosystem
          </span>
          <h1 className="text-5xl font-custom leading-tight lg:text-6xl">
            Features
          </h1>
          <h2 className="text-2xl font-custom2 text-gray-300">
            Everything you need to succeed with AI
          </h2>
          <p className="max-w-xl text-gray-400">
            Discover intelligent tools designed to help you learn, practice, and grow.
          </p>
        </div>

        {/* Features Grid Layout */}
        <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2 gap-6 p-3.5">
          {Array.from(cards.entries()).map(([title, { icon, description }]) => (
            <div 
              key={title} 
              className="
                bg-gray-700 border border-gray-600 p-6 rounded-lg
                flex flex-col justify-around gap-8
                hover:bg-gray-600 hover:scale-102 group
                shadow-lg hover:shadow-2xl transition-all duration-300
              "
            >
              <div className="flex items-center gap-4">
                <div className="
                  flex h-12 w-12 items-center justify-center rounded-xl 
                  bg-linear-to-br from-blue-500/20 to-violet-500/20
                  ring-1 ring-blue-500/30
                ">
                  {icon}
                </div>
                <h3 className="text-xl font-bold tracking-wide">{title}</h3>
              </div>
              
              <p className="text-gray-300 font-custom2 text-lg leading-relaxed mt-2">
                {description}
              </p>
              
              {/* Slider Track Line Accent */}
              <div className="w-full h-8 bg-linear-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] rounded-full relative px-0.5 overflow-hidden">
                <div className="absolute left-0.5 top-0 bottom-0 my-auto h-7 w-7 flex items-center justify-center transition-all duration-1000 ease-in-out group-hover:left-[calc(100%-2rem)]">
                  <ArrowRight />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}