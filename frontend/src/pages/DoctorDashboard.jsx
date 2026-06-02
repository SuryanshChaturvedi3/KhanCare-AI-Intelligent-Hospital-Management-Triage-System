import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, User, Stethoscope, Activity, Phone, LogOut } from "lucide-react";

const DoctorDashboard = () => {

  const [queue, setQueue] = useState([]);
  const [department, setDepartment] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ================= FETCH QUEUE =================
  const fetchDoctorQueue = async () => {

    try {

      const token = localStorage.getItem("token");

      if (!token) {
        console.log("❌ No token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/appointments/doctor",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQueue(res.data.data || []);
      setDepartment(res.data.department || "Specialist");

    } catch (error) {

      console.error("❌ Queue fetch failed:", error.response?.data || error);

    } finally {
      setLoading(false);
    }
  };

  // ================= SOCKET LISTENER =================
  useEffect(() => {

    fetchDoctorQueue();

  }, []);

  // ================= COMPLETE CHECKUP =================
  const handleComplete = async (appointmentId) => {

    try {

      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/appointments/complete/${appointmentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setQueue((prev) => prev.filter((appt) => appt._id !== appointmentId))
      fetchDoctorQueue();

    } catch (error) {

      console.error("❌ Complete failed:", error);

      alert("Failed to complete checkup.");

    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/");

  };

  // ================= UI =================
  return (

    <div className="p-8 text-white bg-[#050505] min-h-screen">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">

          <div className="flex items-center gap-3">
            <Stethoscope size={36} className="text-blue-500" />
            <h1 className="text-4xl font-bold">Doctor Desk</h1>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-xl"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

        {/* QUEUE COUNT */}
        <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-5 mb-8">
          <div>
            <p className="text-sm text-gray-400">Patients Waiting</p>
            <p className="text-3xl font-bold text-blue-400">{queue.length}</p>
          </div>
          <Activity className="text-blue-400" size={30} />
        </div>

        {/* MAIN QUEUE */}
        {loading ? (

          <div className="text-center py-20">
            <p>Loading queue...</p>
          </div>

        ) : queue.length === 0 ? (

          <div className="text-center py-20">
            <Clock size={60} className="mx-auto mb-5 text-gray-500" />
            <h3 className="text-2xl">No Patients in Queue</h3>
          </div>

        ) : (

          <div className="space-y-5">

            {queue.map((appt, index) => {

              const isCurrent = index === 0;

              return (

                <div
                  key={appt._id}
                  className={`flex justify-between items-center p-6 rounded-2xl ${
                    isCurrent
                      ? "bg-blue-900/40 border border-blue-500"
                      : "bg-white/5 border border-white/10"
                  }`}
                >

                  <div>

                    <p className="text-sm text-gray-400">Token</p>

                    <p className="text-3xl font-bold">
                      #{appt.tokenNumber}
                    </p>

                    <p className="text-lg mt-2 flex items-center gap-2">
                      <User size={18} />
                      {appt.patientId?.name || "Unknown Patient"}
                    </p>

                    {appt.patientId?.phone && (
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Phone size={14} />
                        {appt.patientId.phone}
                      </p>
                    )}

                  </div>

                  <button
                    onClick={() => handleComplete(appt._id)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl"
                  >
                    <CheckCircle size={18} />
                    Complete
                  </button>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </div>

  );
};

export default DoctorDashboard;