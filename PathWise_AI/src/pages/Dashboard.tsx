import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import HeaderWelcomeGrid from "../dashboard/HeaderWelcomeGrid.tsx";
import DashboardMetricsBar from "../dashboard/DashboardMetricsBar.tsx";
import DashboardActionGrid from "../dashboard/DashboardActionGrid.tsx";

export default function Dashboard() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const navigate = useNavigate();

  if (!isAuthenticated) navigate("/");

  return (
    <div className="w-full flex flex-col items-center min-h-screen gap-4 bg-gray-800 p-2">
      <HeaderWelcomeGrid />
      <DashboardMetricsBar />
      <DashboardActionGrid />
    </div>
  )
}