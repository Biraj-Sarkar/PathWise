import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  domain: string;
  content: string;
  avatarUrl?: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Alex Rivera",
    role: "Computer Science Undergraduate",
    domain: "Web Development",
    content: "The AI Tutor explained complex backend architectures using real-world analogies that my professors skipped over. It completely changed how I prepare for my engineering exams.",
    rating: 5
  },
  {
    name: "Sarah Jenkins",
    role: "Transitioning Professional",
    domain: "Data Science",
    content: "I didn't know where to start with Python until PathWise laid out a personalized career roadmap based on my interests. The adaptive quizzes felt like they knew exactly where my gaps were.",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Frontend Developer",
    domain: "React Ecosystem",
    content: "The interactive doubt solver helped me debug asynchronous state issues in seconds. It feels less like a basic bot and more like a senior engineer pair-programming right alongside you.",
    rating: 5
  },
  {
    name: "Elena Rostova",
    role: "High School Student",
    domain: "Foundational AI",
    content: "The quiz modules adapt to your speed. When I got stuck on linear algebra concepts, it immediately dropped the difficulty and offered mini-explanations before testing me again.",
    rating: 5
  }
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials-section" className="w-full bg-gray-800 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-center gap-16 px-6 py-16">
        
        {/* Left-aligned Top Section matching layout standards */}
        <div className="w-full flex flex-col px-4 items-start justify-around gap-4">
          <span className="inline-block rounded-full border border-purple-500 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400">
            🤝 Student Success
          </span>
          <h2 className="text-5xl font-custom leading-tight lg:text-6xl">
            Trusted by Learners
          </h2>
          <h3 className="text-2xl font-custom2 text-gray-300">
            See how intelligence is reshaping modern study habits
          </h3>
          <p className="max-w-xl text-gray-400">
            From clearing immediate doubts to navigating complete domain masteries, here is what real users are achieving.
          </p>
        </div>

        {/* Testimonials Grid Layout */}
        <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2 gap-6 p-3.5">
          {testimonials.map((t, index) => (
            <div 
              key={index} 
              className="
                bg-gray-700 border border-gray-600 p-8 rounded-lg
                flex flex-col justify-between gap-6 relative group
                shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
              "
            >
              {/* Background Quote Accent */}
              <Quote className="absolute right-6 top-6 w-12 h-12 text-gray-600/10 group-hover:text-blue-500/10 transition-colors duration-300 pointer-events-none" />

              {/* Star Rating Row */}
              <div className="flex items-center gap-1">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review Text Body */}
              <p className="text-gray-200 font-custom2 text-lg leading-relaxed z-10">
                "{t.content}"
              </p>

              {/* User Bio Footer */}
              <div className="flex items-center gap-4 mt-2 border-t border-gray-600/50 pt-4">
                {t.avatarUrl ? (
                  <img src={t.avatarUrl} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-gray-500" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-blue-500/30 flex items-center justify-center text-blue-400 font-bold tracking-wide">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
                <div className="flex flex-col">
                  <h4 className="font-bold tracking-wide text-white text-base">{t.name}</h4>
                  <p className="text-xs text-gray-400">{t.role}</p>
                  <span className="text-[10px] mt-1 font-mono px-2 py-0.5 bg-gray-800 rounded-md text-blue-400 border border-blue-500/20 self-start">
                    Focus: {t.domain}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}