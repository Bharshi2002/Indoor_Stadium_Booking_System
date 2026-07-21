import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiForgotPassword } from "../api";

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#1a2e1a", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"40px 20px" },
  card: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:24, padding:"48px 44px", width:"100%", maxWidth:440, boxShadow:"0 4px 24px rgba(22,163,74,0.08)" },
  logoRow: { display:"flex", alignItems:"center", gap:10, marginBottom:36 },
  logoIcon: { width:36, height:36, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  logoText: { fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:"#14532d" },
  logoAccent: { color:"#16a34a" },
  title: { fontFamily:"'Bebas Neue',sans-serif", fontSize:38, letterSpacing:2, color:"#14532d", marginBottom:6 },
  subtitle: { fontSize:14, color:"#6b7280", marginBottom:36, lineHeight:1.6 },
  label: { display:"block", fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#4b7a4b", marginBottom:8 },
  input: f => ({ width:"100%", padding:"12px 16px", background:"#f0f7f0", border:`1px solid ${f ? "#16a34a" : "#d1e7d1"}`, borderRadius:10, fontSize:14, color:"#14532d", outline:"none", boxSizing:"border-box", transition:"border-color .18s", marginBottom:20 }),
  btn: { width:"100%", padding:16, background:"#16a34a", border:"none", borderRadius:12, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, color:"#ffffff", cursor:"pointer", marginBottom:24 },
  btnLoading: { opacity:0.6, cursor:"not-allowed" },
  bottom: { textAlign:"center", fontSize:14, color:"#6b7280" },
  link: { color:"#16a34a", textDecoration:"none", fontWeight:600 },
  error: { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:20 },
  success: { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"14px 16px", fontSize:13, color:"#16a34a", marginBottom:20, lineHeight:1.6 },
};

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!email) { setError("Please enter your email address."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email."); return; }
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSuccess("✅ If this email is registered, a password reset link has been sent. Please check your inbox.");
      setEmail("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}>🏟️</div>
          <div style={S.logoText}>HORIZON<span style={S.logoAccent}>·INDOOR</span></div>
        </div>
        <div style={S.title}>Forgot Password</div>
        <div style={S.subtitle}>Enter your email address and we'll send you a link to reset your password.</div>

        {error   && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        {!success && (
          <>
            <label style={S.label}>Email Address</label>
            <input
              style={S.input(focused)}
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button
              style={{ ...S.btn, ...(loading ? S.btnLoading : {}) }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>
          </>
        )}

        <div style={S.bottom}>
          Remember your password? <Link to="/login" style={S.link}>Login here</Link>
        </div>
      </div>
    </div>
  );
}