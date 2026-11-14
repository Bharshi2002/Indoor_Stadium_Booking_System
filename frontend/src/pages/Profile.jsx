import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, updateMe, isLoggedIn, getRole } from "../api";

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#14532d", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" },
  card: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:24, padding:"48px 44px", width:"100%", maxWidth:520, boxShadow:"0 4px 24px rgba(22,163,74,0.08)" },
  avatarRow: { display:"flex", alignItems:"center", gap:20, marginBottom:40 },
  avatar: { width:72, height:72, background:"#bbf7d0", border:"2px solid #16a34a", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:700, color:"#16a34a", fontFamily:"'Bebas Neue',sans-serif", flexShrink:0 },
  avatarInfo: {},
  avatarName: { fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, color:"#14532d", lineHeight:1 },
  avatarSub: { fontSize:13, color:"#6b7280", marginTop:4 },
  roleBadge: r => ({ display:"inline-block", marginTop:6, fontSize:10, fontWeight:600, padding:"2px 10px", borderRadius:20, background: r==="admin" ? "#fefce8" : "#dcfce7", border: `1px solid ${r==="admin" ? "#b45309" : "#16a34a"}`, color: r==="admin" ? "#b45309" : "#16a34a" }),
  divider: { height:1, background:"#d1e7d1", marginBottom:28 },
  sectionTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:2, color:"#14532d", marginBottom:20 },
  row: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  fw: { marginBottom:20 },
  label: { display:"block", fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#4b7a4b", marginBottom:8 },
  value: { fontSize:14, color:"#14532d", padding:"12px 16px", background:"#f0f7f0", borderRadius:10, border:"1px solid #d1e7d1" },
  input: f => ({ width:"100%", padding:"12px 16px", background:"#f0f7f0", border:`1px solid ${f ? "#16a34a" : "#d1e7d1"}`, borderRadius:10, fontSize:14, color:"#14532d", outline:"none", boxSizing:"border-box", transition:"border-color .18s" }),
  btnRow: { display:"flex", gap:10, marginTop:8 },
  btnEdit: { flex:1, padding:"13px", background:"#16a34a", border:"none", borderRadius:10, fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, color:"#ffffff", cursor:"pointer" },
  btnCancel: { padding:"13px 20px", background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:"#6b7280", cursor:"pointer" },
  btnSave: { flex:1, padding:"13px", background:"#16a34a", border:"none", borderRadius:10, fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, color:"#ffffff", cursor:"pointer" },
  error: { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:16 },
  success: { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#16a34a", marginBottom:16 },
  statRow: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:28 },
  statCard: { background:"#f0fdf4", border:"1px solid #d1e7d1", borderRadius:12, padding:"16px 20px" },
  statNum: { fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#16a34a", lineHeight:1 },
  statLabel: { fontSize:12, color:"#6b7280", marginTop:4 },
};

export default function Profile() {
  const navigate = useNavigate();
  const [user,    setUser]    = useState(null);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ first_name:"", last_name:"", phone:"" });
  const [focused, setFocused] = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    getMe().then(d => {
      setUser(d.user);
      setForm({ first_name: d.user.first_name, last_name: d.user.last_name, phone: d.user.phone || "" });
    }).catch(() => navigate("/login"));
  }, [navigate]);

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!form.first_name || !form.last_name) { setError("Name fields cannot be empty."); return; }
    setLoading(true);
    try {
      const d = await updateMe(form);
      setUser(d.user);
      setSuccess("Profile updated successfully!");
      setEditing(false);
      // Update username in localStorage if name changed
      localStorage.setItem("username", d.user.username);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div style={{ ...S.page }}>
      <div style={{ color:"#6b7280", fontSize:14 }}>Loading...</div>
    </div>
  );

  const role = getRole();
  const initial = (user.first_name || user.username || "U").charAt(0).toUpperCase();

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Avatar row */}
        <div style={S.avatarRow}>
          <div style={S.avatar}>{initial}</div>
          <div style={S.avatarInfo}>
            <div style={S.avatarName}>{user.first_name} {user.last_name}</div>
            <div style={S.avatarSub}>@{user.username}</div>
            <span style={S.roleBadge(role)}>
              {role === "admin" ? "⚡ Admin" : "👤 Member"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={S.statRow}>
          <div style={S.statCard}>
            <div style={S.statNum}>{user.bookings_count || 0}</div>
            <div style={S.statLabel}>Total Bookings</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statNum}>{user.joined || "—"}</div>
            <div style={S.statLabel}>Member Since</div>
          </div>
        </div>

        <div style={S.divider} />

        {/* Messages */}
        {error   && <div style={S.error}>{error}</div>}
        {success && <div style={S.success}>{success}</div>}

        {/* Profile details */}
        <div style={S.sectionTitle}>Profile Details</div>

        {!editing ? (
          /* View mode */
          <>
            <div style={S.row} className="auth-row">
              <div style={S.fw}>
                <label style={S.label}>First Name</label>
                <div style={S.value}>{user.first_name}</div>
              </div>
              <div style={S.fw}>
                <label style={S.label}>Last Name</label>
                <div style={S.value}>{user.last_name}</div>
              </div>
            </div>
            <div style={S.fw}>
              <label style={S.label}>Username</label>
              <div style={S.value}>@{user.username}</div>
            </div>
            <div style={S.fw}>
              <label style={S.label}>Email</label>
              <div style={S.value}>{user.email}</div>
            </div>
            <div style={S.fw}>
              <label style={S.label}>Phone</label>
              <div style={S.value}>{user.phone || "—"}</div>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnEdit} onClick={() => setEditing(true)}>EDIT PROFILE</button>
            </div>
          </>
        ) : (
          /* Edit mode */
          <>
            <div style={S.row} className="auth-row">
              <div style={S.fw}>
                <label style={S.label}>First Name</label>
                <input
                  style={S.input(focused === "first_name")}
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  onFocus={() => setFocused("first_name")}
                  onBlur={() => setFocused("")}
                />
              </div>
              <div style={S.fw}>
                <label style={S.label}>Last Name</label>
                <input
                  style={S.input(focused === "last_name")}
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  onFocus={() => setFocused("last_name")}
                  onBlur={() => setFocused("")}
                />
              </div>
            </div>
            {/* Username and email — read only */}
            <div style={S.fw}>
              <label style={S.label}>Username <span style={{ color:"#9ca3af", fontSize:9 }}>(cannot change)</span></label>
              <div style={{ ...S.value, color:"#9ca3af" }}>@{user.username}</div>
            </div>
            <div style={S.fw}>
              <label style={S.label}>Email <span style={{ color:"#9ca3af", fontSize:9 }}>(cannot change)</span></label>
              <div style={{ ...S.value, color:"#9ca3af" }}>{user.email}</div>
            </div>
            <div style={S.fw}>
              <label style={S.label}>Phone</label>
              <input
                style={S.input(focused === "phone")}
                value={form.phone}
                placeholder="0771234567 or +94771234567"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^\d+\s]/g, "") }))}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused("")}
                maxLength={20}
              />
            </div>
            <div style={S.btnRow}>
              <button style={S.btnCancel} onClick={() => { setEditing(false); setError(""); }}>Cancel</button>
              <button style={{ ...S.btnSave, opacity: loading ? 0.6 : 1 }} onClick={handleSave} disabled={loading}>
                {loading ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}