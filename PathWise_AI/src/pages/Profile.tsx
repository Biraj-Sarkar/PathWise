import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Camera, ShieldCheck, Trash2, Save } from "lucide-react";
import { setProfile, clearProfile } from "../utils/profileSlice.ts";
import { apiClient } from "../utils/apiClient.ts";
import { languages } from "../utils/languages.ts";
import { setCredentials, clearCredentials } from "../utils/authSlice.ts";

const NoUserAvatar = ({ className = "w-64 h-64" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    version="1.1" 
    viewBox="0 0 256 256" 
    xmlSpace="preserve"
    className={className} // Allows you to resize it easily with Tailwind (e.g., w-10 h-10)
  >
    <g 
      style={{ stroke: 'none', strokeWidth: 0, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'none', fillRule: 'nonzero', opacity: 1 }} 
      transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
    >
      <path 
        d="M 45 88 c -11.049 0 -21.18 -2.003 -29.021 -8.634 C 6.212 71.105 0 58.764 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 c 0 13.765 -6.212 26.105 -15.979 34.366 C 66.181 85.998 56.049 88 45 88 z" 
        style={{ stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(214,214,214)', fillRule: 'nonzero', opacity: 1 }} 
        transform="matrix(1 0 0 1 0 0)" 
        strokeLinecap="round"
      />
      <path 
        d="M 45 60.71 c -11.479 0 -20.818 -9.339 -20.818 -20.817 c 0 -11.479 9.339 -20.818 20.818 -20.818 c 11.479 0 20.817 9.339 20.817 20.818 C 65.817 51.371 56.479 60.71 45 60.71 z" 
        style={{ stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(165,164,164)', fillRule: 'nonzero', opacity: 1 }} 
        transform="matrix(1 0 0 1 0 0)" 
        strokeLinecap="round"
      />
      <path 
        d="M 45 90 c -10.613 0 -20.922 -3.773 -29.028 -10.625 c -0.648 -0.548 -0.88 -1.444 -0.579 -2.237 C 20.034 64.919 31.933 56.71 45 56.71 s 24.966 8.209 29.607 20.428 c 0.301 0.793 0.069 1.689 -0.579 2.237 C 65.922 86.227 55.613 90 45 90 z" 
        style={{ stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(165,164,164)', fillRule: 'nonzero', opacity: 1 }} 
        transform="matrix(1 0 0 1 0 0)" 
        strokeLinecap="round"
      />
    </g>
  </svg>
);

export default function Profile() {
  const dispatch = useDispatch();
  
  // Safely reading auth and profile data from Redux
  const userInfo = useSelector((state: any) => state.auth?.userInfo) || { name: "", email: "" };
  const userProfile = useSelector((state: any) => state.profile?.userProfile) || {};

  // File input state for avatar upload
  const [avatarURL, setAvatarURL] = useState<string | null>(userInfo.avatar || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states matching the grid fields exactly
  const [userName, setUserName] = useState(userInfo.name || "");
  const [profileData, setProfileData] = useState({
    education_level: userProfile.education_level || "",
    interests: Array.isArray(userProfile.interests) ? userProfile.interests.join(", ") : "",
    skills: Array.isArray(userProfile.skills) ? userProfile.skills.join(", ") : "",
    career_goals: Array.isArray(userProfile.career_goals) ? userProfile.career_goals.join(", ") : "",
    preferred_languge: userProfile.preferred_languge || "English",
    learning_style: userProfile.learning_style || "",
    preferred_domain: userProfile.preferred_domain || "",
    preferred_location: userProfile.preferred_location || ""
  });

  // Password fields state
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Delete account field state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({ type: "success", text: "Uploading avatar..." });

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const previewUrl = reader.result as string;
        const response = await apiClient("/auth/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: previewUrl })
        }, dispatch);

        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "Avatar upload failed.");

        dispatch(setCredentials({ userInfo: body.data.user }));
        setAvatarURL(previewUrl);
        setStatusMessage({ type: "success", text: body.message || "Avatar uploaded successfully!" });
      } catch (err) {
        setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to upload avatar." });
      }
    }

    reader.readAsDataURL(file);
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const changePassword = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    try {
      const response = await apiClient("/auth/update-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData)
      }, dispatch);

      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Password update failed.");

      setStatusMessage({ type: "success", text: body.message || "Password updated successfully!" });
      setPasswordData({ oldPassword: "", newPassword: "" }); // Clear password fields after success
    } catch (error) {
      setStatusMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update password." });
    }
  }

  const deleteAccount = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    try {
      setIsDeleting(true);

      const response = await apiClient("/auth/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword })
      }, dispatch);

      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Account deletion failed.");

      dispatch(clearProfile());
      dispatch(clearCredentials());

      setStatusMessage({ type: "success", text: body.message || "Account deleted successfully!" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete account." });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  }

  const saveProfileSettings = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });
    
    try {
      const userDataResponse = await apiClient("/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName })
      }, dispatch);

      const userData = await userDataResponse.json();
      if (!userDataResponse.ok) throw new Error(userData.message || "Could not sync user data updates.");

      dispatch(setCredentials({ userInfo: userData.data.user }));

      const payload = {
        ...profileData,
        interests: profileData.interests.split(",").map((i: string) => i.trim()).filter(Boolean),
        skills: profileData.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
        career_goals: profileData.career_goals.split(",").map((c: string) => c.trim()).filter(Boolean),
      };

      const response = await apiClient("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, dispatch);

      const updatedData = await response.json();
      if (!response.ok) throw new Error(updatedData.message || "Could not sync updates.");
      
      dispatch(setProfile({ userProfile: updatedData.data.profile }));
      setStatusMessage({ type: "success", text: updatedData.message ||"Profile details updated seamlessly!" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update profile settings." });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 font-custom2">
      {/* Status Alerts */}
      {statusMessage.text && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-mono ${statusMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#1e2530] text-white border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Visual warning indicator row */}
            <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-custom font-bold text-gray-100 tracking-wide">Delete Account</h3>
                <p className="text-xs font-mono text-red-400 mt-0.5 uppercase tracking-wider font-bold">Irreversible Action</p>
              </div>
            </div>

            {/* Warning descriptive copy block */}
            <div className="flex flex-col gap-2.5">
              <p className="text-sm text-gray-300 leading-relaxed">
                Are you completely sure you want to delete your profile? This will permanently erase your learning history, personal metrics, and custom conversational memory nodes.
              </p>
              <p className="text-xs text-gray-500 font-mono italic">
                To confirm, enter your password and click "Permanently Delete" below. This connection cannot be undone.
              </p>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="p-1 bg-gray-800 border border-gray-600 rounded-sm text-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter your password"
              />
            </div>

            {/* Interactive decision buttons matrix */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setIsDeleting(false);
                }}
                className={`
                  px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white font-medium text-sm rounded-xl transition cursor-pointer
                  ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={isDeleting}
                `}                
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                className={`
                  px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-md shadow-red-900/20
                  ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={isDeleting}
                `}
              >
                Permanently Delete
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-white">
        
        {/* --- LEFT CONTAINER COLUMN (Dark Identity Sidebar) --- */}
        <div className="lg:col-span-4 bg-[#1e2530] p-8 flex flex-col items-center text-white justify-between gap-8">
          
          <div className="w-full flex flex-col items-center gap-6">
            {/* Main Avatar Circle Area */}
            <div className="w-44 h-44 rounded-full bg-gray-400 border-4 border-gray-600/40 flex items-center justify-center overflow-hidden relative group shadow-inner">
              {avatarURL ? (
                <img src={avatarURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <NoUserAvatar className="w-full h-full" />
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Management Trigger */}
            <button 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 font-custom2 text-sm font-medium rounded-full transition shadow-md flex items-center gap-2 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
          </div>

          {/* Secure Access Fields Block */}
          <div className="w-full flex flex-col gap-4 border-t border-gray-700/50 pt-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-wider text-gray-400 uppercase">Old Password</label>
              <input 
                type="password" 
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                className="w-full bg-[#2d3543] border border-gray-700/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-wider text-gray-400 uppercase">New Password</label>
              <input 
                type="password" 
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full bg-[#2d3543] border border-gray-700/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" 
              />
            </div>
          </div>

          {/* Core Critical Actions Anchor */}
          <div className="w-full flex flex-col gap-3 mt-4">
            <button 
              className="w-full py-2.5 bg-[#e040fb] hover:bg-[#d527f2] font-ar-one-sans text-sm font-semibold rounded-full transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-white"
              onClick={changePassword}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Change Password</span>
            </button>
            <button 
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 font-ar-one-sans text-sm font-semibold rounded-full transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-white"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>

        </div>

        {/* --- RIGHT CONTAINER COLUMN (Light Parameters Workspace Grid) --- */}
        <form onSubmit={saveProfileSettings} className="lg:col-span-8 p-8 md:p-10 flex flex-col justify-between bg-[#f8fafc]">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {/* Row 1: Name & Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Name</label>
              <input type="text" name="name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Email</label>
              <input type="email" name="email" value={userInfo.email} disabled className="w-full bg-gray-200/50 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 border border-transparent cursor-not-allowed opacity-80" />
            </div>

            {/* Row 2: Education Level & Interests */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Education Level</label>
              <select name="education_level" value={profileData.education_level} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition cursor-pointer">
                <option value="">Select Option</option>
                <option value="High School">High School</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Professional">Professional</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Interests</label>
              <input type="text" name="interests" placeholder="e.g. AI, Web Development, Systems" value={profileData.interests} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition" />
            </div>

            {/* Row 3: Skills & Career Goals */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Skills</label>
              <input type="text" name="skills" placeholder="e.g. Python, React, SQL" value={profileData.skills} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Career Goals</label>
              <input type="text" name="career_goals" placeholder="e.g. Data Scientist, Tech Lead" value={profileData.career_goals} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition" />
            </div>

            {/* Row 4: Language & Learning Style */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Language</label>
              <select name="preferred_languge" value={profileData.preferred_languge} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition">
                {languages.map((lang) => (
                  <option key={lang} value={lang} className="text-gray-900">{lang}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Learning Style</label>
              <select name="learning_style" value={profileData.learning_style} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition cursor-pointer">
                <option value="">Select Option</option>
                <option value="Visual">Visual Learner</option>
                <option value="Conversational">Conversational (Tutor Heavy)</option>
                <option value="Practical">Practical / Project Based</option>
              </select>
            </div>

            {/* Row 5: Preferred Domain & Preferred Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Preferred Domain</label>
              <input type="text" name="preferred_domain" placeholder="e.g. FinTech, EdTech, Healthcare" value={profileData.preferred_domain} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Preferred Location</label>
              <input type="text" name="preferred_location" placeholder="e.g. Remote, San Francisco, New York" value={profileData.preferred_location} onChange={handleProfileChange} className="w-full bg-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-800 border border-transparent focus:bg-white focus:border-blue-500 transition" />
            </div>
          </div>

          {/* Footer Action Anchor */}
          <div className="w-full flex justify-end mt-8 border-t border-gray-200 pt-4">
            <button 
              type="submit" 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-ar-one-sans text-sm font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}