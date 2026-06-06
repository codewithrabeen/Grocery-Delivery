
import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ProtectedRoute = () => {
  const { user } = useAppContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
