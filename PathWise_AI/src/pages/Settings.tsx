import { Info, ShieldCheck, FileText, Code, GitBranch, AlertTriangle, HelpCircle, ExternalLink } from "lucide-react";

export default function Settings() {
  // Static versioning and configuration telemetry details
  const appMetrics = [
    { label: "PathWise AI Version", value: "v1.4.2" },
    { label: "Backend Version", value: "v1.4.0-release" },
    { label: "API Version", value: "v2.1.0" },
    { label: "AI Model", value: "Gemini 3.5 Flash" },
    { label: "Last Updated", value: "July 2026" },
    { label: "Database Status", value: "Healthy / Operational" },
  ];

  const links = [
    { label: "Privacy Policy", icon: ShieldCheck, href: "#" },
    { label: "Terms of Service", icon: FileText, href: "#" },
    { label: "Documentation", icon: Info, href: "#" },
    { label: "GitHub Repository", icon: GitBranch, href: "#" },
    { label: "Report a Bug", icon: AlertTriangle, href: "#" },
    { label: "Contact Support", icon: HelpCircle, href: "#" },
    { label: "Open Source Licenses", icon: Code, href: "#" },
  ];

  return (
    <div className="flex-1 bg-gray-50 min-h-screen font-custom2 pb-16">
      
      {/* HEADER HEADER BLOCK */}
      <header className="bg-white border-b border-gray-200/80 px-8 py-5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-175 mx-auto flex flex-col gap-0.5">
          <h1 className="text-sm font-bold text-gray-900 tracking-tight">System Configuration</h1>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">About & Environment Diagnostics</p>
        </div>
      </header>

      <div className="max-w-175 mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* SECTION: APPLICATION SUMMARY */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-wider">Application Information</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
            {appMetrics.map((metric, idx) => (
              <div key={idx} className="flex flex-col gap-1 border-b border-gray-50 pb-2 sm:border-none sm:pb-0">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">
                  {metric.label}
                </span>
                <span className={`text-xs font-bold ${metric.label === "Database Status" ? "text-emerald-600" : "text-gray-850"}`}>
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: LINKS MATRIX */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Code className="w-4 h-4 text-gray-700" />
            <h2 className="text-xs font-bold text-gray-900 font-mono uppercase tracking-wider">Resources & Support Links</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {links.map((link, idx) => {
              const Icon = link.icon;
              return (
                <a 
                  key={idx}
                  href={link.href}
                  className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1 group hover:text-blue-600 transition duration-150 decoration-none"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" />
                    <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition">
                      {link.label}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition" />
                </a>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}