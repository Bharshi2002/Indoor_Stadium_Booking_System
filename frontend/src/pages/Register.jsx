import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRegister } from "../api";

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#1a2e1a", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"40px 20px" },
  card: { position:"relative", zIndex:1, background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:24, padding:"48px 44px", width:"100%", maxWidth:480, boxShadow:"0 4px 24px rgba(22,163,74,0.08)" },
  logoRow: { display:"flex", alignItems:"center", gap:10, marginBottom:36 },
  logoIcon: { width:36, height:36, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  logoText: { fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:"#14532d" },
  logoAccent: { color:"#16a34a" },
  title: { fontFamily:"'Bebas Neue',sans-serif", fontSize:38, letterSpacing:2, color:"#14532d", marginBottom:6 },
  subtitle: { fontSize:14, color:"#6b7280", marginBottom:36 },
  row: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  fw: { marginBottom:20 },
  label: { display:"block", fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#4b7a4b", marginBottom:8 },
  input: (f) => ({ width:"100%", padding:"12px 16px", background:"#f0f7f0", border:`1px solid ${f ? "#16a34a" : "#d1e7d1"}`, borderRadius:10, fontSize:14, color:"#14532d", outline:"none", boxSizing:"border-box", transition:"border-color .18s" }),
  adminToggle: { display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"#f0f7f0", border:"1px solid #d1e7d1", borderRadius:10, marginBottom:20, cursor:"pointer" },
  adminBox: (c) => ({ width:18, height:18, borderRadius:4, border:`2px solid ${c ? "#16a34a" : "#d1e7d1"}`, background: c ? "#16a34a" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .18s" }),
  adminLabel: { fontSize:13, fontWeight:500, color:"#6b7280" },
  adminNote: { background:"#fefce8", border:"1px solid #fde68a", borderRadius:10, padding:"14px 16px", marginBottom:20 },
  adminNoteText: { fontSize:11, color:"#b45309", marginBottom:8 },
  btn: { width:"100%", padding:16, background:"#16a34a", border:"none", borderRadius:12, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, color:"#ffffff", cursor:"pointer", marginTop:8, marginBottom:24 },
  btnLoading: { opacity:0.6, cursor:"not-allowed" },
  bottom: { textAlign:"center", fontSize:14, color:"#6b7280" },
  link: { color:"#16a34a", textDecoration:"none", fontWeight:600 },
  error: { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:20 },
  success: { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#16a34a", marginBottom:20 },
  passWrap: { position:"relative" },
  eyeBtn: { position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#6b7280", padding:0 },
};

const EyeOpen   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeClosed = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

export default function Register() {
  const navigate = useNavigate();

  const [form,     setForm]     = useState({ firstName:"", lastName:"", username:"", email:"", phone:"", password:"", confirm:"", adminCode:"" });
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const set   = f => e => setForm({ ...form, [f]: e.target.value });
  const inp   = f => S.input(focused === f);
  const focus = f => () => setFocused(f);
  const blur  = () => setFocused("");

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const { firstName, lastName, username, email, phone, password, confirm, adminCode } = form;

    if (!firstName || !lastName || !username || !email || !phone || !password || !confirm) {
      setError("Please fill in all fields."); return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email."); return; }

    // Phone validation — Sri Lanka format
    const cleanPhone = phone.replace(/\s+/g, "");
    const sriLankaPhone = /^(\+94[0-9]{9}|0[0-9]{9})$/;
    if (!sriLankaPhone.test(cleanPhone)) {
      setError("Enter a valid Sri Lanka phone number (e.g. 0771234567 or +94771234567)"); return;
    }

    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (isAdmin && !adminCode) { setError("Please enter the admin secret code."); return; }

    setLoading(true);
    try {
      const data = await apiRegister({
        first_name:            firstName,
        last_name:             lastName,
        username,
        email,
        phone,
        password,
        password_confirmation: confirm,
        role:                  isAdmin ? "admin" : "user",
        admin_code:            isAdmin ? adminCode : undefined,
      });
      setSuccess(`Account created! Welcome, ${data.user.username}`);
      setTimeout(() => navigate(data.user.role === "admin" ? "/admin" : "/dashboard"), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page} className="auth-page">
      <div style={S.card} className="auth-card">
        <div style={S.logoRow}>
          <div style={S.logoIcon}>🏟️</div>
          <div style={S.logoText}>HORIZON<span style={S.logoAccent}>·INDOOR</span></div>
        </div>
        <div style={S.title} className="auth-title">Create Account</div>
        <div style={S.subtitle}>Join Horizon Indoor and start booking today</div>

        {error   && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        {/* Name row */}
        <div style={S.row} className="auth-row">
          <div style={S.fw}>
            <label style={S.label}>First Name</label>
            <input style={inp("firstName")} type="text" placeholder="First name"
              value={form.firstName} onChange={set("firstName")} onFocus={focus("firstName")} onBlur={blur} />
          </div>
          <div style={S.fw}>
            <label style={S.label}>Last Name</label>
            <input style={inp("lastName")} type="text" placeholder="Last name"
              value={form.lastName} onChange={set("lastName")} onFocus={focus("lastName")} onBlur={blur} />
          </div>
        </div>

        {/* Username */}
        <div style={S.fw}>
          <label style={S.label}>Username</label>
          <input style={inp("username")} type="text" placeholder="Choose a username"
            value={form.username} onChange={set("username")} onFocus={focus("username")} onBlur={blur} />
        </div>

        {/* Email */}
        <div style={S.fw}>
          <label style={S.label}>Email</label>
          <input style={inp("email")} type="email" placeholder="Your email address"
            value={form.email} onChange={set("email")} onFocus={focus("email")} onBlur={blur} />
        </div>

        {/* Phone */}
        <div style={S.fw}>
          <label style={S.label}>Phone Number</label>
          <input style={inp("phone")} type="tel" placeholder="0771234567 or +94771234567"
            value={form.phone}
            onChange={e => {
              const val = e.target.value.replace(/[^\d+\s]/g, "");
              setForm(f => ({ ...f, phone: val }));
            }}
            onFocus={focus("phone")} onBlur={blur} maxLength={15} />
        </div>

        {/* Password */}
        <div style={S.fw}>
          <label style={S.label}>Password</label>
          <div style={S.passWrap}>
            <input style={{ ...inp("password"), paddingRight:44 }} type={showPass ? "text" : "password"}
              placeholder="Min 6 characters" value={form.password}
              onChange={set("password")} onFocus={focus("password")} onBlur={blur} />
            <button style={S.eyeBtn} type="button" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div style={S.fw}>
          <label style={S.label}>Confirm Password</label>
          <div style={S.passWrap}>
            <input style={{ ...inp("confirm"), paddingRight:44 }} type={showPass2 ? "text" : "password"}
              placeholder="Repeat your password" value={form.confirm}
              onChange={set("confirm")} onFocus={focus("confirm")} onBlur={blur} />
            <button style={S.eyeBtn} type="button" onClick={() => setShowPass2(s => !s)}>
              {showPass2 ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
        </div>

        {/* Admin toggle */}
        <div style={S.adminToggle} onClick={() => setIsAdmin(a => !a)}>
          <div style={S.adminBox(isAdmin)}>
            {isAdmin && <span style={{ fontSize:11, color:"#ffffff", fontWeight:700 }}>✓</span>}
          </div>
          <span style={S.adminLabel}>Register as Admin</span>
        </div>

        {isAdmin && (
          <div style={S.adminNote}>
            <div style={S.adminNoteText}>⚠️ Enter the admin secret code provided by your system administrator</div>
            <input style={{ ...inp("adminCode"), marginTop:4 }} type="password" placeholder="Admin secret code"
              value={form.adminCode} onChange={set("adminCode")} onFocus={focus("adminCode")} onBlur={blur} />
          </div>
        )}

        <button style={{ ...S.btn, ...(loading ? S.btnLoading : {}) }} onClick={handleSubmit} disabled={loading}>
          {loading ? "CREATING..." : "CREATE ACCOUNT"}
        </button>

        <div style={S.bottom}>
          Already have an account? <Link to="/login" style={S.link}>Login here</Link>
        </div>
      </div>
    </div>
  );
}