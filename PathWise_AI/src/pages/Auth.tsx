import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Sparkles, BookOpen } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCredentials } from "../utils/authSlice.ts";
import { setProfile } from "../utils/profileSlice.ts";
import { apiClient } from "../utils/apiClient.ts";
import { languages } from "../utils/languages.ts";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function GoogleIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
    </svg>
  )
}

export default function Login() {
  const [tab, setTab] = useState("sign-in");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isErrorClosing, setIsErrorClosing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [cachedToken, setCachedToken] = useState("");
  const [onboardingData, setOnboardingData] = useState({
    education_level: "",
    preferred_language: "",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!error) {
      setIsErrorClosing(false);
      return;
    }

    setIsErrorClosing(false);

    const closeTimer = window.setTimeout(() => {
      setIsErrorClosing(true);
    }, 4500);

    const removeTimer = window.setTimeout(() => {
      setError("");
      setIsErrorClosing(false);
    }, 5000);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleModalSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOnboardingData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      let data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      dispatch(setCredentials({
        userInfo: data.data.user,
        token: data.data.token
      }));

      const userProfileResponse = await apiClient("/profile", { method: "GET" }, dispatch, data.data.token);
      data = await userProfileResponse.json();

      if (!userProfileResponse.ok) {
        throw new Error(data.message || "Failed to fetch user profile");
      }
      
      dispatch(setProfile({ userProfile: data.data.profile }));

      navigate("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setFormData({
        name: "",
        email: "",
        password: ""
      })
    }
  }
  
  const handleRegister = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      dispatch(setCredentials({
        userInfo: data.data.user,
        token: data.data.token
      }));

      setCachedToken(data.data.token);
      setOpenModal(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } 
    finally {
      setFormData({
        name: "",
        email: "",
        password: ""
      })
    }
  }

  const submitProfileOnboarding = async () => {
    setError("");

    try {
      const response = await apiClient("/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          education_level: onboardingData.education_level || null,
          interests: [],
          skills: [],
          preferred_language: onboardingData.preferred_language || "English",
          career_goals: [],
          learning_style: null,
        })
      }, dispatch, cachedToken);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit profile onboarding");
      }

      dispatch(setProfile({ userProfile: data.data.profile }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setOnboardingData({
        education_level: "",
        preferred_language: "",
      });

      setOpenModal(false);
      navigate("/");
    }
  }

  return (
    <div className={
      `w-full h-screen 
      flex items-center justify-center 
      bg-white overflow-hidden relative
      ${tab === "sign-up" ? "flex-col-reverse sm:flex-row-reverse" : "flex-col sm:flex-row"} gap-10 sm:gap-0
    `}>
      {/* Error Message */}
      {error && (
        <div className={
          `fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg transition-all duration-300 ease-out
          ${isErrorClosing ? "translate-x-[120%] opacity-0" : "translate-x-0 opacity-100"}`
        }>
          {error}
          <button
            className="ml-2 text-white hover:text-gray-200 focus:outline-none cursor-pointer"
            onClick={() => {
              setIsErrorClosing(true);
              window.setTimeout(() => setError(""), 250);
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Personalized Profile Configuration Modal Overlay */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-blue-500 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Design accents mirroring brand pattern styles */}
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>
              <h2 className="text-2xl font-bold tracking-wide mt-2">Personalize Your Track</h2>
              <p className="text-sm text-blue-100 max-w-xs">
                Help PathWise AI adapt study materials and generation contexts to your experience level.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {/* Field 1: Education Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold tracking-wider text-blue-100 uppercase">Education Level</label>
                <div className="relative">
                  <select 
                    name="education_level"
                    value={onboardingData.education_level}
                    onChange={handleModalSelectChange}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer text-sm"
                  >
                    <option value="" className="text-gray-900">Select Level (Optional)</option>
                    <option value="High School" className="text-gray-900">High School Student</option>
                    <option value="Undergraduate" className="text-gray-900">Undergraduate / College</option>
                    <option value="Graduate" className="text-gray-900">Graduate / Master's</option>
                    <option value="Professional" className="text-gray-900">Working Professional</option>
                  </select>
                  <BookOpen className="w-4 h-4 text-white/60 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Preferred Language */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold tracking-wider text-blue-100 uppercase">Preferred Language</label>
                <select 
                  name="preferred_language"
                  value={onboardingData.preferred_language}
                  onChange={handleModalSelectChange}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer text-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang} className="text-gray-900">{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons alignment row */}
            <div className="flex items-center justify-end gap-3 mt-4 border-t border-white/10 pt-4">
              <button 
                onClick={submitProfileOnboarding}
                className="px-5 py-2.5 text-xs text-blue-100 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer font-medium"
              >
                Skip For Now
              </button>
              <button 
                onClick={submitProfileOnboarding}
                className="px-6 py-2.5 bg-white text-blue-600 font-semibold rounded-xl text-xs hover:bg-blue-50 transition cursor-pointer shadow-md"
              >
                Save & Continue
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Form Registration Content Canvas */}
      <div className="relative w-full sm:w-[50%] h-[70%] sm:h-full overflow-hidden">
        <div className={
          `absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out will-change-transform
          ${tab === "sign-in" 
            ? "translate-y-0 sm:translate-y-0 sm:translate-x-0 opacity-100" 
            : "-translate-y-full sm:translate-y-0 sm:-translate-x-full opacity-0 pointer-events-none"
          }`
        }>
          <div className="w-[80%] flex flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-bold mb-4 text-center">Sign In</h1>
            <div className="my-5 mx-0 flex items-center justify-center gap-4">
              <div className="border border-[#ccc] rounded-[20%] inline-flex justify-center items-center mx-0.75 w-10 h-10 cursor-pointer">
                <GoogleIcon className="w-6 h-6" />
              </div>
              <div className="border border-[#ccc] rounded-[20%] inline-flex justify-center items-center mx-0.75 w-10 h-10 cursor-pointer">
                <GitHubIcon className="w-6 h-6" />
              </div>
            </div>
            <span className="text-md font-medium">Sign in with Email</span>
            <input
              type="email"
              name="email"
              placeholder="Enter Your Email"
              value={formData.email}
              className="w-[70%] max-w-100 border border-[#ccc] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              onChange={handleInputChange}
            />
            <div className="w-[70%] max-w-100 border border-[#ccc] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="flex items-center justify-between">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter Your Password"
                  value={formData.password}
                  className="w-full border-none focus:outline-none bg-transparent"
                  required
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="focus:outline-none cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button 
              className="w-[70%] max-w-100 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={handleLogin}
            >
              Sign In
            </button>
          </div>
        </div>

        <div className={
          `absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out will-change-transform
          ${tab === "sign-up" 
            ? "translate-y-0 sm:translate-y-0 sm:translate-x-0 opacity-100" 
            : "translate-y-full sm:translate-y-0 sm:translate-x-full opacity-0 pointer-events-none"
          }`
        }>
          <div className="w-[80%] flex flex-col items-center justify-center gap-4">
            <h1 className="text-3xl font-bold mb-4 text-center">Create Account</h1>
            <div className="my-5 mx-0 flex items-center justify-center gap-4">
              <div className="border border-[#ccc] rounded-[20%] inline-flex justify-center items-center mx-0.75 w-10 h-10 cursor-pointer">
                <GoogleIcon className="w-6 h-6" />
              </div>
              <div className="border border-[#ccc] rounded-[20%] inline-flex justify-center items-center mx-0.75 w-10 h-10 cursor-pointer">
                <GitHubIcon className="w-6 h-6" />
              </div>
            </div>
            <span className="text-md font-medium">Register with Email</span>
            <input
              type="text"
              name="name"
              placeholder="Enter Your Name"
              value={formData.name}
              className="w-[70%] max-w-100 border border-[#ccc] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              onChange={handleInputChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Enter Your Email"
              value={formData.email}
              className="w-[70%] max-w-100 border border-[#ccc] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              onChange={handleInputChange}
            />
            <div className="w-[70%] max-w-100 border border-[#ccc] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="flex items-center justify-between">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter Your Password"
                  value={formData.password}
                  className="w-full border-none focus:outline-none bg-transparent"
                  required
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="focus:outline-none cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button 
              className="w-[70%] max-w-100 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={handleRegister}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Accent Banner Column */}
      <div className={`
        flex items-center justify-center 
        w-full h-[40%] sm:w-[50%] sm:h-full 
        text-white bg-blue-500
        transition-all duration-700 ease-in-out
        ${tab === "sign-up" ? "rounded-b-[40px] sm:rounded-bl-none sm:rounded-r-[40px]" : "rounded-t-[40px] sm:rounded-tr-none sm:rounded-l-[40px]"}
      `}>
        <div className="toggle transition-all duration-700 ease-in-out">
          {/* Redirect to Sign In Page */}
          {tab === "sign-up" && (
            <div>
              <h1 className="text-xl font-bold mb-4">Welcome To <br/> <span className="text-blue-100 text-3xl">PathWise AI</span></h1>
              <p>Already have an account? 
                <span 
                  className="mx-2 cursor-pointer text-yellow-400 hover:text-yellow-300"
                  onClick={() => setTab("sign-in")}
                >
                  Sign In
                </span>
              </p>
            </div>
          )}

          {/* Redirect to Sign Up Page */}
          {tab === "sign-in" && (
            <div>
              <h1 className="text-xl font-bold mb-4">Welcome To <br/> <span className="text-blue-100 text-3xl">PathWise AI</span></h1>
              <p>Don't have an account? 
                <span 
                  className="mx-2 cursor-pointer text-yellow-400 hover:text-yellow-300"
                  onClick={() => setTab("sign-up")}
                >
                  Sign Up
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}