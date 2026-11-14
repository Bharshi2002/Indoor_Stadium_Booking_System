import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminStats, adminRevenueRecords, adminAllBookings, adminCancelBooking,
  adminAllUsers, adminDeleteUser, adminChangeRole,
  adminToggleFacility, getFacilities, adminGetAllFacilities,
  adminGetHolidays, adminAddHoliday, adminDeleteHoliday, adminGenerateHolidays,
  adminGetFacilityBlocks, adminAddFacilityBlock, adminDeleteFacilityBlock,
  isLoggedIn, getRole,
} from "../api";
import groupLinkedBlocks from "../utils/groupLinkedBlocks";

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

const reasonBadge = { fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:20, background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626" };

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
  // Tournament details popup: null = closed, else { tournament_title, sponsor, organizer, error }
  const [tournamentModal, setTournamentModal] = useState(null);
  // Block save error popup: null = closed, else the error message
  const [blockError, setBlockError] = useState(null);
  // Read-only tournament details popup: null = closed, else the block being viewed
  const [viewedBlock, setViewedBlock] = useState(null);
  const [period,     setPeriod]     = useState('all');
  const [newHoliday, setNewHoliday] = useState({ date:"", name:"" });
  const [loading,    setLoading]    = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterSes,  setFilterSes]  = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [toast,      setToast]      = useState({ v:false, msg:"" });
  // Revenue records popup: null = closed, else { period, loading, error, records, total }
  const [revenueModal, setRevenueModal] = useState(null);
  const revenueReqId = useRef(0);

  // ── Inject fonts ──────────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // ── Inject mobile CSS ─────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "admin-mobile-css";
    style.innerHTML = `
      .admin-reason-link { transition: background .18s, border-color .18s; }
      .admin-reason-link:hover { background: #fee2e2 !important; border-color: #dc2626 !important; }

      @media (max-width: 768px) {
        /* Page padding */
        .admin-inner { padding: 24px 16px !important; }

        /* Title */
        .admin-title { font-size: 36px !important; }

        /* Period filter pills — wrap nicely */
        .admin-period-row { gap: 6px !important; }
        .admin-period-btn { font-size: 11px !important; padding: 6px 12px !important; }

        /* Stats: 2 columns, 5th card spans full width */
        .admin-stats {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px !important;
          margin-bottom: 24px !important;
        }
        .admin-stats > div:nth-child(5) {
          grid-column: 1 / -1 !important;
        }

        /* Tabs: horizontal scroll, no wrap */
        .admin-tabs {
          width: 100% !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
          white-space: nowrap !important;
          display: flex !important;
          box-sizing: border-box !important;
        }
        .admin-tabs::-webkit-scrollbar { display: none !important; }
        .admin-tabs button {
          flex-shrink: 0 !important;
          padding: 8px 14px !important;
          font-size: 11px !important;
          white-space: nowrap !important;
        }

        /* Filter row: stack vertically */
        .admin-filter-row {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 8px !important;
        }
        .admin-filter-row input,
        .admin-filter-row select,
        .admin-filter-row button {
          width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Tables: horizontal scroll */
        .admin-table-wrap {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          border-radius: 10px !important;
          border: 1px solid #d1e7d1 !important;
        }
        .admin-table {
          min-width: 700px !important;
          font-size: 11px !important;
        }
        .admin-table th { padding: 8px 10px !important; font-size: 9px !important; }
        .admin-table td { padding: 10px 10px !important; font-size: 11px !important; }

        /* Block dates form: stack vertically */
        .admin-block-form {
          grid-template-columns: 1fr !important;
          gap: 10px !important;
        }
        .admin-block-form select,
        .admin-block-form input {
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .admin-block-form button {
          width: 100% !important;
        }

        /* Holiday add form: stack */
        .admin-holiday-form {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .admin-holiday-form > div,
        .admin-holiday-form input,
        .admin-holiday-form button {
          width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Generate buttons: wrap */
        .admin-generate-row {
          flex-wrap: wrap !important;
          gap: 8px !important;
        }
      }

      @media (max-width: 480px) {
        .admin-stats { gap: 8px !important; }
        .admin-table { min-width: 600px !important; }
        .admin-tabs button { padding: 7px 11px !important; font-size: 10px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { const s = document.getElementById("admin-mobile-css"); if(s) s.remove(); };
  }, []);

  useEffect(() => {
    if (!isLoggedIn() || getRole() !== "admin") { navigate("/login"); return; }
    loadAll();
  }, [navigate]);

  const loadAll = async (p = period) => {
    setLoading(true);
    try {
      const [s, b, u, f, h, bl] = await Promise.all([
        adminStats(p), adminAllBookings(), adminAllUsers(), adminGetAllFacilities(), adminGetHolidays(), adminGetFacilityBlocks(),
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

  // ── Linked courts a booking also blocks (mirrors SlotLockController@lock) ──
  const getLinkedCourtNames = (facilityId) => {
    const id = Number(facilityId);
    if (!id) return [];
    const me = facilities.find(f => Number(f.id) === id);
    const ids = [];
    // Forward links
    (me?.linked_facility_ids || []).forEach(l => ids.push(Number(l)));
    // Reverse links
    facilities.forEach(f => {
      if ((f.linked_facility_ids || []).some(l => Number(l) === id)) ids.push(Number(f.id));
    });
    return [...new Set(ids)]
      .filter(fid => fid !== id)
      .map(fid => facilities.find(f => Number(f.id) === fid)?.name)
      .filter(Boolean);
  };

  // ── Revenue records popup ─────────────────────────────────────────────────
  const openRevenueModal = async () => {
    const p     = period;
    const reqId = ++revenueReqId.current;
    setRevenueModal({ period:p, loading:true, error:"", records:[], total:0 });
    try {
      const res = await adminRevenueRecords(p);
      if (reqId !== revenueReqId.current) return; // a newer request or close happened
      setRevenueModal({ period:p, loading:false, error:"", records: res.records || res.bookings || [], total: res.total_revenue || 0 });
    } catch (e) {
      if (reqId !== revenueReqId.current) return;
      setRevenueModal({ period:p, loading:false, error: e.message || "Failed to load revenue records", records:[], total:0 });
    }
  };

  const closeRevenueModal = () => { revenueReqId.current++; setRevenueModal(null); };

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
      await loadAll();
    } catch (e) { showToast(`❌ ${e.message}`); }
  };

  // ── Facility blocks ───────────────────────────────────────────────────────
  const saveBlock = async (tournamentDetails = {}) => {
    const fromPopup = blockForm.reason === "Tournament";
    let saved = false;
    setBlockSaving(true);
    try {
      await adminAddFacilityBlock({ ...blockForm, facility_id: parseInt(blockForm.facility_id), ...tournamentDetails });
      saved = true;
      // Clear before refreshing so a failed refresh can't lead to saving the same block twice.
      setTournamentModal(null);
      setBlockForm({ facility_id:"", start_date:"", end_date:"", reason:"Tournament" });
      const bl = await adminGetFacilityBlocks();
      setBlocks(bl.blocks || []);
    } catch (e) {
      if (fromPopup && !saved) setTournamentModal(m => m && { ...m, error: e.message || "Failed to save block" });
      else if (!saved) setBlockError(e.message || "Could not block these dates. Please try again.");
      else alert(e.message);
    } finally {
      setBlockSaving(false);
    }
  };

  const handleBlockDates = () => {
    if (!blockForm.facility_id || !blockForm.start_date || !blockForm.end_date) {
      alert("Please fill all fields."); return;
    }
    if (blockForm.end_date < blockForm.start_date) {
      alert("End date must be on or after the start date."); return;
    }
    if (blockForm.reason === "Tournament") {
      setTournamentModal({ tournament_title:"", sponsor:"", organizer:"", error:"" });
      return;
    }
    saveBlock();
  };

  const handleSaveTournament = e => {
    e.preventDefault();
    if (blockSaving) return;
    const tournament_title = tournamentModal.tournament_title.trim();
    const sponsor          = tournamentModal.sponsor.trim();
    const organizer        = tournamentModal.organizer.trim();
    if (!tournament_title || !sponsor || !organizer) {
      setTournamentModal(m => ({ ...m, error:"Tournament Title, Sponsor and Organizer are all required." }));
      return;
    }
    setTournamentModal(m => ({ ...m, error:"" }));
    saveBlock({ tournament_title, sponsor, organizer });
  };

  // Cancelling mid-save would imply nothing was saved, so the popup stays until the request ends.
  const closeTournamentModal = () => { if (!blockSaving) setTournamentModal(null); };

  // Filter + sort bookings
  const filteredBookings = bookings
    .filter(b => {
      if (filterDate) {
        const selected = new Date(filterDate).toDateString();
        const booking  = new Date(b.date).toDateString();
        if (selected !== booking) return false;
      }
      if (filterSes && b.session !== filterSes) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA - dateB !== 0) return dateA - dateB;
      const slotA = (a.slots?.[0] || "").split(" – ")[0];
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

        {/* ── Period filter ── */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }} className="admin-period-row">
          {[
            { value:"today", label:"Today" },
            { value:"week",  label:"This Week" },
            { value:"month", label:"This Month" },
            { value:"year",  label:"This Year" },
            { value:"all",   label:"All Time" },
          ].map(({ value, label }) => (
            <button key={value} className="admin-period-btn"
              style={{ padding:"8px 18px", borderRadius:20, border:"1px solid #d1e7d1", fontSize:12, fontWeight:600, cursor:"pointer", background: period===value ? "#16a34a" : "#ffffff", color: period===value ? "#ffffff" : "#4b7a4b", transition:"all .18s" }}
              onClick={() => { setPeriod(value); loadAll(value); }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div style={S.statsRow} className="admin-stats">
            {[
              { num: stats.total_bookings,                               label:"Total Bookings",   color:"#16a34a" },
              { num: `LKR ${(stats.total_revenue||0).toLocaleString()}/-`, label:"Total Revenue",    color:"#3b82f6" },
              { num: stats.total_users,                                  label:"Registered Users", color:"#16a34a" },
              { num: stats.total_facilities,                             label:"Facilities",       color:"#b45309" },
              { num: stats.today_bookings,                               label:"Today's Bookings", color:"#16a34a" },
            ].map(({ num, label, color }) => (
              <div key={label}
                style={label === "Total Revenue" ? { ...S.statCard, cursor:"pointer" } : S.statCard}
                onClick={label === "Total Revenue" ? openRevenueModal : undefined}
                title={label === "Total Revenue" ? "View revenue records" : undefined}
              >
                <div style={S.statAccent(color)} />
                <div style={{ ...S.statNum, color }}>{num}</div>
                <div style={S.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={S.tabRow} className="admin-tabs">
          {[
            ["bookings",   "📋 Bookings"],
            ["users",      "👤 Users"],
            ["facilities", "🏟️ Facilities"],
            ["holidays",   "🎉 Holidays"],
            ["blocks",     "🚫 Block Dates"],
          ].map(([k, l]) => (
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
                  <input
                    style={S.filterInput}
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
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
                  <div className="admin-table-wrap">
                    <table style={S.table} className="admin-table">
                      <thead>
                        <tr>
                          {["User","Facility","Date","Session","Slots","Booked For","Total","Paid","Balance","Action"].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b, i) => {
                          const isNight = b.session === "night";
                          let isFinished = false;
                          if (b.is_today && b.slots?.length > 0) {
                            const lastSlot = b.slots[b.slots.length - 1];
                            const endTime  = lastSlot.split(" – ")[1];
                            const [h, m]   = endTime.split(":").map(Number);
                            const slotEnd  = new Date();
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
                              <td style={S.td}>
                                {b.facility}
                                {(() => {
                                  const names = getLinkedCourtNames(b.facility_id);
                                  return names.length > 0 && (
                                    <div style={{ fontSize:11, color:"#6b7280", whiteSpace:"normal", wordBreak:"break-word" }}>
                                      also blocks: {names.join(", ")}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={S.tdMuted}>{b.date}</td>
                              <td style={S.td}>
                                <span style={S.slotPill(isNight)}>{isNight?"🌙 Night":"☀️ Day"}</span>
                              </td>
                              <td style={S.td}>
                                {(b.slots||[]).map(s => <span key={s} style={S.slotPill(isNight)}>{s}</span>)}
                              </td>
                              <td style={S.td}>
                                {b.guest_name ? (
                                  <div>
                                    <div style={{ fontWeight:600, fontSize:13, color:"#14532d" }}>{b.guest_name}</div>
                                    <div style={{ fontSize:11, color:"#6b7280" }}>📞 {b.guest_phone}</div>
                                  </div>
                                ) : b.is_hold ? (
                                  <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:20, background:"#fffbeb", border:"1px solid #f59e0b", color:"#b45309" }}>⏳ Hold</span>
                                ) : (
                                  <span style={{ color:"#d1e7d1", fontSize:11 }}>—</span>
                                )}
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
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── USERS TAB ── */}
            {tab === "users" && (
              <>
                <div style={S.sectionTitle}>All Users ({users.length})</div>
                {/* Search bar */}
                <div style={S.filterRow} className="admin-filter-row">
                  <input
                    style={{ ...S.filterInput, minWidth:350 }}
                    type="text"
                    placeholder="🔍 Search by name, username, email or phone..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                  {userSearch && (
                    <button style={S.btnNeutral} onClick={() => setUserSearch("")}>Clear</button>
                  )}
                </div>
                {users.length === 0 ? (
                  <div style={S.empty}>No users found.</div>
                ) : (
                  <div className="admin-table-wrap">
                    <table style={S.table} className="admin-table">
                      <thead>
                        <tr>
                          {["Name","Username","Email","Phone","Role","Bookings","Joined","Actions"].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(u => {
                            if (!userSearch) return true;
                            const q = userSearch.toLowerCase();
                            return (
                              u.full_name?.toLowerCase().includes(q) ||
                              u.username?.toLowerCase().includes(q) ||
                              u.email?.toLowerCase().includes(q) ||
                              u.phone?.toLowerCase().includes(q)
                            );
                          })
                          .map((u, i) => (
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
                    </table>
                  </div>
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
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }} className="admin-generate-row">
                    {[new Date().getFullYear(), new Date().getFullYear()+1, new Date().getFullYear()+2].map(y => (
                      <button key={y} style={S.btnWarning} onClick={() => handleGenerateHolidays(y)}>
                        Generate {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add holiday form */}
                <div style={{ background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"20px 24px", marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#14532d", marginBottom:16 }}>Add Variable Holiday Manually</div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }} className="admin-holiday-form">
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
                  <div className="admin-table-wrap">
                    <table style={S.table} className="admin-table">
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
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── BLOCK DATES TAB ── */}
            {tab === "blocks" && (
              <>
                <div style={S.sectionTitle}>Block Facility Dates</div>
                <div style={{ background:"#fff9f9", border:"1px solid #fecaca", borderRadius:12, padding:"20px 24px", marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#dc2626", marginBottom:16 }}>
                    🚫 Block a Facility (Tournament / Maintenance / Private Event)
                  </div>
                  {/* Grid stacks to 1 col on mobile via .admin-block-form */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:12, alignItems:"end" }} className="admin-block-form">
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Facility</div>
                      <select style={{ ...S.filterInput, width:"100%" }} value={blockForm.facility_id}
                        onChange={e => setBlockForm(f => ({ ...f, facility_id: e.target.value }))}>
                        <option value="">Select facility</option>
                        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Start Date</div>
                      <input type="date" style={{ ...S.filterInput, width:"100%" }} value={blockForm.start_date}
                        onChange={e => setBlockForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>End Date</div>
                      <input type="date" style={{ ...S.filterInput, width:"100%" }} value={blockForm.end_date}
                        onChange={e => setBlockForm(f => ({ ...f, end_date: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>Reason</div>
                      <select style={{ ...S.filterInput, width:"100%" }} value={blockForm.reason}
                        onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}>
                        <option value="Tournament">Tournament</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Private Event">Private Event</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <button
                      style={{ ...S.btnDanger, height:38, whiteSpace:"nowrap" }}
                      disabled={blockSaving}
                      onClick={handleBlockDates}
                    >
                      {blockSaving ? "Blocking..." : "Block Dates"}
                    </button>
                  </div>
                </div>

                {blocks.length === 0 ? (
                  <div style={S.empty}>No blocked dates.</div>
                ) : (
                  <div className="admin-table-wrap">
                    <table style={S.table} className="admin-table">
                      <thead>
                        <tr>
                          {["Facility","Start Date","End Date","Reason","Action"].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupLinkedBlocks(blocks, facilities).map(b => (
                          <tr key={b.id}>
                            <td style={S.td}>
                              {b.facility}
                              {b.linkedNames?.length > 0 && (
                                <div style={{ fontSize:11, color:"#6b7280" }}>
                                  also blocks: {b.linkedNames.join(", ")}
                                </div>
                              )}
                            </td>
                            <td style={S.td}>{b.start_date}</td>
                            <td style={S.td}>{b.end_date}</td>
                            <td style={S.td}>
                              {b.reason === "Tournament" ? (
                                <button type="button" className="admin-reason-link" title="View tournament details"
                                  style={{ ...reasonBadge, cursor:"pointer", fontFamily:"inherit" }}
                                  onClick={() => setViewedBlock(b)}
                                >
                                  {b.reason}
                                </button>
                              ) : (
                                <span style={reasonBadge}>{b.reason}</span>
                              )}
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
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── FACILITIES TAB ── */}
            {tab === "facilities" && (
              <>
                <div style={S.sectionTitle}>All Facilities ({facilities.length})</div>
                <div className="admin-table-wrap">
                  <table style={S.table} className="admin-table">
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
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── REVENUE RECORDS POPUP ── */}
      {revenueModal && (
        <div className="revenue-backdrop" onClick={closeRevenueModal}
          style={{ position:"fixed", inset:0, background:"rgba(20,83,45,0.35)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
        >
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .revenue-print-area, .revenue-print-area * { visibility: visible !important; }
              .admin-inner, .revenue-no-print { display: none !important; }
              .revenue-backdrop { position: static !important; background: none !important; padding: 0 !important; display: block !important; }
              .revenue-print-area {
                position: absolute !important; top: 0 !important; left: 0 !important;
                width: 100% !important; max-width: none !important;
                max-height: none !important; overflow: visible !important;
                border: none !important; box-shadow: none !important; padding: 0 !important;
              }
              .revenue-table-wrap { max-height: none !important; overflow: visible !important; }
              .revenue-print-area tr { page-break-inside: avoid; }
            }
          `}</style>
          <div className="revenue-print-area" onClick={e => e.stopPropagation()}
            style={{ background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:24, width:"100%", maxWidth:1100, maxHeight:"90vh", display:"flex", flexDirection:"column", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", color:"#14532d" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:16 }}>
              <div style={{ ...S.sectionTitle, marginBottom:0 }}>
                Revenue Records – {({ today:"Today", week:"This Week", month:"This Month", year:"This Year", all:"All Time" })[revenueModal.period] || revenueModal.period}
              </div>
              <div className="revenue-no-print" style={{ display:"flex", gap:8 }}>
                <button style={S.btnSuccess} onClick={() => window.print()} disabled={revenueModal.loading}>Print</button>
                <button style={S.btnWarning} onClick={() => window.print()} disabled={revenueModal.loading}>Export as PDF</button>
                <button style={S.btnNeutral} onClick={closeRevenueModal}>Close</button>
              </div>
            </div>

            {revenueModal.loading ? (
              <div style={S.loading}>Loading...</div>
            ) : revenueModal.error ? (
              <div style={{ ...S.loading, color:"#dc2626" }}>❌ {revenueModal.error}</div>
            ) : revenueModal.records.length === 0 ? (
              <div style={{ ...S.loading }}>No records</div>
            ) : (
              <div className="revenue-table-wrap admin-table-wrap" style={{ overflow:"auto", flex:1 }}>
                <table style={S.table} className="admin-table">
                  <thead>
                    <tr>
                      {["Date","Customer","Facility","Session","Slots","Total"].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {revenueModal.records.map((r, idx) => (
                      <tr key={r.id ?? idx} style={{ ...S.tr(idx % 2 === 0), borderBottom:"1px solid #f0f7f0" }}>
                        <td style={S.tdMuted}>{r.date}</td>
                        <td style={S.td}>{r.customer || r.guest_name || r.user || "-"}</td>
                        <td style={S.td}>{r.facility}</td>
                        <td style={S.td}>{r.session === "night" ? "Night" : r.session === "day" ? "Day" : r.session}</td>
                        <td style={S.td}>{(r.slots || []).join(", ")}</td>
                        <td style={S.td}>LKR {(r.total || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop:"2px solid #16a34a" }}>
                      <td style={{ ...S.td, fontWeight:700 }} colSpan={5}>
                        Total ({revenueModal.records.length} record{revenueModal.records.length !== 1 ? "s" : ""})
                      </td>
                      <td style={{ ...S.td, fontWeight:700, color:"#16a34a" }}>LKR {(revenueModal.total || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOURNAMENT DETAILS POPUP ── */}
      {tournamentModal && (
        // onMouseDown, so dragging a text selection out of an input doesn't close the popup
        <div onMouseDown={e => { if (e.target === e.currentTarget) closeTournamentModal(); }}
          style={{ position:"fixed", inset:0, background:"rgba(20,83,45,0.35)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
        >
          <form onSubmit={handleSaveTournament} noValidate
            style={{ background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:24, width:"100%", maxWidth:440, maxHeight:"90vh", overflowY:"auto", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", color:"#14532d" }}
          >
            <div style={{ ...S.sectionTitle, marginBottom:16 }}>Tournament Details</div>

            {[
              ["tournament_title", "Tournament Title"],
              ["sponsor",          "Sponsor"],
              ["organizer",        "Organizer"],
            ].map(([key, label], i) => (
              <label key={key} style={{ display:"block", marginBottom:12 }}>
                <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>{label}</div>
                <input
                  type="text"
                  required
                  autoFocus={i === 0}
                  maxLength={255}
                  disabled={blockSaving}
                  style={{ ...S.filterInput, width:"100%", boxSizing:"border-box" }}
                  value={tournamentModal[key]}
                  onChange={e => { const value = e.target.value; setTournamentModal(m => ({ ...m, [key]: value, error:"" })); }}
                />
              </label>
            ))}

            {tournamentModal.error && (
              <div role="alert" style={{ fontSize:12, color:"#dc2626", marginBottom:12 }}>❌ {tournamentModal.error}</div>
            )}

            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
              <button type="button" style={S.btnNeutral} disabled={blockSaving} onClick={closeTournamentModal}>Cancel</button>
              <button type="submit" style={S.btnSuccess} disabled={blockSaving}>{blockSaving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── VIEW TOURNAMENT DETAILS POPUP ── */}
      {viewedBlock && (
        <div onClick={() => setViewedBlock(null)}
          style={{ position:"fixed", inset:0, background:"rgba(20,83,45,0.35)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
        >
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:24, width:"100%", maxWidth:440, maxHeight:"90vh", overflowY:"auto", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", color:"#14532d" }}
          >
            <div style={{ ...S.sectionTitle, marginBottom:16 }}>Tournament Details</div>

            {viewedBlock.tournament_title || viewedBlock.sponsor || viewedBlock.organizer ? (
              [
                ["Tournament Title", viewedBlock.tournament_title || "—"],
                ["Sponsor",          viewedBlock.sponsor || "—"],
                ["Organizer",        viewedBlock.organizer || "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12, color:"#6b7280", marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:14, fontWeight:500, overflowWrap:"anywhere" }}>{value}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize:13, color:"#6b7280", marginBottom:12 }}>No tournament details recorded</div>
            )}

            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
              <button type="button" style={S.btnNeutral} onClick={() => setViewedBlock(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK SAVE ERROR POPUP ── */}
      {blockError && (
        <div onClick={() => setBlockError(null)}
          style={{ position:"fixed", inset:0, background:"rgba(20,83,45,0.35)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
        >
          <div role="alertdialog" onClick={e => e.stopPropagation()}
            style={{ background:"#ffffff", border:"1px solid #fecaca", borderLeft:"4px solid #dc2626", borderRadius:12, padding:20, width:"100%", maxWidth:360, boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }}
          >
            <div style={{ fontSize:14, color:"#b91c1c", overflowWrap:"anywhere", marginBottom:16 }}>{blockError}</div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button type="button" autoFocus style={S.btnSuccess} onClick={() => setBlockError(null)}>OK</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.toast(toast.v)}>{toast.msg}</div>
    </div>
  );
}