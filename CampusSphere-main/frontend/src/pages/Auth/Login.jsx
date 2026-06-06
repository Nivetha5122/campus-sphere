import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ChevronDown, GraduationCap, BookOpen, Shield, Eye, EyeOff } from "lucide-react";
import { loginUser, registerUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
  { value: "student",  label: "Student",        icon: BookOpen },
  { value: "teacher",  label: "Faculty / Teacher", icon: GraduationCap },
];
const DEPARTMENTS = ["Computer Science","Electronics","Mechanical","Civil","Mathematics","Physics","Chemistry","Management","Biotechnology","Other"];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", role: "student", department: "", studentId: "", employeeId: "", designation: "" });

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await loginUser(loginForm);
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch(err) { setError(err.response?.data?.message || "Invalid credentials"); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await registerUser(regForm);
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch(err) { setError(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-accent/70 focus:bg-white/8 transition-all duration-200";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-soft/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl min-h-[600px] glass rounded-3xl overflow-hidden shadow-card grid grid-cols-1 md:grid-cols-2">

        {/* LOGIN FORM CELL (Always Left) */}
        <div className={`col-start-1 row-start-1 md:col-start-1 p-8 flex flex-col justify-center h-full transition-all duration-[700ms] ease-in-out z-10 ${isLogin ? "opacity-100 delay-100" : "opacity-0 -translate-x-20 pointer-events-none"}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <GraduationCap size={20} className="text-accent" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">CampusSphere</h1>
              <p className="text-soft text-xs">Academic Platform</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-soft text-sm mb-6">Sign in to your campus account</p>

          {error && <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type="email" placeholder="Email address" value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})} required
                className={inputCls + " pr-11"} />
            </div>
            <div className="relative">
              <input type={showPass ? "text" : "password"} placeholder="Password" value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})} required
                className={inputCls + " pr-16"} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-soft hover:text-white transition">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-accent hover:bg-soft text-white disabled:opacity-50 shadow-glow">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-soft text-sm md:hidden">
            No account?{" "}
            <button type="button" onClick={() => { setIsLogin(false); setError(""); }} className="text-accent hover:text-highlight font-medium transition">Create one</button>
          </p>
        </div>

        {/* REGISTER FORM CELL (Always Right) */}
        <div className={`col-start-1 row-start-1 md:col-start-2 p-8 flex flex-col justify-center h-full transition-all duration-[700ms] ease-in-out z-10 ${!isLogin ? "opacity-100 delay-100" : "opacity-0 translate-x-20 pointer-events-none"}`}>
          <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
          <p className="text-soft text-sm mb-5">Join your campus platform</p>

          {error && <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          <div className="flex gap-2 mb-5">
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <button key={r.value} type="button" onClick={() => setRegForm({...regForm, role: r.value})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border font-medium transition-all ${regForm.role === r.value ? "bg-accent border-accent text-white" : "border-white/10 text-soft hover:border-accent/40"}`}>
                  <Icon size={14} />{r.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="relative">
              <User size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type="text" placeholder="Full name" value={regForm.name}
                onChange={e => setRegForm({...regForm, name: e.target.value})} required
                className={inputCls + " pr-11"} />
            </div>
            <div className="relative">
              <Mail size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type="email" placeholder="Email address" value={regForm.email}
                onChange={e => setRegForm({...regForm, email: e.target.value})} required
                className={inputCls + " pr-11"} />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type="password" placeholder="Password (min 6 chars)" value={regForm.password}
                onChange={e => setRegForm({...regForm, password: e.target.value})} required minLength={6}
                className={inputCls + " pr-11"} />
            </div>

            <div className="relative">
              <select value={regForm.department} onChange={e => setRegForm({...regForm, department: e.target.value})}
                className={inputCls + " appearance-none pr-10"}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-soft pointer-events-none" />
            </div>

            {regForm.role === "student" && (
              <input placeholder="Student ID (e.g. 22BCE1234)" value={regForm.studentId}
                onChange={e => setRegForm({...regForm, studentId: e.target.value})}
                className={inputCls} />
            )}
            {regForm.role === "teacher" && (
              <>
                <input placeholder="Employee ID" value={regForm.employeeId}
                  onChange={e => setRegForm({...regForm, employeeId: e.target.value})}
                  className={inputCls} />
                <input placeholder="Designation (e.g. Asst. Professor)" value={regForm.designation}
                  onChange={e => setRegForm({...regForm, designation: e.target.value})}
                  className={inputCls} />
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-accent hover:bg-soft text-white transition disabled:opacity-50 shadow-glow mt-1">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-soft text-sm md:hidden">
            Have an account?{" "}
            <button type="button" onClick={() => { setIsLogin(true); setError(""); }} className="text-accent hover:text-highlight font-medium transition">Sign in</button>
          </p>
        </div>

        {/* THE SLIDING OVERLAY (Desktop Only) */}
        <div className={`hidden md:block absolute top-0 left-0 w-1/2 h-full grad-bg z-50 transition-transform duration-[700ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_0_40px_rgba(11,6,32,0.8)] ${!isLogin ? "translate-x-0" : "translate-x-full"}`}>
          <div className="relative w-full h-full">

            {/* LOGIN CTA ("Welcome Back") shows when overlay is on the Left / !isLogin */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-10 text-center transition-opacity duration-[400ms] ${!isLogin ? "opacity-100 delay-300" : "opacity-0 pointer-events-none duration-150"}`}>
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-glow">
                <GraduationCap size={28} className="text-highlight" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Welcome Back!</h2>
              <p className="text-soft text-sm leading-relaxed mb-8 max-w-xs">
                Already part of CampusSphere? Sign in to continue accessing your dashboard and classes.
              </p>
              <button type="button" onClick={() => { setIsLogin(true); setError(""); }}
                className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                Sign In →
              </button>
            </div>

            {/* REGISTER CTA ("New here?") shows when overlay is on the Right / isLogin */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-10 text-center transition-opacity duration-[400ms] ${isLogin ? "opacity-100 delay-300" : "opacity-0 pointer-events-none duration-150"}`}>
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-glow">
                <Shield size={28} className="text-highlight" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">New here?</h2>
              <p className="text-soft text-sm leading-relaxed mb-8 max-w-xs">
                Join CampusSphere — access attendance, grades, notes, events and more from one unified platform.
              </p>
              <button type="button" onClick={() => { setIsLogin(false); setError(""); }}
                className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                Create Account →
              </button>
              <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-xs">
                {[["📚","Notes"],["📊","Grades"],["🗓","Attendance"]].map(([e,l]) => (
                  <div key={l} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-xl mb-1">{e}</div>
                    <div className="text-xs text-soft">{l}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
