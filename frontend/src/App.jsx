import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components & Pages Imports
import ChatWidget from "./components/ChatWidget";
import TriageWidget from "./components/TriageWidget";
import ProtectedRoute from "./components/ProtectedRoute";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Receptionist from "./pages/Receptionist";
import Landing from "./pages/Landing"; // ✅ NEW
import DoctorDashboard from "./pages/DoctorDashboard"; // ✅ NEW

// --- MAIN COMPONENT ---
function App() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // Role padh rahe hain

  // Function jo decide karega ki logged-in user ko kahan bhejna hai
  const getDashboardRoute = () => {
    if (role === "doctor") return "/doctor-desk";
    if (role === "receptionist") return "/receptionist";
    return "/dashboard";
  };

  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-black">
        <Routes>
          
        
          <Route 
            path="/" 
            element={token ? <Navigate to={getDashboardRoute()} replace /> : <Landing />} 
          />

          {/* Public Routes */}
          <Route path="/register" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Patient Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Protected Receptionist Route */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute>
                <Receptionist />
              </ProtectedRoute>
            }
          />

          {/* ✅ Naya Protected Doctor Route */}
          <Route
            path="/doctor-desk"
            element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Wildcard Route -> Sabko wapas Landing par bhej dega */}
       {/* Catch-all Wildcard Route */}
       <Route path="*" element={<Navigate to="/" replace />} />          
        </Routes>

        {/* Global Chat Widget */}
        <TriageWidget />
        <ChatWidget />
      </div>
    </BrowserRouter>
  );
}

export default App;