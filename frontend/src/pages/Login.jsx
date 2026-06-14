import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiLogin } from "../api";

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#14532d", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" },
  lines: { position:"fixed", inset:0, background:"repeating-linear-gradient(90deg,transparent,transparent 120px,rgba(255,255,255,0.015) 120px,rgba(255,255,255,0.015) 121px),repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(255,255,255,0.015) 80px,rgba(255,255,255,0.015) 81px)", pointerEvents:"none", zIndex:0 },
  card: { position:"relative", zIndex:1, background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:24, padding:"48px 44px", width:"100%", maxWidth:440, boxShadow:"0 24px 64px rgba(0,0,0,0.4)" },
  logoRow: { display:"flex", alignItems:"center", gap:10, marginBottom:36 },
  logoIcon: { width:36, height:36, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  logoText: { fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:"#14532d" },
  logoAccent: { color:"#16a34a" },
  title: { fontFamily:"'Bebas Neue',sans-serif", fontSize:38, letterSpacing:2, color:"#14532d", marginBottom:6 },
  subtitle: { fontSize:14, color:"#6b7280", marginBottom:36 },
  label: { display:"block", fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#6b7280", marginBottom:8 },
  input: (f) => ({ width:"100%", padding:"12px 16px", background:"#f0f7f0", border:`1px solid ${f ? "#16a34a" : "#d1e7d1"}`, borderRadius:10, fontSize:14, color:"#14532d", outline:"none", boxSizing:"border-box", transition:"border-color .18s", marginBottom:20 }),
  btn: { width:"100%", padding:16, background:"#16a34a", border:"none", borderRadius:12, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, color:"#f0f7f0", cursor:"pointer", marginTop:8, marginBottom:24 },
  btnLoading: { opacity:0.6, cursor:"not-allowed" },
  bottom: { textAlign:"center", fontSize:14, color:"#6b7280" },
  link: { color:"#16a34a", textDecoration:"none", fontWeight:600 },
  error: { background:"#fef2f2", border:"1px solid #dc2626", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:20 },
  success: { background:"#dcfce7", border:"1px solid #16a34a", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#16a34a", marginBottom:20 },
};

export default function Login() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email:"", password:"" });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const data = await apiLogin(form.email, form.password);
      setSuccess(`Welcome back, ${data.user.username}!`);
      setTimeout(() => navigate(data.user.role === "admin" ? "/admin" : "/dashboard"), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page} className="auth-page">
      <div style={S.lines} />
      <div style={S.card} className="auth-card">
        <div style={S.logoRow}>
          <div style={S.logoIcon}>🏟️</div>
          <div style={S.logoText}>HORIZON<span style={S.logoAccent}>·INDOOR</span></div>
        </div>
        <div style={S.title} className="auth-title">Welcome Back</div>
        <div style={S.subtitle}>Login to manage your bookings</div>

        {error   && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        <label style={S.label}>Email</label>
        <input style={S.input(focused==="email")} type="email" placeholder="you@email.com"
          value={form.email} onChange={e => setForm({...form, email:e.target.value})}
          onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
          onKeyDown={e => e.key==="Enter" && handleSubmit()} />

        <label style={S.label}>Password</label>
        <div style={{ position:"relative", marginBottom:20 }}>
          <input style={{ ...S.input(focused==="password"), paddingRight:44, marginBottom:0 }}
            type={showPass ? "text" : "password"} placeholder="Enter your password"
            value={form.password} onChange={e => setForm({...form, password:e.target.value})}
            onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
            onKeyDown={e => e.key==="Enter" && handleSubmit()} />
          <button type="button" onClick={() => setShowPass(s => !s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#6b7280", fontSize:16, padding:0 }}>
            {showPass ? (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
          </button>
        </div>
        <div style={{ textAlign:"right", marginBottom:16 }}>
          <a href="/forgot-password" style={{ fontSize:12, color:"#16a34a", textDecoration:"none", fontWeight:500 }}>Forgot Password?</a>
        </div>

        <button style={{...S.btn, ...(loading ? S.btnLoading : {})}} onClick={handleSubmit} disabled={loading}>
          {loading ? "LOGGING IN..." : "LOGIN"}
        </button>
        <div style={S.bottom}>
          Don't have an account? <Link to="/register" style={S.link}>Register here</Link>
        </div>
      </div>
    </div>
  );
}