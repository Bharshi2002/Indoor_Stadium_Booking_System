import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings, isLoggedIn, getRole, getUsername } from "../api";

const ICONS = {
  "Football":              "⚽",
  "Cricket 1":             "🏏",
  "Cricket 2":             "🏏",
  "Cricket Practice Net":  "🏏",
  "Badminton Court 1":     "🏸",
  "Badminton Court 2":     "🏸",
  "Volleyball Court":      "🏐",
  "Pool Table":            "🎱",
};

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#14532d", position:"relative" },
  lines: { position:"fixed", inset:0, background:"repeating-linear-gradient(90deg,transparent,transparent 120px,rgba(255,255,255,0.015) 120px,rgba(255,255,255,0.015) 121px),repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(255,255,255,0.015) 80px,rgba(255,255,255,0.015) 81px)", pointerEvents:"none", zIndex:0 },
  inner: { position:"relative", zIndex:1, maxWidth:1000, margin:"0 auto", padding:"48px 40px" },
  pageLabel: { fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:4, color:"#16a34a", textTransform:"uppercase", marginBottom:8 },
  pageTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:52, letterSpacing:2, lineHeight:1, color:"#14532d", marginBottom:48 },
  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:48 },
  statCard: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"24px 20px", position:"relative", overflow:"hidden" },
  statAccent: { position:"absolute", top:0, left:0, right:0, height:2, background:"#16a34a" },
  statNum: { fontFamily:"'Bebas Neue',sans-serif", fontSize:40, color:"#16a34a", letterSpacing:2, lineHeight:1 },
  statLabel: { fontSize:12, color:"#6b7280", marginTop:6, fontWeight:500 },
  sectionTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, color:"#14532d", marginBottom:20 },
  card: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"20px 24px", marginBottom:12, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" },
  cardIcon: { width:48, height:48, background:"#f0f7f0", border:"1px solid #d1e7d1", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 },
  cardInfo: { flex:1 },
  cardFacility: { fontSize:15, fontWeight:600, color:"#14532d", marginBottom:4 },
  cardMeta: { fontSize:12, color:"#6b7280" },
  cardSlots: { display:"flex", flexWrap:"wrap", gap:6, marginTop:8 },
  slotPill: n => ({ display:"inline-block", background: n?"#eff6ff":"#dcfce7", border:`1px solid ${n?"#93c5fd":"#16a34a"}`, borderRadius:6, padding:"2px 8px", fontSize:11, color: n?"#3b82f6":"#16a34a", fontWeight:500 }),
  cardTotal: { fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#16a34a", letterSpacing:1, flexShrink:0 },
  confirmedBadge: { display:"inline-flex", alignItems:"center", gap:4, background:"#dcfce7", border:"1px solid #16a34a", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600, color:"#16a34a", flexShrink:0 },
  emptyBox: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"60px 40px", textAlign:"center" },
  emptyIcon: { fontSize:48, marginBottom:16, display:"block" },
  emptyTitle: { fontSize:18, fontWeight:600, color:"#6b7280", marginBottom:8 },
  emptyText: { fontSize:14, color:"#d1e7d1" },
  btnBook: { display:"inline-block", marginTop:24, textDecoration:"none", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:3, padding:"14px 32px", borderRadius:10, background:"#16a34a", color:"#f0f7f0", cursor:"pointer", border:"none" },
  loading: { textAlign:"center", color:"#6b7280", padding:"60px 0", fontSize:15 },
};

