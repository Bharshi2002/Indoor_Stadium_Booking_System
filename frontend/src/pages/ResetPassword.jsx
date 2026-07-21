import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiResetPassword } from "../api";

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#1a2e1a", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"40px 20px" },
  card: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:24, padding:"48px 44px", width:"100%", maxWidth:440, boxShadow:"0 4px 24px rgba(22,163,74,0.08)" },
  logoRow: { display:"flex", alignItems:"center", gap:10, marginBottom:36 },
  logoIcon: { width:36, height:36, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  logoText: { fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:"#14532d" },
  logoAccent: { color:"#16a34a" },
  title: { fontFamily:"'Bebas Neue',sans-serif", fontSize:38, letterSpacing:2, color:"#14532d", marginBottom:6 },
  subtitle: { fontSize:14, color:"#6b7280", marginBottom:36 },
  label: { display:"block", fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#4b7a4b", marginBottom:8 },
  input: f => ({ width:"100%", padding:"12px 16px", background:"#f0f7f0", border:`1px solid ${f ? "#16a34a" : "#d1e7d1"}`, borderRadius:10, fontSize:14, color:"#14532d", outline:"none", boxSizing:"border-box", transition:"border-color .18s", marginBottom:20 }),
  btn: { width:"100%", padding:16, background:"#16a34a", border:"none", borderRadius:12, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, color:"#ffffff", cursor:"pointer", marginBottom:24 },
  btnLoading: { opacity:0.6, cursor:"not-allowed" },
  bottom: { textAlign:"center", fontSize:14, color:"#6b7280" },
  link: { color:"#16a34a", textDecoration:"none", fontWeight:600 },
  error: { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:20 },
  success: { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"14px 16px", fontSize:13, color:"#16a34a", marginBottom:20, lineHeight:1.6 },
  passWrap: { position:"relative", marginBottom:20 },
  eyeBtn: { position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#6b7280", fontSize:16, padding:0 },
};

export default function ResetPassword() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const token           = searchParams.get("token");
  const email           = searchParams.get("email");

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [focused,   setFocused]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    if (!token || !email) setError("Invalid reset link. Please request a new one.");
    return () => document.head.removeChild(link);
  }, [token, email]);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!password || !confirm) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await apiResetPassword(email, token, password, confirm);
      setSuccess("✅ Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const EyeOpen   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const EyeClosed = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}>🏟️</div>
          <div style={S.logoText}>HORIZON<span style={S.logoAccent}>·INDOOR</span></div>
        </div>
        <div style={S.title}>Reset Password</div>
        <div style={S.subtitle}>Enter your new password below.</div>

        {error   && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success} Redirecting to login...</div>}

        {!success && !error.includes("Invalid reset") && (
          <>
            <label style={S.label}>New Password</label>
            <div style={S.passWrap}>
              <input
                style={{ ...S.input(focused==="pass"), paddingRight:44, marginBottom:0 }}
                type={showPass ? "text" : "password"}
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused("")}
              />
              <button style={S.eyeBtn} type="button" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>

            <label style={S.label}>Confirm New Password</label>
            <div style={S.passWrap}>
              <input
                style={{ ...S.input(focused==="confirm"), paddingRight:44, marginBottom:0 }}
                type={showPass2 ? "text" : "password"}
                placeholder="Repeat new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onFocus={() => setFocused("confirm")}
                onBlur={() => setFocused("")}
              />
              <button style={S.eyeBtn} type="button" onClick={() => setShowPass2(s => !s)}>
                {showPass2 ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>

            <button
              style={{ ...S.btn, ...(loading ? S.btnLoading : {}) }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "RESETTING..." : "RESET PASSWORD"}
            </button>
          </>
        )}

        <div style={S.bottom}>
          <Link to="/login" style={S.link}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}