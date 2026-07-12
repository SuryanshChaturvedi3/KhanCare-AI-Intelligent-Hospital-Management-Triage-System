import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, LogOut, RefreshCw, ChevronRight, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [user, setUser] = useState({ name: "Patient" }); // Ye aage chal kar profile API se aayega
  const [bookingData, setBookingData] = useState({ department: "", date: "" });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_URL}/api/appointments/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.hasActiveAppointment) {
        setAppointment(res.data.data);
      } else {
        setAppointment(null);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/appointments/appointment`,
        bookingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Booking Successful!");
      fetchStatus();
    } catch (err) {
      alert("Error booking appointment");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="animate-spin text-cyan-500" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#070707] text-gray-100 font-sans pb-10">
      {/* --- Modern Navbar --- */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500 p-1.5 rounded-lg">
            <Activity size={22} className="text-black" />
          </div>
          <span className="text-xl font-bold tracking-tighter">
            KHANCARE <span className="text-cyan-500">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right mr-2">
            <p className="text-xs text-gray-500">Welcome,</p>
            <p className="text-sm font-bold">{user.name}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Left Column: Main Action (Tracker or Form) --- */}
          <div className="lg:col-span-2 space-y-8">
            {appointment ? (
              /* ACTIVE TRACKER CARD */
              <div className="bg-gradient-to-br from-cyan-900/40 to-black border border-cyan-500/30 rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black">Live Queue Tracker</h2>
                    <span className="bg-cyan-500 text-black px-4 py-1 rounded-full text-xs font-bold animate-pulse">
                      LIVE
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-48 h-48 rounded-full border-8 border-cyan-500/20 flex items-center justify-center relative">
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Position</p>
                        <p className="text-6xl font-black text-cyan-400">
                          {appointment.currentPosition}
                        </p>
                      </div>
                      <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-cyan-500"
                          strokeDasharray="553"
                          strokeDashoffset={553 - 553 * 0.7}
                        />
                      </svg>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-500">Your Token</p>
                          <p className="text-xl font-bold">
                            #{appointment.originalToken}
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-xl font-bold">
                            {appointment.department}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={fetchStatus}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-2xl hover:bg-cyan-400 transition-all"
                      >
                        <RefreshCw size={18} /> Refresh Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* BOOKING FORM CARD */
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Book New Consultation
                </h2>
                <form
                  onSubmit={handleBooking}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">
                      Select Department
                    </label>
                    <select
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-cyan-500 text-white appearance-none"
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          department: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="" className="bg-gray-900 text-gray-400">Choose...</option>
                      <option value="General Medicine" className="bg-gray-900 text-white">General Medicine</option>
                      <option value="Cardiology" className="bg-gray-900 text-white">Cardiology</option>
                      <option value="Neurology" className="bg-gray-900 text-white">Neurology</option>
                      <option value="Orthopedic" className="bg-gray-900 text-white">Orthopedic</option>
                      <option value="Dermatology" className="bg-gray-900 text-white">Dermatology</option>
                      <option value="ENT" className="bg-gray-900 text-white">ENT</option>
                      <option value="Pediatrics" className="bg-gray-900 text-white">Pediatrics</option>
                      <option value="Gynecology" className="bg-gray-900 text-white">Gynecology</option>
                      <option value="Gastroenterology" className="bg-gray-900 text-white">Gastroenterology</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-cyan-500 text-white [color-scheme:dark]"
                      onChange={(e) =>
                        setBookingData({ ...bookingData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="md:col-span-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
                  >
                    Confirm Appointment
                  </button>
                </form>
              </div>
            )}

            {/* AI Call To Action */}
            <div className="bg-gradient-to-r from-blue-600/10 to-transparent border border-white/10 rounded-[2rem] p-6 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                  Ask <span className="text-cyan-500">KhanCare AI</span>
                </h4>
                <p className="text-sm text-gray-400">
                  Find generic medicines and symptom advice using the chat
                  widget below.
                </p>
              </div>
              <ChevronRight className="text-gray-600" />
            </div>
          </div>

          {/* --- Right Column: Secondary Details --- */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Bell size={18} className="text-cyan-500" /> How it works
              </h3>
              <div className="space-y-4">
                <div className="border-l-2 border-cyan-500 pl-4 py-1">
                  <p className="text-sm font-semibold">1. Book Appointment</p>
                  <p className="text-xs text-gray-500">
                    Select date and department.
                  </p>
                </div>
                <div className="border-l-2 border-cyan-500 pl-4 py-1">
                  <p className="text-sm font-semibold">2. Get Token</p>
                  <p className="text-xs text-gray-500">
                    Receive your unique token number.
                  </p>
                </div>
                <div className="border-l-2 border-cyan-500 pl-4 py-1">
                  <p className="text-sm font-semibold">3. Track Live</p>
                  <p className="text-xs text-gray-500">
                    Watch the queue move in real-time.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-[2rem] p-6">
              <h3 className="font-bold text-cyan-400 mb-2">Emergency?</h3>
              <p className="text-xs text-gray-400 mb-4">
                Instant connection to our 24/7 ambulance service.
              </p>
              <button className="w-full bg-red-500/20 text-red-500 border border-red-500/40 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all">
                Call Ambulance
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