export default function Dashboard() {
  const navigate  = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    if (getRole() === "admin") { navigate("/admin"); return; }
    setUsername(getUsername());
    getMyBookings()
      .then(d => setBookings(d.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const totalSpent   = bookings.reduce((s,b) => s + (b.total||0), 0);
  const totalHours   = bookings.reduce((s,b) => s + (b.slots?.length||0), 0);
  const uniqueCourts = new Set(bookings.map(b => b.facility)).size;

  return (
    <div style={S.page}>
      <div style={S.lines} />
      <div style={S.inner} className="dashboard-inner">
        <div style={S.pageLabel}>My Account</div>
        <div style={S.pageTitle} className="dashboard-title">
          Welcome, <span style={{ color:"#16a34a" }}>{username}</span>
        </div>

        <div style={S.statsRow} className="dashboard-stats">
          {[
            { num: bookings.length,                    label:"Total Bookings" },
            { num: `${totalHours} hrs`,                label:"Hours Booked" },
            { num: uniqueCourts,                       label:"Courts Used" },
            { num: `LKR ${totalSpent.toLocaleString()}`, label:"Total Spent" },
          ].map(({ num, label }) => (
            <div key={label} style={S.statCard}>
              <div style={S.statAccent} />
              <div style={S.statNum}>{num}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, color:"#14532d" }}>My Bookings</div>
          <button
            style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:2, padding:"10px 24px", borderRadius:10, background:"#16a34a", color:"#ffffff", cursor:"pointer", border:"none" }}
            onClick={() => navigate("/booking")}
          >
            + BOOK NOW
          </button>
        </div>

        {loading ? (
          <div style={S.loading}>Loading your bookings...</div>
        ) : bookings.length === 0 ? (
          <div style={S.emptyBox}>
            <span style={S.emptyIcon}>🏟️</span>
            <div style={S.emptyTitle}>No bookings yet</div>
            <div style={S.emptyText}>Book a facility to see it here.</div>
            <button style={S.btnBook} onClick={() => navigate("/booking")}>BOOK NOW</button>
          </div>
        ) : (
          bookings.map((b, i) => {
            const isNight = b.session === "night";

            // Check if today's booking is finished
            let isFinished = false;
            if (b.is_today && b.slots?.length > 0) {
              const lastSlot = b.slots[b.slots.length - 1];
              const endHour  = parseInt(lastSlot.split("–")[1]?.trim().split(":")[0] || "0");
              const now      = new Date();
              const slotEnd  = new Date();
              slotEnd.setHours(endHour, 0, 0, 0);
              isFinished = now >= slotEnd;
            }

            return (
              <div key={i} style={{ ...S.card, opacity: isFinished ? 0.5 : 1, filter: isFinished ? "grayscale(40%)" : "none" }} className="dashboard-card">
                <div style={S.cardIcon}>{ICONS[b.facility] || "🏟️"}</div>
                <div style={S.cardInfo}>
                  <div style={S.cardFacility}>
                    {b.facility}
                    {isFinished && <span style={{ fontSize:10, background:"#d1e7d1", color:"#6b7280", borderRadius:4, padding:"1px 6px", marginLeft:8, fontWeight:600 }}>Done</span>}
                    {b.is_today && !isFinished && <span style={{ fontSize:10, background:"#dcfce7", color:"#16a34a", borderRadius:4, padding:"1px 6px", marginLeft:8, border:"1px solid #16a34a", fontWeight:600 }}>Today</span>}
                  </div>
                  <div style={S.cardMeta}>{b.date} · {isNight ? "🌙 Night" : "☀️ Day"} Session</div>
                  <div style={S.cardSlots} className="dashboard-slots">
                    {(b.slots||[]).map(s => <span key={s} style={S.slotPill(isNight)}>{s}</span>)}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0, minWidth:120 }}>
                  <div style={S.cardTotal}>LKR {(b.total||0).toLocaleString()}</div>
                  <div style={S.confirmedBadge}>✓ Confirmed</div>
                  {b.payment_status === 'partial' && (
                    <div style={{ fontSize:11, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"2px 8px", fontWeight:600 }}>
                      Balance: LKR {b.balance_due.toLocaleString()}
                    </div>
                  )}
                  {b.payment_status === 'paid' && (
                    <div style={{ fontSize:11, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:6, padding:"2px 8px", fontWeight:600 }}>
                      Fully Paid ✅
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}