import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, ChevronDown, HeartPulse, ArrowRight, ShieldCheck } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-hidden flex flex-col">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* 🚀 NAVBAR: Corner Dropdown for Staff */}
      <nav className="w-full p-6 flex justify-between items-center z-20 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
          <HeartPulse className="text-cyan-500" size={32} />
          <span>KhanCare <span className="text-cyan-500">AI</span></span>
        </div>

        {/* Staff Dropdown Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all text-sm font-medium text-gray-300"
          >
            <ShieldCheck size={18} className="text-gray-400" />
            Staff Portals
            <ChevronDown size={16} className={`transition-transform duration-300 ${isStaffMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Items */}
          {isStaffMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-down">
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-sm text-gray-300 hover:text-blue-400"
              >
                <Stethoscope size={18} />
                Doctor Login
              </button>
              
              <div className="h-[1px] bg-gray-800 w-full"></div>
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-sm text-gray-300 hover:text-purple-400"
              >
                <Activity size={18} />
                Reception Login
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 🏥 MAIN HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 z-10 max-w-4xl mx-auto">
        
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-semibold tracking-wide">
          Next-Generation Healthcare Ops
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
          Smart Healing, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Powered by AI.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
          Experience seamless healthcare at KhanCare Hospital. Book your appointments instantly, track your live queue status from anywhere, and consult with our top medical professionals without the waiting room stress.
        </p>

        {/* Primary CTA Button for Patients */}
        <button 
          onClick={() => navigate('/login')}
          className="group relative inline-flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-white text-lg font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)]"
        >
          Get Started as Patient
          <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Mini Stats / Trust Indicators */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl border-t border-gray-800 pt-10">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">0 Wait</span>
            <span className="text-sm text-gray-500">Live Queue Tracking</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">24/7</span>
            <span className="text-sm text-gray-500">AI Medical Assistant</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-1">100%</span>
            <span className="text-sm text-gray-500">Secure Records</span>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Landing;