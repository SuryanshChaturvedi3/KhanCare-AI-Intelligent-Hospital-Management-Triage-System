import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, ChevronLeft, ChevronRight, Users, Clock, Stethoscope, LogOut } from "lucide-react";

const DEPT_PALETTE = [
  { bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)",  badge: "#38bdf8", label: "#7dd3fc" },
  { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", badge: "#a78bfa", label: "#c4b5fd" },
  { bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)",  badge: "#fb923c", label: "#fdba74" },
  { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)",   badge: "#22c55e", label: "#86efac" },
  { bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.25)", badge: "#f472b6", label: "#f9a8d4" },
  { bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)",  badge: "#facc15", label: "#fde047" },
  { bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.25)",  badge: "#14b8a6", label: "#5eead4" },
  { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   badge: "#ef4444", label: "#fca5a5" },
];

const deptColorMap = {};
const getDeptColor = (dept) => {
  if (!deptColorMap[dept]) {
    const keys = Object.keys(deptColorMap).length;
    deptColorMap[dept] = DEPT_PALETTE[keys % DEPT_PALETTE.length];
  }
  return deptColorMap[dept];
};

const fmt = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "N/A";

const toYMD = (d) => d.toISOString().split("T")[0];

const Receptionist = () => {
  const [allPatients, setAllPatients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [showCal, setShowCal] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  
  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/appointments/receptionist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllPatients(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch:", error.response?.data?.message || error.message);
    }
  };

  // ==========================================
  // Fetch all appointments
  // ==========================================
  useEffect(() => {
    fetchAllData();
  }, []);

  const handleComplete = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/appointments/complete/${appointmentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // fetchAllData(); // 🚨 Isey hata sakte ho kyunki Socket khud update mangwa lega, par rakhna chaho toh rakh lo fast UI ke liye.
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role"); 
    navigate("/"); 
  };

  const filtered = useMemo(() => {
    if (!selectedDate) return allPatients;
    return allPatients.filter((a) => {
      if (!a.appointmentDate) return false;
      return new Date(a.appointmentDate).toISOString().split("T")[0] === selectedDate;
    });
  }, [allPatients, selectedDate]);

  const byDept = useMemo(() => {
    const map = {};
    filtered.forEach((a) => {
      const d = a.department || "General";
      if (!map[d]) map[d] = [];
      map[d].push(a);
    });
    return map;
  }, [filtered]);

  const totalPending = filtered.filter(a => a.status === "Pending").length;
  const totalDone = filtered.filter(a => a.status !== "Pending").length;

  const calYear = calMonth.getFullYear();
  const calMon = calMonth.getMonth();
  const firstDay = new Date(calYear, calMon, 1).getDay();
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
  const monthName = calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const activeDates = useMemo(() => {
    const s = new Set();
    allPatients.forEach((a) => {
      if (a.appointmentDate) s.add(new Date(a.appointmentDate).toISOString().split("T")[0]);
    });
    return s;
  }, [allPatients]);

  const selectDay = (day) => {
    const d = new Date(calYear, calMon, day);
    setSelectedDate(toYMD(d));
    setShowCal(false);
  };

  const displayDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "All Dates";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Manrope:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rc-root {
          min-height: 100vh;
          background: #080810;
          font-family: 'Manrope', sans-serif;
          color: #e2e0f0;
          padding: 36px 40px;
          background-image:
            radial-gradient(ellipse 60% 40% at 80% 0%, rgba(56,189,248,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 10% 90%, rgba(167,139,250,0.04) 0%, transparent 60%);
        }

        .rc-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
        }

        .rc-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          width: 100%;
        }

        .rc-title-block {}

        .rc-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #38bdf8;
          margin-bottom: 6px;
        }

        .rc-title {
          font-family: 'Syne', sans-serif;
          font-size: 30px;
          font-weight: 800;
          color: #f0eeff;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .rc-title-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Manrope', sans-serif;
          color: rgba(56,189,248,0.7);
          background: rgba(56,189,248,0.08);
          border: 1px solid rgba(56,189,248,0.15);
          padding: 3px 10px;
          border-radius: 100px;
          margin-left: 12px;
          vertical-align: middle;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ✅ LOGOUT BUTTON CSS */
        .rc-logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rc-logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        }

        .rc-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .rc-stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
        }

        .rc-stat-ico { display: flex; }
        .rc-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
        }
        .rc-stat-lbl {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-weight: 400;
        }

        /* DATE PICKER */
        .rc-datebar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .rc-date-lbl {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }

        .rc-date-trigger {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          cursor: pointer;
          color: #f0eeff;
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          position: relative;
        }
        .rc-date-trigger:hover {
          border-color: rgba(56,189,248,0.35);
          background: rgba(56,189,248,0.06);
        }
        .rc-date-trigger.open {
          border-color: rgba(56,189,248,0.5);
          background: rgba(56,189,248,0.08);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.08);
        }

        .rc-date-clear {
          padding: 8px 14px;
          background: none;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          color: rgba(255,255,255,0.3);
          font-family: 'Manrope', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        .rc-date-clear:hover { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.15); }

        /* CALENDAR POPUP */
        .rc-cal-wrap {
          position: relative;
          display: inline-block;
        }

        .rc-cal-popup {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          z-index: 100;
          background: #12121e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          padding: 20px;
          width: 280px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.08);
          animation: calIn 0.18s ease;
        }

        @keyframes calIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .rc-cal-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .rc-cal-nav-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          padding: 5px 7px;
          display: flex;
          align-items: center;
          transition: all 0.15s;
        }
        .rc-cal-nav-btn:hover { background: rgba(56,189,248,0.1); color: #38bdf8; border-color: rgba(56,189,248,0.2); }

        .rc-cal-month-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #f0eeff;
          letter-spacing: 0.02em;
        }

        .rc-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }

        .rc-cal-dow {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          padding: 4px 0 8px;
        }

        .rc-cal-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          color: rgba(255,255,255,0.55);
          position: relative;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .rc-cal-day:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .rc-cal-day.has-appt { color: #38bdf8; font-weight: 700; }
        .rc-cal-day.has-appt::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px;
          background: #38bdf8;
          border-radius: 50%;
        }
        .rc-cal-day.selected {
          background: #38bdf8;
          color: #080810;
          font-weight: 700;
          border-color: transparent;
        }
        .rc-cal-day.selected::after { display: none; }
        .rc-cal-day.today { border-color: rgba(255,255,255,0.15); }
        .rc-cal-day.empty { cursor: default; }
        .rc-cal-day.empty:hover { background: none; }

        /* DEPT SECTIONS */
        .rc-dept-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .rc-dept-section {
          border-radius: 20px;
          border: 1px solid;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .rc-dept-section:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.25);
        }

        .rc-dept-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .rc-dept-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rc-dept-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
        }

        .rc-dept-name {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .rc-dept-count-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 100px;
          border: 1px solid;
          letter-spacing: 0.04em;
        }

        .rc-table { width: 100%; border-collapse: collapse; }

        .rc-th {
          padding: 10px 20px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          text-align: left;
          background: rgba(0,0,0,0.15);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .rc-th:last-child { text-align: right; }

        .rc-td {
          padding: 13px 20px;
          font-size: 13.5px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }

        .rc-tr:last-child .rc-td { border-bottom: none; }
        .rc-tr { transition: background 0.15s; }
        .rc-tr:hover { background: rgba(255,255,255,0.025); }

        .rc-token {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
        }

        .rc-patient-name { font-weight: 600; color: #e8e4ff; }

        .rc-date-cell { color: rgba(255,255,255,0.35); font-size: 12.5px; }

        .rc-status-pending {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(250,204,21,0.1);
          color: #facc15;
          border: 1px solid rgba(250,204,21,0.2);
          letter-spacing: 0.04em;
        }

        .rc-status-done {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(34,197,94,0.1);
          color: #22c55e;
          border: 1px solid rgba(34,197,94,0.2);
          letter-spacing: 0.04em;
        }

        .rc-status-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .rc-status-dot.pending { background: #facc15; animation: pulse 1.5s ease-in-out infinite; }
        .rc-status-dot.done { background: #22c55e; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .rc-done-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-family: 'Manrope', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          background: rgba(34,197,94,0.12);
          color: #22c55e;
          border: 1px solid rgba(34,197,94,0.2);
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .rc-done-btn:hover {
          background: rgba(34,197,94,0.22);
          border-color: rgba(34,197,94,0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(34,197,94,0.15);
        }

        .rc-empty {
          text-align: center;
          padding: 64px 24px;
          color: rgba(255,255,255,0.2);
        }

        .rc-empty-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.3;
        }

        .rc-empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: rgba(255,255,255,0.25);
          margin-bottom: 6px;
        }

        .rc-empty-sub { font-size: 13px; }
      `}</style>

      <div className="rc-root">

        <div className="rc-header">
          {/* ✅ TOP ROW: Title and Logout Button */}
          <div className="rc-header-top">
            <div className="rc-title-block">
              <p className="rc-eyebrow">Reception Desk</p>
              <h1 className="rc-title">
                Queue Control
                <span className="rc-title-tag">Live</span>
              </h1>
            </div>

            {/* ✅ LOGOUT BUTTON UI */}
            <button className="rc-logout-btn" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>

          <div className="rc-stats">
            <div className="rc-stat-pill">
              <span className="rc-stat-ico"><Users size={15} color="#38bdf8" /></span>
              <div>
                <div className="rc-stat-num" style={{ color: "#38bdf8" }}>{filtered.length}</div>
                <div className="rc-stat-lbl">Total Today</div>
              </div>
            </div>
            <div className="rc-stat-pill">
              <span className="rc-stat-ico"><Clock size={15} color="#facc15" /></span>
              <div>
                <div className="rc-stat-num" style={{ color: "#facc15" }}>{totalPending}</div>
                <div className="rc-stat-lbl">Pending</div>
              </div>
            </div>
            <div className="rc-stat-pill">
              <span className="rc-stat-ico"><CheckCircle size={15} color="#22c55e" /></span>
              <div>
                <div className="rc-stat-num" style={{ color: "#22c55e" }}>{totalDone}</div>
                <div className="rc-stat-lbl">Completed</div>
              </div>
            </div>
            <div className="rc-stat-pill">
              <span className="rc-stat-ico"><Stethoscope size={15} color="#a78bfa" /></span>
              <div>
                <div className="rc-stat-num" style={{ color: "#a78bfa" }}>{Object.keys(byDept).length}</div>
                <div className="rc-stat-lbl">Departments</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rc-datebar">
          <span className="rc-date-lbl">Viewing:</span>
          <div className="rc-cal-wrap">
            <button
              className={`rc-date-trigger ${showCal ? "open" : ""}`}
              onClick={() => setShowCal(p => !p)}
            >
              <Calendar size={15} color="#38bdf8" />
              {displayDate}
            </button>

            {showCal && (
              <div className="rc-cal-popup">
                <div className="rc-cal-nav">
                  <button className="rc-cal-nav-btn" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                    <ChevronLeft size={14} />
                  </button>
                  <span className="rc-cal-month-name">{monthName}</span>
                  <button className="rc-cal-nav-btn" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="rc-cal-grid">
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <div key={d} className="rc-cal-dow">{d}</div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e-${i}`} className="rc-cal-day empty" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const ymd = toYMD(new Date(calYear, calMon, day));
                    const todayYMD = toYMD(new Date());
                    const isSelected = ymd === selectedDate;
                    const hasAppt = activeDates.has(ymd);
                    const isToday = ymd === todayYMD;
                    return (
                      <div
                        key={day}
                        className={`rc-cal-day ${isSelected ? "selected" : ""} ${hasAppt && !isSelected ? "has-appt" : ""} ${isToday && !isSelected ? "today" : ""}`}
                        onClick={() => selectDay(day)}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedDate && (
            <button className="rc-date-clear" onClick={() => { setSelectedDate(""); setShowCal(false); }}>
              Clear filter
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rc-empty">
            <div className="rc-empty-icon">📋</div>
            <div className="rc-empty-title">No appointments found</div>
            <div className="rc-empty-sub">No records for {displayDate}. Try a different date.</div>
          </div>
        ) : (
          <div className="rc-dept-grid">
            {Object.entries(byDept).map(([dept, appts]) => {
              const c = getDeptColor(dept);
              const pendingCount = appts.filter(a => a.status === "Pending").length;
              return (
                <div
                  key={dept}
                  className="rc-dept-section"
                  style={{ background: c.bg, borderColor: c.border }}
                >
                  <div className="rc-dept-header" style={{ background: `${c.bg}` }}>
                    <div className="rc-dept-header-left">
                      <div
                        className="rc-dept-icon"
                        style={{ background: `${c.badge}18`, borderColor: `${c.badge}30` }}
                      >
                        <Stethoscope size={16} color={c.badge} />
                      </div>
                      <div>
                        <div className="rc-dept-name" style={{ color: c.label }}>{dept}</div>
                        {pendingCount > 0 && (
                          <div style={{ fontSize: 11, color: "#facc15", fontWeight: 500, marginTop: 2 }}>
                            {pendingCount} pending
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className="rc-dept-count-pill"
                      style={{ color: c.badge, borderColor: `${c.badge}30`, background: `${c.badge}12` }}
                    >
                      {appts.length} patient{appts.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <table className="rc-table">
                    <thead>
                      <tr>
                        <th className="rc-th">Token</th>
                        <th className="rc-th">Patient</th>
                        <th className="rc-th">Date</th>
                        <th className="rc-th">Status</th>
                        <th className="rc-th">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appts.map((appt) => (
                        <tr key={appt._id} className="rc-tr">
                          <td className="rc-td">
                            <span className="rc-token" style={{ color: c.badge }}>#{appt.tokenNumber}</span>
                          </td>
                          <td className="rc-td">
                            <span className="rc-patient-name">{appt.patientId?.name || "No Name"}</span>
                          </td>
                          <td className="rc-td">
                            <span className="rc-date-cell">{fmt(appt.appointmentDate)}</span>
                          </td>
                          <td className="rc-td">
                            {appt.status === "Pending" ? (
                              <span className="rc-status-pending">
                                <span className="rc-status-dot pending" />
                                Pending
                              </span>
                            ) : (
                              <span className="rc-status-done">
                                <span className="rc-status-dot done" />
                                Done
                              </span>
                            )}
                          </td>
                          <td className="rc-td" style={{ textAlign: "right" }}>
                            {appt.status === "Pending" ? (
                              <button className="rc-done-btn" onClick={() => handleComplete(appt._id)}>
                                <CheckCircle size={13} />
                                Mark Done
                              </button>
                            ) : (
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <CheckCircle size={13} color="#22c55e" /> Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Receptionist;