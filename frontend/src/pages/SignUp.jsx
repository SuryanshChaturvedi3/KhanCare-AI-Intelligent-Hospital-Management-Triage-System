import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { User, Mail, Lock, Phone, ArrowUpLeft, MoveRight, Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password, phone });
      alert(res.data.message || "Registration Successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sr-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Outfit', sans-serif;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .sr-root { grid-template-columns: 1fr; }
          .sr-left { display: none; }
        }

        .sr-left {
          background: #f0ebe3;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 52px;
          overflow: hidden;
        }

        .sr-left-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(180,160,130,0.18) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }

        .sr-left-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(160,130,90,0.12);
        }
        .sr-left-ring-1 { width: 600px; height: 600px; top: -200px; left: -200px; }
        .sr-left-ring-2 { width: 400px; height: 400px; top: -100px; left: -100px; }

        .sr-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .sr-brand-icon {
          width: 36px; height: 36px;
          background: #1a1a1a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sr-brand-cross {
          width: 16px; height: 16px;
          position: relative;
        }
        .sr-brand-cross::before, .sr-brand-cross::after {
          content: '';
          position: absolute;
          background: #f0ebe3;
          border-radius: 2px;
        }
        .sr-brand-cross::before { width: 4px; height: 16px; left: 6px; top: 0; }
        .sr-brand-cross::after { width: 16px; height: 4px; left: 0; top: 6px; }

        .sr-brand-name {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          letter-spacing: 0.03em;
        }

        .sr-tagblock {
          position: relative;
          z-index: 2;
        }

        .sr-tag-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9c8a72;
          margin-bottom: 18px;
        }

        .sr-tag-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(42px, 5vw, 58px);
          font-weight: 900;
          color: #1a1a1a;
          line-height: 1.08;
          letter-spacing: -0.02em;
        }

        .sr-tag-headline em {
          font-style: italic;
          color: #6b5c45;
        }

        .sr-tag-sub {
          font-size: 14px;
          font-weight: 300;
          color: #7a6a58;
          margin-top: 20px;
          line-height: 1.7;
          max-width: 280px;
        }

        .sr-stats {
          display: flex;
          gap: 32px;
          position: relative;
          z-index: 2;
        }

        .sr-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .sr-stat-label {
          font-size: 11px;
          font-weight: 400;
          color: #9c8a72;
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        .sr-stat-divider {
          width: 1px;
          background: rgba(0,0,0,0.1);
          align-self: stretch;
        }

        .sr-right {
          background: #0d0d0f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 52px;
          position: relative;
          overflow: hidden;
        }

        .sr-right-glow {
          position: absolute;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%);
          top: -100px; right: -100px;
          pointer-events: none;
        }

        .sr-form-wrap {
          width: 100%;
          max-width: 380px;
          position: relative;
          z-index: 2;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }
        .sr-form-wrap.in { opacity: 1; transform: translateY(0); }

        .sr-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.28);
          font-size: 12.5px;
          font-weight: 400;
          text-decoration: none;
          letter-spacing: 0.04em;
          margin-bottom: 36px;
          transition: color 0.2s;
        }
        .sr-back:hover { color: rgba(255,255,255,0.65); }

        .sr-form-header { margin-bottom: 32px; }

        .sr-form-welcome {
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #10b981;
          margin-bottom: 10px;
        }

        .sr-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 700;
          color: #f5f0e8;
          line-height: 1.15;
        }

        .sr-form-title span {
          font-style: italic;
          color: #10b981;
        }

        .sr-form { display: flex; flex-direction: column; gap: 16px; }

        .sr-field { display: flex; flex-direction: column; gap: 6px; }

        .sr-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }

        .sr-input-box { position: relative; }

        .sr-input-ico {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.2);
          transition: color 0.25s;
          pointer-events: none;
          display: flex;
        }

        .sr-input-box.is-active .sr-input-ico { color: #10b981; }

        .sr-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 16px 12px 44px;
          color: #f0ebe3;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }

        .sr-input::placeholder { color: rgba(255,255,255,0.15); }

        .sr-input:focus {
          border-color: rgba(16,185,129,0.4);
          background: rgba(16,185,129,0.04);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.07);
        }

        .sr-input.has-eye { padding-right: 46px; }

        .sr-eye {
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
        .sr-eye:hover { color: rgba(255,255,255,0.5); }

        .sr-submit {
          margin-top: 6px;
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #fff;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s, opacity 0.25s;
          box-shadow: 0 6px 28px rgba(16,185,129,0.22), 0 2px 8px rgba(16,185,129,0.12);
        }

        .sr-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(16,185,129,0.3), 0 4px 12px rgba(16,185,129,0.16);
        }
        .sr-submit:active:not(:disabled) { transform: translateY(0px); }
        .sr-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .sr-submit-arrow { transition: transform 0.25s; }
        .sr-submit:hover:not(:disabled) .sr-submit-arrow { transform: translateX(4px); }

        .sr-loader { display: flex; gap: 5px; align-items: center; }
        .sr-dot {
          width: 5px; height: 5px;
          background: rgba(255,255,255,0.6);
          border-radius: 50%;
          animation: srBounce 1.1s ease-in-out infinite;
        }
        .sr-dot:nth-child(2) { animation-delay: 0.18s; }
        .sr-dot:nth-child(3) { animation-delay: 0.36s; }

        @keyframes srBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        .sr-foot {
          margin-top: 24px;
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.22);
        }

        .sr-foot a {
          color: #10b981;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .sr-foot a:hover { color: #34d399; }
      `}</style>

      <div className="sr-root">

        <div className="sr-left">
          <div className="sr-left-pattern" />
          <div className="sr-left-ring sr-left-ring-1" />
          <div className="sr-left-ring sr-left-ring-2" />

          <div className="sr-brand">
            <div className="sr-brand-icon">
              <div className="sr-brand-cross" />
            </div>
            <span className="sr-brand-name">KhanCare</span>
          </div>

          <div className="sr-tagblock">
            <p className="sr-tag-eyebrow">Join Today</p>
            <h2 className="sr-tag-headline">
              Your care,<br /><em>our</em><br />commitment.
            </h2>
            <p className="sr-tag-sub">
              Register once, access everything — appointments, AI health assistant, and live queue tracking.
            </p>
          </div>

          <div className="sr-stats">
            <div>
              <div className="sr-stat-val">Free</div>
              <div className="sr-stat-label">Forever</div>
            </div>
            <div className="sr-stat-divider" />
            <div>
              <div className="sr-stat-val">30s</div>
              <div className="sr-stat-label">To Register</div>
            </div>
            <div className="sr-stat-divider" />
            <div>
              <div className="sr-stat-val">AI</div>
              <div className="sr-stat-label">Powered</div>
            </div>
          </div>
        </div>

        <div className="sr-right">
          <div className="sr-right-glow" />

          <div className={`sr-form-wrap ${mounted ? 'in' : ''}`}>

            <Link to="/" className="sr-back">
              <ArrowUpLeft size={14} strokeWidth={2} />
              Back to home
            </Link>

            <div className="sr-form-header">
              <p className="sr-form-welcome">Create Account</p>
              <h1 className="sr-form-title">Sign <span>up</span></h1>
            </div>

            <form className="sr-form" onSubmit={handleSignup}>
              <div className="sr-field">
                <label className="sr-label">Full Name</label>
                <div className={`sr-input-box ${active === 'name' ? 'is-active' : ''}`}>
                  <span className="sr-input-ico"><User size={15} strokeWidth={2} /></span>
                  <input
                    type="text"
                    className="sr-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setActive('name')}
                    onBlur={() => setActive(null)}
                    required
                  />
                </div>
              </div>

              <div className="sr-field">
                <label className="sr-label">Email</label>
                <div className={`sr-input-box ${active === 'email' ? 'is-active' : ''}`}>
                  <span className="sr-input-ico"><Mail size={15} strokeWidth={2} /></span>
                  <input
                    type="email"
                    className="sr-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setActive('email')}
                    onBlur={() => setActive(null)}
                    required
                  />
                </div>
              </div>

              <div className="sr-field">
                <label className="sr-label">Phone</label>
                <div className={`sr-input-box ${active === 'phone' ? 'is-active' : ''}`}>
                  <span className="sr-input-ico"><Phone size={15} strokeWidth={2} /></span>
                  <input
                    type="tel"
                    className="sr-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onFocus={() => setActive('phone')}
                    onBlur={() => setActive(null)}
                    required
                  />
                </div>
              </div>

              <div className="sr-field">
                <label className="sr-label">Password</label>
                <div className={`sr-input-box ${active === 'password' ? 'is-active' : ''}`}>
                  <span className="sr-input-ico"><Lock size={15} strokeWidth={2} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="sr-input has-eye"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setActive('password')}
                    onBlur={() => setActive(null)}
                    required
                  />
                  <button type="button" className="sr-eye" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="sr-submit" disabled={loading}>
                {loading ? (
                  <div className="sr-loader">
                    <div className="sr-dot" /><div className="sr-dot" /><div className="sr-dot" />
                  </div>
                ) : (
                  <>
                    Create Account
                    <MoveRight size={16} className="sr-submit-arrow" strokeWidth={2.2} />
                  </>
                )}
              </button>
            </form>

            <p className="sr-foot">
              Already have an account?&nbsp;
              <Link to="/login">Sign in</Link>
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
