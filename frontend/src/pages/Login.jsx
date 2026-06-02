import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, ArrowUpLeft, MoveRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(null);

  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
    email: email.trim(),
    password: password.trim()
  },);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        const role = res.data.data?.role || "patient";
        localStorage.setItem("role", role);
        if (role === "doctor") navigate('/doctor-desk', { replace: true });
        else if (role === "receptionist") navigate('/receptionist', { replace: true });
        else navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Invalid Email or Password!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lr-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Outfit', sans-serif;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .lr-root { grid-template-columns: 1fr; }
          .lr-left { display: none; }
        }

        .lr-left {
          background: #f0ebe3;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 52px;
          overflow: hidden;
        }

        .lr-left-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(180,160,130,0.18) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }

        .lr-left-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(160,130,90,0.12);
        }
        .lr-left-ring-1 { width: 600px; height: 600px; bottom: -200px; right: -200px; }
        .lr-left-ring-2 { width: 400px; height: 400px; bottom: -100px; right: -100px; }
        .lr-left-ring-3 { width: 220px; height: 220px; bottom: 0; right: 0; }

        .lr-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .lr-brand-icon {
          width: 36px; height: 36px;
          background: #1a1a1a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lr-brand-cross {
          width: 16px; height: 16px;
          position: relative;
        }
        .lr-brand-cross::before, .lr-brand-cross::after {
          content: '';
          position: absolute;
          background: #f0ebe3;
          border-radius: 2px;
        }
        .lr-brand-cross::before { width: 4px; height: 16px; left: 6px; top: 0; }
        .lr-brand-cross::after { width: 16px; height: 4px; left: 0; top: 6px; }

        .lr-brand-name {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          letter-spacing: 0.03em;
        }

        .lr-tagblock {
          position: relative;
          z-index: 2;
        }

        .lr-tag-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9c8a72;
          margin-bottom: 18px;
        }

        .lr-tag-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(42px, 5vw, 62px);
          font-weight: 900;
          color: #1a1a1a;
          line-height: 1.08;
          letter-spacing: -0.02em;
        }

        .lr-tag-headline em {
          font-style: italic;
          color: #6b5c45;
        }

        .lr-tag-sub {
          font-size: 14px;
          font-weight: 300;
          color: #7a6a58;
          margin-top: 20px;
          line-height: 1.7;
          max-width: 280px;
        }

        .lr-stats {
          display: flex;
          gap: 32px;
          position: relative;
          z-index: 2;
        }

        .lr-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .lr-stat-label {
          font-size: 11px;
          font-weight: 400;
          color: #9c8a72;
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        .lr-stat-divider {
          width: 1px;
          background: rgba(0,0,0,0.1);
          align-self: stretch;
        }

        .lr-right {
          background: #0d0d0f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 52px;
          position: relative;
          overflow: hidden;
        }

        .lr-right-glow {
          position: absolute;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234,179,8,0.05) 0%, transparent 65%);
          top: -100px; right: -100px;
          pointer-events: none;
        }

        .lr-right-glow2 {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234,179,8,0.04) 0%, transparent 65%);
          bottom: -80px; left: -60px;
          pointer-events: none;
        }

        .lr-form-wrap {
          width: 100%;
          max-width: 360px;
          position: relative;
          z-index: 2;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }
        .lr-form-wrap.in { opacity: 1; transform: translateY(0); }

        .lr-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.28);
          font-size: 12.5px;
          font-weight: 400;
          text-decoration: none;
          letter-spacing: 0.04em;
          margin-bottom: 44px;
          transition: color 0.2s;
          position: relative;
        }
        .lr-back::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 1px;
          background: rgba(234,179,8,0.6);
          transition: width 0.3s ease;
        }
        .lr-back:hover { color: rgba(255,255,255,0.65); }
        .lr-back:hover::after { width: 100%; }

        .lr-form-header { margin-bottom: 38px; }

        .lr-form-welcome {
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #ca9a04;
          margin-bottom: 10px;
        }

        .lr-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 700;
          color: #f5f0e8;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }

        .lr-form-title span {
          font-style: italic;
          color: #e8b805;
        }

        .lr-form { display: flex; flex-direction: column; gap: 20px; }

        .lr-field { display: flex; flex-direction: column; gap: 8px; }

        .lr-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }

        .lr-input-box { position: relative; }

        .lr-input-ico {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.2);
          transition: color 0.25s;
          pointer-events: none;
          display: flex;
        }

        .lr-input-box.is-active .lr-input-ico { color: #e8b805; }

        .lr-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 13.5px 16px 13.5px 44px;
          color: #f0ebe3;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }

        .lr-input::placeholder { color: rgba(255,255,255,0.15); }

        .lr-input:focus {
          border-color: rgba(232,184,5,0.4);
          background: rgba(232,184,5,0.04);
          box-shadow: 0 0 0 3px rgba(232,184,5,0.07);
        }

        .lr-input.has-eye { padding-right: 46px; }

        .lr-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.2);
          transition: color 0.2s;
          padding: 3px;
          display: flex;
        }
        .lr-eye:hover { color: rgba(255,255,255,0.5); }

        .lr-submit {
          margin-top: 6px;
          width: 100%;
          padding: 15px 24px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #0d0d0f;
          background: linear-gradient(135deg, #f5c518 0%, #e8b805 40%, #d4a003 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s, opacity 0.25s;
          box-shadow: 0 6px 28px rgba(232,184,5,0.22), 0 2px 8px rgba(232,184,5,0.12);
        }

        .lr-submit::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-20deg);
          transition: left 0.55s ease;
        }

        .lr-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(232,184,5,0.3), 0 4px 12px rgba(232,184,5,0.16);
        }

        .lr-submit:hover:not(:disabled)::before { left: 160%; }
        .lr-submit:active:not(:disabled) { transform: translateY(0px); }
        .lr-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .lr-submit-arrow { transition: transform 0.25s; }
        .lr-submit:hover:not(:disabled) .lr-submit-arrow { transform: translateX(4px); }

        .lr-loader { display: flex; gap: 5px; align-items: center; }
        .lr-dot {
          width: 5px; height: 5px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          animation: lrBounce 1.1s ease-in-out infinite;
        }
        .lr-dot:nth-child(2) { animation-delay: 0.18s; }
        .lr-dot:nth-child(3) { animation-delay: 0.36s; }

        @keyframes lrBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        .lr-foot {
          margin-top: 28px;
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.22);
        }

        .lr-foot a {
          color: #ca9a04;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .lr-foot a:hover { color: #f5c518; }

        .lr-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }
        .lr-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .lr-divider-text {
          font-size: 11px;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.06em;
        }
      `}</style>

      <div className="lr-root">

        <div className="lr-left">
          <div className="lr-left-pattern" />
          <div className="lr-left-ring lr-left-ring-1" />
          <div className="lr-left-ring lr-left-ring-2" />
          <div className="lr-left-ring lr-left-ring-3" />

          <div className="lr-brand">
            <div className="lr-brand-icon">
              <div className="lr-brand-cross" />
            </div>
            <span className="lr-brand-name">MediPortal</span>
          </div>

          <div className="lr-tagblock">
            <p className="lr-tag-eyebrow">Healthcare Platform</p>
            <h2 className="lr-tag-headline">
              Your health,<br /><em>always</em><br />within reach.
            </h2>
            <p className="lr-tag-sub">
              Seamless access to your medical records, appointments, and care team — all in one place.
            </p>
          </div>

          <div className="lr-stats">
            <div>
              <div className="lr-stat-val">12k+</div>
              <div className="lr-stat-label">Patients</div>
            </div>
            <div className="lr-stat-divider" />
            <div>
              <div className="lr-stat-val">340+</div>
              <div className="lr-stat-label">Doctors</div>
            </div>
            <div className="lr-stat-divider" />
            <div>
              <div className="lr-stat-val">99.9%</div>
              <div className="lr-stat-label">Uptime</div>
            </div>
          </div>
        </div>

        <div className="lr-right">
          <div className="lr-right-glow" />
          <div className="lr-right-glow2" />

          <div className={`lr-form-wrap ${mounted ? 'in' : ''}`}>

            <Link to="/" className="lr-back">
              <ArrowUpLeft size={14} strokeWidth={2} />
              Back to home
            </Link>

            <div className="lr-form-header">
              <p className="lr-form-welcome">Portal Access</p>
              <h1 className="lr-form-title">Sign <span>in</span></h1>
            </div>

            <form className="lr-form" onSubmit={handleLogin}>
              <div className="lr-field">
                <label className="lr-label">Email</label>
                <div className={`lr-input-box ${active === 'email' ? 'is-active' : ''}`}>
                  <span className="lr-input-ico"><Mail size={15} strokeWidth={2} /></span>
                  <input
                    type="email"
                    className="lr-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setActive('email')}
                    onBlur={() => setActive(null)}
                    required
                  />
                </div>
              </div>

              <div className="lr-field">
                <label className="lr-label">Password</label>
                <div className={`lr-input-box ${active === 'password' ? 'is-active' : ''}`}>
                  <span className="lr-input-ico"><Lock size={15} strokeWidth={2} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="lr-input has-eye"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setActive('password')}
                    onBlur={() => setActive(null)}
                    required
                  />
                  <button type="button" className="lr-eye" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <div className="lr-divider">
                <div className="lr-divider-line" />
                <span className="lr-divider-text">secure login</span>
                <div className="lr-divider-line" />
              </div>

              <button type="submit" className="lr-submit" disabled={loading}>
                {loading ? (
                  <div className="lr-loader">
                    <div className="lr-dot" /><div className="lr-dot" /><div className="lr-dot" />
                  </div>
                ) : (
                  <>
                    Continue to Portal
                    <MoveRight size={16} className="lr-submit-arrow" strokeWidth={2.2} />
                  </>
                )}
              </button>
            </form>

            <p className="lr-foot">
              No account yet?&nbsp;
              <Link to="/register">Create one free</Link>
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;