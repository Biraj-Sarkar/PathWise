import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { 
  Briefcase, GraduationCap, Trophy, Search, RefreshCw, X, AlertCircle, 
  MapPin, Globe, Loader2, Award, Calendar, BookOpen, ChevronRight,
  Sparkles, MonitorPlay, Users, Code
} from "lucide-react";
import { apiClient } from "../utils/apiClient.ts";

type FilterCriteria = {
  keywords?: string[];
  opportunity_types?: string[];
  domains?: string[];
  locations?: string[];
  modes?: string[];
};

// 1. Array matching your explicit backend Enum values perfectly
const AVAILABLE_OPPORTUNITY_TYPES = [
  "Scholarship",
  "Internship",
  "Hackathon",
  "Job",
  "Course",
  "Certification",
  "Competition",
  "Workshop",
  "Bootcamp"
];

export default function Opportunity() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
	const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  const filterCriteria = (location.state as { filterCriteria?: FilterCriteria } | null)?.filterCriteria || {};

  // Loading & temporary fading error variables
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter criteria array blocks
  const [keywords, setKeywords] = useState<string[]>([]);
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]); // Will contain exact backend strings
  const [domains, setDomains] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);

  // Input fields tracking states for tag insertions
  const [inputKeywords, setInputKeywords] = useState("");
  const [inputLocations, setInputLocations] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Opportunity dataset nodes
  const [careerGuidance, setCareerGuidance] = useState<Record<string, any> | null>(null);
  const [internships, setInternships] = useState<any[] | null>(null);
  const [jobs, setJobs] = useState<any[] | null>(null);
  const [courses, setCourses] = useState<any[] | null>(null);
  const [certifications, setCertifications] = useState<any[] | null>(null);
  const [hackathons, setHackathons] = useState<any[] | null>(null);
  const [competitions, setCompetitions] = useState<any[] | null>(null);
  const [scholarships, setScholarships] = useState<any[] | null>(null);
  const [bootcamps, setBootcamps] = useState<any[] | null>(null);
  const [workshops, setWorkshops] = useState<any[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Safe Extraction Effect mapping potential variations safely
  useEffect(() => {
    if (filterCriteria) {
      if (filterCriteria.keywords) setKeywords(filterCriteria.keywords);
      if (filterCriteria.domains) setDomains(filterCriteria.domains);
      if (filterCriteria.locations) setLocations(filterCriteria.locations);
      if (filterCriteria.modes) setModes(filterCriteria.modes);
      
      if (filterCriteria.opportunity_types) {
        // Safe mapping to ensure matching case transformations on extraction
        const normalizedTypes = filterCriteria.opportunity_types.map(t => {
          const match = AVAILABLE_OPPORTUNITY_TYPES.find(enumVal => enumVal.toLowerCase() === t.toLowerCase());
          return match || t;
        });
        setOpportunityTypes(normalizedTypes);
      }
    }
  }, [filterCriteria]);

  // TIMEOUT FAULT SYSTEM: Auto-evicts visible validation toast elements
  useEffect(() => {
    if (error) {
      const errorTimer = setTimeout(() => {
        setError(null);
      }, 6000);
      return () => clearTimeout(errorTimer);
    }
  }, [error]);

  // Fetch cached opportunity data on load
  useEffect(() => {
    const fetchCachedData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient("/opportunities/cached", { method: "GET" }, dispatch);
        const data = await response.json();
        const recommendations = data.data || data;

        if (response.ok) {
          setCareerGuidance(recommendations.career_guidance || null);
          setInternships(recommendations.internships || []);
          setJobs(recommendations.jobs || []);
          setCourses(recommendations.courses || []);
          setCertifications(recommendations.certifications || []);
          setHackathons(recommendations.hackathons || []);
          setCompetitions(recommendations.competitions || []);
          setScholarships(recommendations.scholarships || []);
          setBootcamps(recommendations.bootcamps || []);
          setWorkshops(recommendations.workshops || []);
        } else {
          setError(data.message || "Failed to fetch cached opportunity data");
        }        
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching cached opportunity data");
      } finally {
        setLoading(false);
      }
    };

    fetchCachedData();
  }, [dispatch]);

  // Populate dynamic engine pipeline search criteria matching specifications
  const populateOpportunityData = async () => {
    setLoading(true);
    setError(null);

    const finalKeywords = [...keywords];
    if (inputKeywords.trim()) {
      finalKeywords.push(...inputKeywords.split(",").map(k => k.trim()).filter(Boolean));
    }

    const finalLocations = [...locations];
    if (inputLocations.trim()) {
      finalLocations.push(...inputLocations.split(",").map(l => l.trim()).filter(Boolean));
    }

    const hasNoFilters = finalKeywords.length === 0 && opportunityTypes.length === 0 && domains.length === 0 && finalLocations.length === 0 && modes.length === 0;

    if (hasNoFilters) {
      try {
        await apiClient("/opportunities/refresh", { method: "POST" }, dispatch);
        const response = await apiClient("/opportunities/cached", { method: "GET" }, dispatch);
        const data = await response.json();

        if (response.ok) {
          setCareerGuidance(data.career_guidance || null);
          setInternships(data.internships || []);
          setJobs(data.jobs || []);
          setCourses(data.courses || []);
          setCertifications(data.certifications || []);
          setHackathons(data.hackathons || []);
          setCompetitions(data.competitions || []);
          setScholarships(data.scholarships || []);
          setBootcamps(data.bootcamps || []);
          setWorkshops(data.workshops || []);
        } else {
          setError(data.message || "Failed to refresh opportunity data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while refreshing opportunity data");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const response = await apiClient(`/opportunities/search`, {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            types: opportunityTypes, // e.g. ["Internship", "Hackathon"]
            keywords: finalKeywords,
            domains: domains,
            locations: finalLocations,
            modes: modes
          })
        }, dispatch);
        
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.message || "Failed to populate opportunity data");
          return;
        }
        
        const targetList = Array.isArray(data.data) ? data.data : [];
        if (targetList) {
          setInternships(targetList.filter((item: any) => item.type?.toLowerCase() === "internship"));
          setJobs(targetList.filter((item: any) => item.type?.toLowerCase() === "job"));
          setCourses(targetList.filter((item: any) => item.type?.toLowerCase() === "course"));
          setCertifications(targetList.filter((item: any) => item.type?.toLowerCase() === "certification"));
          setHackathons(targetList.filter((item: any) => item.type?.toLowerCase() === "hackathon"));
          setCompetitions(targetList.filter((item: any) => item.type?.toLowerCase() === "competition"));
          setScholarships(targetList.filter((item: any) => item.type?.toLowerCase() === "scholarship"));
          setBootcamps(targetList.filter((item: any) => item.type?.toLowerCase() === "bootcamp"));
          setWorkshops(targetList.filter((item: any) => item.type?.toLowerCase() === "workshop"));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while populating opportunity data");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    populateOpportunityData();
  };

  const appendFilterToken = (val: string, target: "keys" | "locs") => {
    const items = val.split(",").map(v => v.trim()).filter(Boolean);
    
    if (target === "keys") {
      setKeywords(prev => [...new Set([...prev, ...items])]);
      setInputKeywords("");
    } else {
      setLocations(prev => [...new Set([...prev, ...items])]);
      setInputLocations("");
    }
  };

  const removeFilterToken = (item: string, target: "keys" | "locs" | "types" | "modes") => {
    if (target === "keys") setKeywords(prev => prev.filter(k => k !== item));
    if (target === "locs") setLocations(prev => prev.filter(l => l !== item));
    if (target === "types") setOpportunityTypes(prev => prev.filter(t => t !== item));
    if (target === "modes") setModes(prev => prev.filter(m => m !== item));
  };

  const toggleToggleFilter = (item: string, target: "types" | "modes") => {
    const arr = target === "types" ? opportunityTypes : modes;
    const setter = target === "types" ? setOpportunityTypes : setModes;
    if (arr.includes(item)) {
      setter(prev => prev.filter(x => x !== item));
    } else {
      setter(prev => [...prev, item]);
    }
  };

  const allOpportunities = [
    ...(internships || []).map(i => ({ ...i, category: "Internship", icon: Briefcase, color: "blue" })),
    ...(jobs || []).map(j => ({ ...j, category: "Job", icon: Briefcase, color: "emerald" })),
    ...(hackathons || []).map(h => ({ ...h, category: "Hackathon", icon: Code, color: "purple" })),
    ...(competitions || []).map(cp => ({ ...cp, category: "Competition", icon: Trophy, color: "rose" })),
    ...(scholarships || []).map(s => ({ ...s, category: "Scholarship", icon: GraduationCap, color: "amber" })),
    ...(courses || []).map(c => ({ ...c, category: "Course", icon: BookOpen, color: "indigo" })),
    ...(certifications || []).map(cer => ({ ...cer, category: "Certification", icon: Award, color: "teal" })),
    ...(bootcamps || []).map(b => ({ ...b, category: "Bootcamp", icon: MonitorPlay, color: "cyan" })),
    ...(workshops || []).map(w => ({ ...w, category: "Workshop", icon: Users, color: "violet" })),
  ];

  const filteredViewItems = activeTab === "all" 
    ? allOpportunities 
    : allOpportunities.filter(item => {
        if (activeTab === "dev-events") {
          return ["hackathon", "competition", "workshop"].includes(item.category.toLowerCase());
        }
        if (activeTab === "learning") {
          return ["course", "certification", "bootcamp", "scholarship"].includes(item.category.toLowerCase());
        }
        return item.category.toLowerCase() === activeTab;
      });

  return (
    <div className="flex-1 bg-gray-50 h-screen overflow-y-auto font-custom2 relative pb-12">
      
      <header className="sticky top-0 bg-white border-b border-gray-200/80 px-8 py-4 flex items-center justify-between z-30 shadow-xs">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-bold font-ar-one-sans text-gray-900 tracking-tight">Ecosystem Opportunities Pipeline</h1>
          <p className="text-xs text-gray-400">Discover personalized career options, tracks, and assessment structures matches.</p>
        </div>

        <button
          onClick={populateOpportunityData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border-none shadow-sm"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>{loading ? "Syncing Workspace..." : "Refresh Index"}</span>
        </button>
      </header>

      {error && (
        <div className="mx-8 mt-4 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between text-rose-800 text-xs animate-fadeIn z-40 relative">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-mono font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-350 mx-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        <form onSubmit={(e) => e.preventDefault()} className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-5 shadow-xs sticky top-24">
          <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-700 font-mono tracking-wider uppercase">Filter Aggregates</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold font-mono text-gray-400 uppercase tracking-wider">Keywords</label>
            <input
              type="text"
              value={inputKeywords}
              onChange={(e) => setInputKeywords(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), appendFilterToken(inputKeywords, "keys"))}
              placeholder="React, Redis, Kafka..."
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition"
            />
            <p className="text-[10px] text-gray-500 font-ar-one-sans">Press "Enter" to add a keyword</p>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {keywords.map(k => (
                  <span key={k} className="bg-gray-100 text-gray-700 text-[10px] font-medium pl-2 pr-1 py-0.5 rounded-md flex items-center gap-1">
                    {k}
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-pointer" onClick={() => removeFilterToken(k, "keys")} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. CHIP BUTTON MATRIX RENDERING EXACT CASE-SENSITIVE ENUM VALUES */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold font-mono text-gray-400 uppercase tracking-wider">Channel Variant</label>
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_OPPORTUNITY_TYPES.map(t => {
                const isSelected = opportunityTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleToggleFilter(t, "types")}
                    className={`px-2.5 py-0.5 text-[10px] font-mono rounded-md border transition cursor-pointer ${
                      isSelected ? "bg-blue-50 border-blue-300 text-blue-700 font-bold" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold font-mono text-gray-400 uppercase tracking-wider">Geographic Matrix Nodes</label>
            <input
              type="text"
              value={inputLocations}
              onChange={(e) => setInputLocations(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), appendFilterToken(inputLocations, "locs"))}
              placeholder="Bangalore, SF, London..."
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition"
            />
            <p className="text-[10px] text-gray-500 font-ar-one-sans">Press "Enter" to add a location</p>
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {locations.map(l => (
                  <span key={l} className="bg-blue-50/50 border border-blue-100 text-blue-800 text-[10px] font-medium pl-2 pr-1 py-0.5 rounded-md flex items-center gap-1">
                    {l}
                    <X className="w-3 h-3 text-blue-400 hover:text-blue-600 cursor-pointer" onClick={() => removeFilterToken(l, "locs")} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold font-mono text-gray-400 uppercase tracking-wider">Delivery Mode</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "Online", label: "Remote" },
                { id: "Offline", label: "Onsite" },
                { id: "Hybrid", label: "Hybrid" }
              ].map(m => {
                const isSelected = modes.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleToggleFilter(m.id, "modes")}
                    className={`p-2 border rounded-xl text-xs font-medium text-center transition cursor-pointer ${
                      isSelected ? "bg-gray-900 border-gray-900 text-white" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="w-full mt-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md border-none"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Apply Pipeline Queries</span>
          </button>
        </form>

        <main className="lg:col-span-3 flex flex-col gap-6">
          
          {careerGuidance && (
            <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md flex items-start gap-4">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 mt-1">
                <Globe className="w-5 h-5 text-blue-100" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono tracking-widest font-bold text-blue-200 uppercase">PathWise System Intelligence Directives</span>
                <p className="text-sm font-medium leading-relaxed text-white/95">{careerGuidance.guidance || careerGuidance.summary || "System vector parameters processed correctly."}</p>
              </div>
            </div>
          )}

          <div className="flex border-b border-gray-200 overflow-x-auto gap-6 no-scrollbar">
            {[
              { id: "all", label: "All Vector Streams" },
              { id: "internship", label: "Internships" },
              { id: "job", label: "Jobs" },
              { id: "dev-events", label: "Hackathons & Events" },
              { id: "learning", label: "Education & Tracks" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold font-mono tracking-wide uppercase border-b-2 transition shrink-0 cursor-pointer ${
                  activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs font-mono text-gray-400 tracking-wider uppercase">Evaluating global repository vectors...</p>
            </div>
          ) : filteredViewItems.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-gray-200 bg-white rounded-2xl flex flex-col items-center text-center p-6 gap-2">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 font-mono tracking-tight mt-1">No Active Vectors Found</h3>
              <p className="text-xs text-gray-400 max-w-sm">No items matching current active filter matrices.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              {filteredViewItems.map((item, idx) => {
                const CardIcon = item.icon || Sparkles;

                return (
                  <div key={item.id || idx} className="bg-white border border-gray-200/80 rounded-2xl p-5 hover:border-blue-400 hover:shadow-lg hover:shadow-gray-100 transition duration-150 flex flex-col justify-between group relative">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1.5 rounded-lg border bg-gray-50 text-gray-600">
                            <CardIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] font-mono tracking-widest font-bold uppercase px-2 py-0.5 rounded-md bg-gray-100 border-gray-200 text-gray-600">
                            {item.category}
                          </span>
                        </div>
                        {item.mode && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                            <Globe className="w-3 h-3 text-gray-300" />
                            {item.mode}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition tracking-tight line-clamp-1">{item.title || item.name || "Target Opportunity Title Node"}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 mb-3">{item.company || item.organization || item.platform || "Ecosystem Provider Module"}</p>
                      
                      {item.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">{item.description}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                            <span className="truncate max-w-25">{item.location}</span>
                          </div>
                        )}
                        {item.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-300 shrink-0" />
                            <span>{item.deadline}</span>
                          </div>
                        )}
                      </div>

                      <a
                        href={item.apply_link || item.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 tracking-wide uppercase group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Apply</span>
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}