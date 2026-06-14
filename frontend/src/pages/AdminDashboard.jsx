import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminStats, adminAllBookings, adminCancelBooking,
  adminAllUsers, adminDeleteUser, adminChangeRole,
  adminToggleFacility, getFacilities, adminGetAllFacilities,
  adminGetHolidays, adminAddHoliday, adminDeleteHoliday, adminGenerateHolidays,
  adminGetFacilityBlocks, adminAddFacilityBlock, adminDeleteFacilityBlock,
  isLoggedIn, getRole,
} from "../api";

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#14532d" },
  lines: { position:"fixed", inset:0, background:"repeating-linear-gradient(90deg,transparent,transparent 120px,rgba(255,255,255,0.015) 120px,rgba(255,255,255,0.015) 121px),repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(255,255,255,0.015) 80px,rgba(255,255,255,0.015) 81px)", pointerEvents:"none", zIndex:0 },
  inner: { position:"relative", zIndex:1, maxWidth:1200, margin:"0 auto", padding:"48px 40px" },
  pageLabel: { fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:4, color:"#b45309", textTransform:"uppercase", marginBottom:8 },
  pageTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:52, letterSpacing:2, lineHeight:1, color:"#14532d", marginBottom:8 },
  pageSub: { fontSize:14, color:"#6b7280", marginBottom:48 },
  statsRow: { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16, marginBottom:48 },
  statCard: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"24px 20px", position:"relative", overflow:"hidden" },
  statAccent: c => ({ position:"absolute", top:0, left:0, right:0, height:2, background:c }),
  statNum: { fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:"#16a34a", letterSpacing:2, lineHeight:1 },
  statLabel: { fontSize:12, color:"#6b7280", marginTop:6, fontWeight:500 },
  // Tabs
  tabRow: { display:"flex", gap:4, marginBottom:32, background:"#ffffff", borderRadius:12, padding:4, border:"1px solid #d1e7d1", width:"fit-content" },
  tab: a => ({ padding:"10px 24px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, transition:"all .18s", background: a?"#16a34a":"transparent", color: a?"#ffffff":"#6b7280" }),
  // Filters
  filterRow: { display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" },
  filterInput: { padding:"8px 14px", background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:8, fontSize:13, color:"#14532d", outline:"none" },
  sectionTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2, color:"#14532d", marginBottom:20 },
  // Table
  table: { width:"100%", borderCollapse:"collapse" },
  th: { textAlign:"left", fontSize:10, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#6b7280", padding:"10px 16px", borderBottom:"1px solid #d1e7d1" },
  tr: h => ({ background: h?"#ffffff":"transparent", borderBottom:"1px solid #ffffff" }),
  td: { padding:"14px 16px", fontSize:13, color:"#14532d", verticalAlign:"middle" },
  tdMuted: { padding:"14px 16px", fontSize:12, color:"#6b7280", verticalAlign:"middle" },
  slotPill: n => ({ display:"inline-block", background: n?"#eff6ff":"#dcfce7", border:`1px solid ${n?"#93c5fd":"#16a34a"}`, borderRadius:4, padding:"1px 6px", fontSize:10, color: n?"#3b82f6":"#16a34a", margin:"1px", fontWeight:500 }),
  adminBadge: { display:"inline-block", background:"#fefce8", border:"1px solid #b45309", borderRadius:20, padding:"2px 8px", fontSize:10, color:"#b45309", fontWeight:600 },
  userBadge: { display:"inline-block", background:"#dcfce7", border:"1px solid #16a34a", borderRadius:20, padding:"2px 8px", fontSize:10, color:"#16a34a", fontWeight:600 },
  activeBadge: { display:"inline-block", background:"#dcfce7", border:"1px solid #16a34a", borderRadius:20, padding:"2px 8px", fontSize:10, color:"#16a34a", fontWeight:600 },
  inactiveBadge: { display:"inline-block", background:"#fef2f2", border:"1px solid #dc2626", borderRadius:20, padding:"2px 8px", fontSize:10, color:"#dc2626", fontWeight:600 },
  // Buttons
  btnDanger: { background:"#fef2f2", border:"1px solid #dc2626", borderRadius:6, padding:"6px 12px", fontSize:11, color:"#dc2626", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s" },
  btnWarning: { background:"#fefce8", border:"1px solid #b45309", borderRadius:6, padding:"6px 12px", fontSize:11, color:"#b45309", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s" },
  btnSuccess: { background:"#dcfce7", border:"1px solid #16a34a", borderRadius:6, padding:"6px 12px", fontSize:11, color:"#16a34a", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s" },
  btnNeutral: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:6, padding:"6px 12px", fontSize:11, color:"#6b7280", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .18s" },
  loading: { textAlign:"center", color:"#6b7280", padding:"40px 0", fontSize:13 },
  empty: { textAlign:"center", color:"#d1e7d1", padding:"40px 0", fontSize:13 },
  toast: v => ({ position:"fixed", bottom:32, left:"50%", transform: v?"translateX(-50%) translateY(0)":"translateX(-50%) translateY(20px)", background:"#16a34a", color:"#f0f7f0", fontWeight:700, fontSize:14, padding:"14px 28px", borderRadius:100, opacity: v?1:0, transition:"all .4s cubic-bezier(0.34,1.56,0.64,1)", zIndex:9999, whiteSpace:"nowrap", pointerEvents:"none" }),
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab,        setTab]        = useState("bookings");
  const [stats,      setStats]      = useState(null);
  const [bookings,   setBookings]   = useState([]);
  const [users,      setUsers]      = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [holidays,   setHolidays]   = useState([]);
  const [blocks,     setBlocks]     = useState([]);
  const [blockForm,  setBlockForm]  = useState({ facility_id:"", start_date:"", end_date:"", reason:"Tournament" });
  const [blockSaving, setBlockSaving] = useState(false);
  const [period,     setPeriod]     = useState('all');
  const [newHoliday, setNewHoliday] = useState({ date:"", name:"" });
  const [loading,    setLoading]    = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterSes,  setFilterSes]  = useState("");
  const [toast,      setToast]      = useState({ v:false, msg:"" });

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (!isLoggedIn() || getRole() !== "admin") { navigate("/login"); return; }
    loadAll();
  }, [navigate]);

  const loadAll = async (p = period) => {
    setLoading(true);
    try {
      const [s, b, u, f, h, bl] = await Promise.all([
        adminStats(p), adminAllBookings(), adminAllUsers(), adminGetAllFacilities(), adminGetHolidays(), adminGetFacilityBlocks(), adminGetFacilityBlocks(),
      ]);
      setStats(s);
      setBookings(b.bookings || []);
      setUsers(u.users || []);
      setFacilities(f.facilities || []);
      setHolidays(h.holidays || []);
      setBlocks(bl.blocks || []);
    } catch (e) {
      showToast("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = msg => {
    setToast({ v:true, msg });
    setTimeout(() => setToast({ v:false, msg }), 3000);
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking? This will also release linked courts.")) return;
    try {
      await adminCancelBooking(id);
      showToast("✅ Booking cancelled");
      await loadAll();
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? All their bookings will be deleted too.`)) return;
    try {
      await adminDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast("✅ User deleted");
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      await adminChangeRole(id, newRole);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      showToast(`✅ Role changed to ${newRole}`);
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  const handleGenerateHolidays = async (year) => {
    if (!window.confirm(`Auto-generate all Sri Lanka holidays for ${year}? This will add fixed dates + Poya days automatically.`)) return;
    try {
      const res = await adminGenerateHolidays(year);
      showToast(`✅ ${res.message}`);
      await loadAll();
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) { showToast("Please fill date and name"); return; }
    try {
      await adminAddHoliday(newHoliday.date, newHoliday.name);
      showToast("✅ Holiday added");
      setNewHoliday({ date:"", name:"" });
      await loadAll();
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  const handleDeleteHoliday = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await adminDeleteHoliday(id);
      showToast("✅ Holiday deleted");
      await loadAll();
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  const handleToggleFacility = async (id) => {
    try {
      await adminToggleFacility(id);
      showToast("✅ Facility updated");
      await loadAll(); // reload everything so admin sees correct state
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  // Filter bookings
  const filteredBookings = bookings
    .filter(b => {
      if (filterDate && !b.date.includes(filterDate)) return false;
      if (filterSes  && b.session !== filterSes) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by date first
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA - dateB !== 0) return dateA - dateB;
      // Same date → sort by first slot time
      const slotA = (a.slots?.[0] || "").split(" – ")[0]; // e.g. "08:00"
      const slotB = (b.slots?.[0] || "").split(" – ")[0];
      return slotA.localeCompare(slotB);
    });

  return (
    <div style={S.page}>
      <div style={S.lines} />
      <div style={S.inner} className="admin-inner">
        <div style={S.pageLabel}>Admin Panel</div>
        <div style={S.pageTitle} className="admin-title">Horizon <span style={{ color:"#b45309" }}>Control</span></div>
        <div style={S.pageSub}>Manage all bookings, users and facilities from here.</div>

        {/* Period filter */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { value:"today", label:"Today" },
            { value:"week",  label:"This Week" },
            { value:"month", label:"This Month" },
            { value:"year",  label:"This Year" },
            { value:"all",   label:"All Time" },
          ].map(({ value, label }) => (
            <button key={value}
              style={{ padding:"8px 18px", borderRadius:20, border:"1px solid #d1e7d1", fontSize:12, fontWeight:600, cursor:"pointer", background: period===value ? "#16a34a" : "#ffffff", color: period===value ? "#ffffff" : "#4b7a4b", transition:"all .18s" }}
              onClick={() => { setPeriod(value); loadAll(value); }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {stats && (
          <div style={S.statsRow} className="admin-stats">
            {[
              { num: stats.total_bookings,                           label:"Total Bookings",  color:"#16a34a" },
              { num: `LKR ${(stats.total_revenue||0).toLocaleString()}`, label:"Total Revenue", color:"#3b82f6" },
              { num: stats.total_users,                              label:"Registered Users",color:"#16a34a" },
              { num: stats.total_facilities,                         label:"Facilities",      color:"#b45309" },
              { num: stats.today_bookings,                           label:"Today's Bookings",color:"#16a34a" },
            ].map(({ num, label, color }) => (
              <div key={label} style={S.statCard}>
                <div style={S.statAccent(color)} />
                <div style={{ ...S.statNum, color }}>{num}</div>
                <div style={S.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={S.tabRow} className="admin-tabs">
          {[["bookings","📋 Bookings"],["users","👤 Users"],["facilities","🏟️ Facilities"],["holidays","🎉 Holidays"],["blocks","🚫 Block Dates"]].map(([k,l]) => (
            <button key={k} style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div style={S.loading}>Loading...</div>
        ) : (
          <>
            {/* ── BOOKINGS TAB ── */}
            {tab === "bookings" && (
              <>
                <div style={S.sectionTitle}>All Bookings ({filteredBookings.length})</div>
                <div style={S.filterRow} className="admin-filter-row">
                  <input style={S.filterInput} type="date" value={filterDate}
                    onChange={e => setFilterDate(e.target.value)} placeholder="Filter by date" />
                  <select style={S.filterInput} value={filterSes} onChange={e => setFilterSes(e.target.value)}>
                    <option value="">All Sessions</option>
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                  </select>
                  {(filterDate || filterSes) && (
                    <button style={S.btnNeutral} onClick={() => { setFilterDate(""); setFilterSes(""); }}>Clear</button>
                  )}
                </div>
                {filteredBookings.length === 0 ? (
                  <div style={S.empty}>No bookings found.</div>
                ) : (
                  <div className="admin-table-wrap"><table style={S.table} className="admin-table">
                    <thead>
                      <tr>
                        {["User","Facility","Date","Session","Slots","Total","Paid","Balance","Action"].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b, i) => {
                        const isNight  = b.session === "night";

                        // Grey out only if today AND last slot has already finished
                        let isFinished = false;
                        if (b.is_today && b.slots?.length > 0) {
                          const lastSlot  = b.slots[b.slots.length - 1]; // e.g. "14:00 – 15:00"
                          const endTime   = lastSlot.split(" – ")[1];    // "15:00"
                          const [h, m]    = endTime.split(":").map(Number);
                          const slotEnd   = new Date();
                          slotEnd.setHours(h, m, 0, 0);
                          isFinished = new Date() >= slotEnd;
                        }

                        return (
                          <tr key={b.id} style={{
                            ...S.tr(i%2===0),
                            opacity: isFinished ? 0.4 : 1,
                            filter:  isFinished ? "grayscale(40%)" : "none",
                          }}>
                            <td style={S.td}>
                              <div style={{ fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                                {b.user}
                                {isFinished && <span style={{ fontSize:10, background:"#d1e7d1", color:"#6b7280", borderRadius:4, padding:"1px 6px" }}>Done</span>}
                                {b.is_today && !isFinished && <span style={{ fontSize:10, background:"#dcfce7", color:"#16a34a", borderRadius:4, padding:"1px 6px", border:"1px solid #16a34a" }}>Today</span>}
                              </div>
                              <div style={{ fontSize:11, color:"#6b7280" }}>{b.user_email}</div>
                            </td>
                            <td style={S.td}>{b.facility}</td>
                            <td style={S.tdMuted}>{b.date}</td>
                            <td style={S.td}>
                              <span style={S.slotPill(isNight)}>{isNight?"🌙 Night":"☀️ Day"}</span>
                            </td>
                            <td style={S.td}>
                              {(b.slots||[]).map(s => <span key={s} style={S.slotPill(isNight)}>{s}</span>)}
                            </td>
                            <td style={{ ...S.td, fontFamily:"'Bebas Neue',sans-serif", color:"#16a34a", fontSize:16 }}>
                              LKR {(b.total||0).toLocaleString()}
                            </td>
                            <td style={{ ...S.td, color:"#15803d", fontWeight:600, fontSize:13 }}>
                              {b.paid_amount > 0 ? `LKR ${b.paid_amount.toLocaleString()}` : '—'}
                            </td>
                            <td style={{ ...S.td, fontSize:13 }}>
                              {b.payment_status === 'paid' ? (
                                <span style={{ color:"#16a34a", fontWeight:600 }}>Paid ✅</span>
                              ) : b.payment_status === 'partial' ? (
                                <span style={{ color:"#dc2626", fontWeight:600 }}>LKR {(b.balance_due||0).toLocaleString()}</span>
                              ) : (
                                <span style={{ color:"#9ca3af" }}>—</span>
                              )}
                            </td>
                            <td style={S.td}>
                              <button style={S.btnDanger} onClick={() => handleCancelBooking(b.id)}>Cancel</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table></div>
                )}
              </>
            )}

            {/* ── USERS TAB ── */}
            {tab === "users" && (
              <>
                <div style={S.sectionTitle}>All Users ({users.length})</div>
                {users.length === 0 ? (
                  <div style={S.empty}>No users found.</div>
                ) : (
                  <div className="admin-table-wrap"><table style={S.table} className="admin-table">
                    <thead>
                      <tr>
                        {["Name","Username","Email","Phone","Role","Bookings","Joined","Actions"].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id} style={S.tr(i%2===0)}>
                          <td style={S.td}>{u.full_name}</td>
                          <td style={S.tdMuted}>{u.username}</td>
                          <td style={S.tdMuted}>{u.email}</td>
                          <td style={S.tdMuted}>{u.phone}</td>
                          <td style={S.td}>
                            <span style={u.role==="admin" ? S.adminBadge : S.userBadge}>
                              {u.role==="admin" ? "⚡ Admin" : "User"}
                            </span>
                          </td>
                          <td style={S.tdMuted}>{u.bookings_count}</td>
                          <td style={S.tdMuted}>{u.joined}</td>
                          <td style={{ ...S.td, display:"flex", gap:6, flexWrap:"wrap" }}>
                            <button style={S.btnWarning} onClick={() => handleChangeRole(u.id, u.role)}>
                              {u.role==="admin" ? "Make User" : "Make Admin"}
                            </button>
                            {u.role !== "admin" && (
                              <button style={S.btnDanger} onClick={() => handleDeleteUser(u.id, u.username)}>Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </>
            )}

            {/* ── HOLIDAYS TAB ── */}
            {tab === "holidays" && (
              <>
                <div style={S.sectionTitle}>Holiday Management</div>

                {/* Auto-generate buttons */}
                <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:16, padding:"20px 24px", marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#b45309", marginBottom:12 }}>
                    🤖 Auto-Generate Poya Days + Fixed Holidays
                  </div>
                  <div style={{ fontSize:12, color:"#6b7280", marginBottom:16 }}>
                    Automatically generates all Poya (full moon) days and fixed public holidays for a year.
                    Admin only needs to manually add variable holidays like Id-Ul-Fitr, Good Friday, Deepavali.
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[new Date().getFullYear(), new Date().getFullYear()+1, new Date().getFullYear()+2].map(y => (
                      <button key={y} style={S.btnWarning} onClick={() => handleGenerateHolidays(y)}>
                        Generate {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"20px 24px", marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#14532d", marginBottom:16 }}>Add Variable Holiday Manually</div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
                    <div>
                      <div style={S.th}>Date</div>
                      <input
                        type="date"
                        style={S.filterInput}
                        value={newHoliday.date}
                        onChange={e => setNewHoliday({...newHoliday, date:e.target.value})}
                      />
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={S.th}>Holiday Name</div>
                      <input
                        type="text"
                        style={{...S.filterInput, width:"100%"}}
                        placeholder="e.g. Sinhala & Tamil New Year"
                        value={newHoliday.name}
                        onChange={e => setNewHoliday({...newHoliday, name:e.target.value})}
                      />
                    </div>
                    <button style={S.btnSuccess} onClick={handleAddHoliday}>+ Add Holiday</button>
                  </div>
                </div>

                {holidays.length === 0 ? (
                  <div style={S.empty}>No holidays added yet.</div>
                ) : (
                  <div className="admin-table-wrap"><table style={S.table} className="admin-table">
                    <thead>
                      <tr>
                        {["Date","Holiday Name","Year","Type","Action"].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map((h, i) => (
                        <tr key={h.id} style={S.tr(i%2===0)}>
                          <td style={{...S.td, fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:"#ff8080"}}>{h.date}</td>
                          <td style={S.td}>{h.name}</td>
                          <td style={S.tdMuted}>{h.year}</td>
                          <td style={S.td}>
                            <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20,
                              background: h.type==="auto" ? "rgba(160,196,255,0.1)" : "rgba(200,245,58,0.1)",
                              border: `1px solid ${h.type==="auto" ? "rgba(160,196,255,0.3)" : "rgba(200,245,58,0.3)"}`,
                              color: h.type==="auto" ? "#3b82f6" : "#16a34a" }}>
                              {h.type==="auto" ? "Auto" : "Manual"}
                            </span>
                          </td>
                          <td style={S.td}>
                            <button style={S.btnDanger} onClick={() => handleDeleteHoliday(h.id, h.name)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </>
            )}

            {/* ── BLOCK DATES TAB ── */}
            {tab === "blocks" && (
              <>
                <div style={S.sectionTitle}>Block Facility Dates</div>
                <div style={{ background:"#fff9f9", border:"1px solid #fecaca", borderRadius:12, padding:"20px 24px", marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#dc2626", marginBottom:16 }}>🚫 Block a Facility (Tournament / Maintenance / Private Event)</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }}>
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Facility</div>
                      <select style={{ ...S.input, width:"100%" }} value={blockForm.facility_id} onChange={e => setBlockForm(f => ({ ...f, facility_id: e.target.value }))}>
                        <option value="">Select facility</option>
                        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Start Date</div>
                      <input type="date" style={{ ...S.input, width:"100%" }} value={blockForm.start_date} onChange={e => setBlockForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>End Date</div>
                      <input type="date" style={{ ...S.input, width:"100%" }} value={blockForm.end_date} onChange={e => setBlockForm(f => ({ ...f, end_date: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Reason</div>
                      <select style={{ ...S.input, width:"100%" }} value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}>
                        <option value="Tournament">Tournament</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Private Event">Private Event</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <button style={{ ...S.btnDanger, height:38, whiteSpace:"nowrap" }} disabled={blockSaving} onClick={async () => {
                      if (!blockForm.facility_id || !blockForm.start_date || !blockForm.end_date) { alert("Please fill all fields."); return; }
                      setBlockSaving(true);
                      try {
                        await adminAddFacilityBlock({ ...blockForm, facility_id: parseInt(blockForm.facility_id) });
                        const bl = await adminGetFacilityBlocks();
                        setBlocks(bl.blocks || []);
                        setBlockForm({ facility_id:"", start_date:"", end_date:"", reason:"Tournament" });
                      } catch(e) { alert(e.message); }
                      finally { setBlockSaving(false); }
                    }}>
                      {blockSaving ? "Blocking..." : "Block Dates"}
                    </button>
                  </div>
                </div>

                {blocks.length === 0 ? (
                  <div style={S.empty}>No blocked dates.</div>
                ) : (
                  <div className="admin-table-wrap"><table style={S.table} className="admin-table">
                    <thead><tr>{["Facility","Start Date","End Date","Reason","Action"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {blocks.map(b => (
                        <tr key={b.id}>
                          <td style={S.td}>{b.facility}</td>
                          <td style={S.td}>{b.start_date}</td>
                          <td style={S.td}>{b.end_date}</td>
                          <td style={S.td}>
                            <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:20, background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626" }}>
                              {b.reason}
                            </span>
                          </td>
                          <td style={S.td}>
                            <button style={S.btnDanger} onClick={async () => {
                              if (!window.confirm("Remove this block?")) return;
                              await adminDeleteFacilityBlock(b.id);
                              const bl = await adminGetFacilityBlocks();
                              setBlocks(bl.blocks || []);
                            }}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </>
            )}

            {/* ── FACILITIES TAB ── */}
            {tab === "facilities" && (
              <>
                <div style={S.sectionTitle}>All Facilities ({facilities.length})</div>
                <div className="admin-table-wrap"><table style={S.table} className="admin-table">
                  <thead>
                    <tr>
                      {["Icon","Name","Tag","Day Rate","Night Rate","Linked Courts","Status","Action"].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.map((f, i) => (
                      <tr key={f.id} style={S.tr(i%2===0)}>
                        <td style={S.td}><span style={{ fontSize:24 }}>{f.icon}</span></td>
                        <td style={S.td}><div style={{ fontWeight:600 }}>{f.name}</div></td>
                        <td style={S.tdMuted}>{f.tag}</td>
                        <td style={{ ...S.td, color:"#16a34a", fontFamily:"'Bebas Neue',sans-serif" }}>LKR {f.day_rate}</td>
                        <td style={{ ...S.td, color:"#3b82f6", fontFamily:"'Bebas Neue',sans-serif" }}>LKR {f.night_rate}</td>
                        <td style={S.td}>
                          {f.linked_facility_ids?.length > 0
                            ? <span style={{ fontSize:11, color:"#b45309" }}>
                                Links to court IDs: {f.linked_facility_ids.join(", ")}
                              </span>
                            : <span style={{ color:"#d1e7d1", fontSize:11 }}>None</span>
                          }
                        </td>
                        <td style={S.td}>
                          <span style={f.is_active ? S.activeBadge : S.inactiveBadge}>
                            {f.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={S.td}>
                          <button
                            style={f.is_active ? S.btnDanger : S.btnSuccess}
                            onClick={() => handleToggleFacility(f.id)}
                          >
                            {f.is_active ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </>
            )}
          </>
        )}
      </div>
      <div style={S.toast(toast.v)}>{toast.msg}</div>
    </div>
  );
}