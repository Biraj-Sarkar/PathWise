import { Bot, Mail, ArrowUpRight } from "lucide-react";
import logo from "../assets/logo.png";

export default function FooterSection() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-gray-900 text-white border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col gap-12">
        
        {/* Top Subsection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Brand Presentation Column */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <button 
              onClick={handleScrollToTop}
              className="flex items-center gap-3 cursor-pointer group animate-none bg-transparent p-0 border-none"
            >
              <img src={logo} alt="PathWise AI Logo" className="w-10 h-10 rounded-full object-contain transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-xl font-bold font-mono tracking-wide bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                PathWise AI
              </span>
            </button>
            <p className="font-custom2 text-gray-400 text-lg max-w-sm leading-relaxed">
              Empowering individuals to navigate domain masteries, build dynamic roadmaps, and interact with custom Gemini educator intelligence.
            </p>
          </div>

          {/* Quick Platform Jumps Navigation Column */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-bold font-mono tracking-widest text-blue-400 uppercase">Platform</h4>
            <ul className="flex flex-col gap-2.5 text-base text-gray-400 font-custom2">
              <li>
                <button onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition cursor-pointer flex items-center gap-1 bg-transparent p-0 border-none text-left">
                  Features <ArrowUpRight className="w-3 h-3 opacity-50" />
                </button>
              </li>
              <li>
                <button onClick={() => document.getElementById("how-it-works-section")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition cursor-pointer flex items-center gap-1 bg-transparent p-0 border-none text-left">
                  How It Works <ArrowUpRight className="w-3 h-3 opacity-50" />
                </button>
              </li>
              <li>
                <button onClick={() => document.getElementById("interactive-playground")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition cursor-pointer flex items-center gap-1 bg-transparent p-0 border-none text-left">
                  AI Playground <ArrowUpRight className="w-3 h-3 opacity-50" />
                </button>
              </li>
            </ul>
          </div>

          {/* Connect Details / Social Profiles Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="text-xs font-bold font-mono tracking-widest text-purple-400 uppercase">Connect With Us</h4>
            <p className="text-sm text-gray-400 font-custom2">Have questions about our adaptive learning ecosystems? Drop us a line.</p>
            
            <div className="flex items-center gap-3 mt-1">
              {/* GitHub SVG */}
              <a href="https://github.com/Biraj-Sarkar" target="_blank" rel="noreferrer" className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition shadow-sm flex items-center justify-center">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                </svg>
              </a>

              {/* X / Twitter SVG */}
              <a href="https://x.com/sarkarbiraj016" target="_blank" rel="noreferrer" className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition shadow-sm flex items-center justify-center">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn SVG */}
              <a href="https://www.linkedin.com/in/biraj-sarkar-29a141322" target="_blank" rel="noreferrer" className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition shadow-sm flex items-center justify-center">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* Mail (Kept from Lucide) */}
              <a href="mailto:biraj0016@gmail.com" className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition shadow-sm flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

        {/* Lower Meta Copyright Subsection Banner */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-mono">
          <div>
            &copy; {new Date().getFullYear()} PathWise AI. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-gray-600">
              Powered by <Bot className="w-3 h-3 text-blue-500/60" /> PathWise AI
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}