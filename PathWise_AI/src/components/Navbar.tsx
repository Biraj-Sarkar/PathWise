import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { Menu } from "lucide-react";
import { toggleSidebar } from "../utils/sidebarSlice";
import logo from "../assets/logo.png";

export default function Navbar() {
  const isOpen = useSelector((state: any) => state.sidebar.isSidebarOpen);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const userInfo = useSelector((state: any) => state.auth.userInfo);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <nav className={`bg-gray-800 text-white w-full h-16 p-4 flex items-center border-b border-gray-700 ${isOpen ? "justify-end-safe" : "justify-between"} transition-all duration-300 ease-in-out`}>
      <div 
        className={`
          flex items-center justify-center space-x-4
          cursor-pointer
          ${isOpen ? "bg-gray-700": ""}
          p-2 rounded-md
          transition-all duration-300 ease-in-out
          hover:bg-gray-700
          ${isOpen ? "hidden": ""}
        `}
        onClick={() => {dispatch(toggleSidebar())}}
      >
        <Menu className="h-6 w-6" />
      </div>
      <button 
        className={`
          flex items-center justify-center gap-2 
          ${isOpen ? "hidden": "flex"}
          cursor-pointer
        `}
        onClick={() => navigate("/")}
      >
        <img src={logo} alt="Logo" className="w-10 h-10 rounded-full object-contain" />
        <span className="text-lg font-bold font-mono text-center">PathWise AI</span>
      </button>
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/profile")}>
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
        ) : (
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-300 cursor-pointer"
            onClick={() => navigate("/auth")}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  )
}