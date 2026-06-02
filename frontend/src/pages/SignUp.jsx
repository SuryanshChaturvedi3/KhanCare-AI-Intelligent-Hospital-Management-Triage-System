import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  Phone,
  UserPlus,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          name,
          email,
          password,
          phone,
        }
      );

      alert(res.data.message || "Registration Successful!");
      navigate("/login");

    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl">

        <div className="text-center mb-8">
          <UserPlus size={32} className="mx-auto text-cyan-500 mb-4" />
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">

          <input
            type="text"
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg bg-black text-white border border-gray-700"
            required
          />

          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-black text-white border border-gray-700"
            required
          />

          <input
            type="tel"
            placeholder="Phone"
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded-lg bg-black text-white border border-gray-700"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-black text-white border border-gray-700"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

        </form>

        <p className="text-center mt-4 text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-500">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Signup;
