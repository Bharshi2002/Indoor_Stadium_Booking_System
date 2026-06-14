import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFacilities, getBookedSlots, createBooking, isLoggedIn, getRole, adminGetSlotInfo, getHolidays, lockSlots, unlockSlots } from "../api";

const DAY_SLOTS = [
  "06:00 – 07:00","07:00 – 08:00","08:00 – 09:00","09:00 – 10:00",
  "10:00 – 11:00","11:00 – 12:00","12:00 – 13:00","13:00 – 14:00",
  "14:00 – 15:00","15:00 – 16:00","16:00 – 17:00","17:00 – 18:00",
];
const NIGHT_SLOTS = [
  "18:00 – 19:00","19:00 – 20:00","20:00 – 21:00",
  "21:00 – 22:00","22:00 – 23:00","23:00 – 23:59",
];
const DAYS_SHORT  = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DAYS_FULL   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


// Holidays loaded from database via API — no hardcoded dates here
// Gets populated on page mount from GET /api/holidays?year=XXXX
let SL_HOLIDAYS = {};

function getDayType(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Past dates — don't colour them, they're already greyed out
  if (date < today) return 'weekday';
  const iso = toISODate(date);
  if (SL_HOLIDAYS[iso]) return 'holiday';
  const day = date.getDay();
  if (day === 0 || day === 6) return 'weekend';
  return 'weekday';
}

function getHolidayName(date) {
  return SL_HOLIDAYS[toISODate(date)] || null;
}

// Get display rate for a facility card based on selected date and session
function getFacilityDisplayRate(facility, date, isNight) {
  const dayType = getDayType(date);
  if (dayType === "holiday") {
    return isNight ? facility.holiday_night_rate : facility.holiday_day_rate;
  }
  if (dayType === "weekend") {
    return isNight ? facility.weekend_night_rate : facility.weekend_day_rate;
  }
  return isNight ? facility.night_rate : facility.day_rate;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function isSameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

// Returns true if slot end time has already passed (only for today)
function isSlotPast(slotStr, selectedDate) {
  const today = new Date();
  if (!isSameDay(selectedDate, today)) return false;
  const endTime = slotStr.split(" – ")[1];
  const [endHour, endMin] = endTime.replace(":00","").split(":").map(Number);
  const endDate = new Date();
  endDate.setHours(isNaN(endMin) ? endHour : endHour, isNaN(endMin) ? 0 : endMin, 0, 0);
  // parse properly
  const parts = endTime.split(":");
  endDate.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
  return today >= endDate;
}

// Build calendar days for a given month/year
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
  return days;
}

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"#f0f7f0", minHeight:"100vh", color:"#14532d", display:"grid", gridTemplateColumns:"1fr 340px", position:"relative" },
  lines: { position:"fixed", inset:0, background:"repeating-linear-gradient(90deg,transparent,transparent 120px,rgba(22,163,74,0.05) 120px,rgba(22,163,74,0.05) 121px),repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(22,163,74,0.05) 80px,rgba(22,163,74,0.05) 81px)", pointerEvents:"none", zIndex:0 },
  nightOverlay: n => ({ position:"fixed", inset:0, background: n?"radial-gradient(ellipse at top,rgba(30,58,138,0.08) 0%,transparent 70%)":"transparent", pointerEvents:"none", zIndex:0, transition:"background 0.6s" }),
  main: { padding:"40px 48px", borderRight:"1px solid #d1e7d1", position:"relative", zIndex:1 },
  summary: { padding:"40px 32px", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto", zIndex:1 },
  pageLabel: { fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:4, color:"#16a34a", textTransform:"uppercase", marginBottom:8 },
  pageTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:52, letterSpacing:2, lineHeight:1, color:"#14532d", marginBottom:40 },
  sLabel: { fontSize:10, fontWeight:600, letterSpacing:3, textTransform:"uppercase", color:"#6b7280", marginBottom:16 },

  // ── CALENDAR ──────────────────────────────────────────────────────────────
  calendarWrap: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"20px", marginBottom:40, width:"fit-content" },
  calHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 },
  calMonthYear: { fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:"#14532d" },
  calNavBtn: { width:32, height:32, borderRadius:8, border:"1px solid #d1e7d1", background:"#f0f7f0", color:"#6b7280", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, transition:"all .18s" },
  calGrid: { display:"grid", gridTemplateColumns:"repeat(7,40px)", gap:4 },
  calDayLabel: { width:40, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600, color:"#d1e7d1", textTransform:"uppercase", letterSpacing:1 },
  calDay: (selected, isToday, isPast, isDisabled, dayType) => ({
    width:40, height:40, borderRadius:10,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:13, fontWeight:500,
    cursor: isDisabled ? "not-allowed" : "pointer",
    background: selected ? "#16a34a"
      : isToday ? "rgba(200,245,58,0.1)"
      : (!isPast && dayType==="holiday") ? "rgba(255,100,100,0.12)"
      : (!isPast && dayType==="weekend") ? "rgba(160,196,255,0.08)"
      : "transparent",
    color: selected ? "#f0f7f0"
      : isPast || isDisabled ? "#d1e7d1"
      : isToday ? "#16a34a"
      : (!isPast && dayType==="holiday") ? "#ff8080"
      : (!isPast && dayType==="weekend") ? "#3b82f6"
      : "#14532d",
    border: selected ? "1px solid #16a34a"
      : isToday ? "1px solid rgba(200,245,58,0.3)"
      : (!isPast && dayType==="holiday") ? "1px solid rgba(255,100,100,0.3)"
      : (!isPast && dayType==="weekend") ? "1px solid rgba(160,196,255,0.15)"
      : "1px solid transparent",
    transition:"all .15s",
    pointerEvents: isDisabled ? "none" : "auto",
    position: "relative",
  }),
  calLegend: { display:"flex", gap:12, marginTop:12, paddingTop:12, borderTop:"1px solid #d1e7d1" },
  calLegendItem: { display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#6b7280" },
  calLegendDot: c => ({ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0 }),
  dayTypeBadge: t => ({
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
    background: t==="holiday" ? "rgba(255,100,100,0.12)" : t==="weekend" ? "rgba(160,196,255,0.1)" : "rgba(200,245,58,0.08)",
    border: `1px solid ${t==="holiday" ? "rgba(255,100,100,0.3)" : t==="weekend" ? "rgba(160,196,255,0.25)" : "rgba(200,245,58,0.2)"}`,
    color: t==="holiday" ? "#ff8080" : t==="weekend" ? "#3b82f6" : "#16a34a",
    marginBottom: 16,
  }),
  calSelectedLabel: { display:"flex", alignItems:"center", gap:8, marginTop:14, paddingTop:14, borderTop:"1px solid #d1e7d1" },
  calSelIcon: { fontSize:16 },
  calSelText: { fontSize:13, fontWeight:500, color:"#14532d" },

  // ── SESSION ───────────────────────────────────────────────────────────────
  sessionWrap: { display:"flex", marginBottom:40, background:"#ffffff", borderRadius:14, padding:4, width:"fit-content", border:"1px solid #d1e7d1" },
  sessionBtn: (a,n) => ({ display:"flex", alignItems:"center", gap:10, padding:"12px 28px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, transition:"all .25s", background: a?(n?"linear-gradient(135deg,#eff6ff,#dbeafe)":"linear-gradient(135deg,#16a34a,#15803d)"):"transparent", color: a?(n?"#3b82f6":"#f0f7f0"):"#6b7280", boxShadow: a?"0 2px 12px rgba(0,0,0,0.3)":"none" }),
  sBtnTitle: { display:"block", fontSize:14 },
  sBtnSub: (a,n) => ({ display:"block", fontSize:10, marginTop:2, opacity:.75, color: a?(n?"#60a5fa":"#16a34a"):"#6a7e6f" }),

  // ── FACILITY ──────────────────────────────────────────────────────────────
  facilityGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:40 },
  facilityCard: (sel,n) => ({ border:`1px solid ${sel?(n?"#3b82f6":"#16a34a"):"#d1e7d1"}`, borderRadius:16, padding:"18px 16px", background: sel?(n?"rgba(100,140,255,0.1)":"rgba(200,245,58,0.08)"):"#ffffff", cursor:"pointer", transition:"all .22s", position:"relative", overflow:"hidden" }),
  fcAccent: (sel,n) => ({ position:"absolute", top:0, left:0, right:0, height:2, background: n?"linear-gradient(90deg,#6488ff,#3b82f6)":"#16a34a", transform: sel?"scaleX(1)":"scaleX(0)", transition:"transform .22s", transformOrigin:"left" }),
  fcIcon: { fontSize:28, marginBottom:10, display:"block" },
  fcName: { fontSize:13, fontWeight:600, color:"#14532d", lineHeight:1.3 },
  fcTag:  { fontSize:10, color:"#6b7280", marginTop:4 },
  fcRate: n => ({ fontSize:11, fontWeight:700, color: n?"#3b82f6":"#16a34a", marginTop:6 }),

  // ── SLOTS ─────────────────────────────────────────────────────────────────
  slotHeader: n => ({ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"8px 14px", borderRadius:8, background: n?"#eff6ff":"#dcfce7", border:`1px solid ${n?"#93c5fd":"#16a34a"}`, width:"fit-content" }),
  slotHeaderText: n => ({ fontSize:12, fontWeight:600, color: n?"#3b82f6":"#16a34a", letterSpacing:1, textTransform:"uppercase" }),
  slotHeaderSub: { fontSize:10, color:"#6b7280", marginLeft:4 },
  slotGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:32 },
  slotLocked: { border:"1px solid #f59e0b", borderRadius:10, padding:"12px 8px", textAlign:"center", cursor:"not-allowed", background:"#fffbeb", fontSize:13, fontWeight:500, color:"#b45309" },
  slot: (sel, bk, past, n) => ({
    border:`1px solid ${sel?(n?"#3b82f6":"#16a34a"):past?"#e5e7eb":bk?"#fecaca":"#d1e7d1"}`,
    borderRadius:10, padding:"12px 8px", textAlign:"center",
    cursor:(bk||past)?"not-allowed":"pointer",
    background: sel?(n?"linear-gradient(135deg,#eff6ff,#dbeafe)":"#16a34a"):past?"#f3f4f6":bk?"#fff1f2":"#ffffff",
    transition:"all .18s", fontSize:13,
    fontWeight: sel?700:500,
    color: sel?(n?"#1d4ed8":"#ffffff"):past?"#9ca3af":bk?"#ef4444":"#14532d",
  }),
  slotTime: { display:"block", fontSize:13 },
  slotBadge: { display:"block", fontSize:9, letterSpacing:1, textTransform:"uppercase", marginTop:3, opacity:.7 },
  legend: { display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" },
  legendItem: { display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#6b7280" },
  legendDot: c => ({ width:8, height:8, borderRadius:"50%", background:c }),
  loadingBox: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:10, padding:"20px", textAlign:"center", color:"#6b7280", fontSize:13, marginBottom:20 },

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  sumTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, color:"#14532d", marginBottom:32 },
  sumRow: { marginBottom:20, paddingBottom:20, borderBottom:"1px solid #d1e7d1" },
  sumKey: { fontSize:10, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#6b7280", marginBottom:6 },
  sumVal: e => ({ fontSize:15, fontWeight:e?300:500, color:e?"#d1e7d1":"#14532d", fontStyle:e?"italic":"normal" }),
  sesBadge: n => ({ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, background: n?"#eff6ff":"#dcfce7", border:`1px solid ${n?"#93c5fd":"#16a34a"}`, color: n?"#3b82f6":"#16a34a" }),
  slotPill: n => ({ display:"inline-block", background: n?"#eff6ff":"#dcfce7", border:`1px solid ${n?"#93c5fd":"#16a34a"}`, borderRadius:6, padding:"3px 9px", fontSize:11, color: n?"#3b82f6":"#16a34a", margin:"3px 3px 0 0", fontWeight:500 }),
  durRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  durLabel: { fontSize:13, color:"#6b7280" },
  durVal: { fontSize:13, fontWeight:600, color:"#14532d" },
  totalRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, paddingTop:12, borderTop:"1px solid #d1e7d1" },
  totalLabel: { fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:2, color:"#14532d" },
  totalPrice: n => ({ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color: n?"#3b82f6":"#16a34a", letterSpacing:1 }),
  spacer: { flex:1 },
  loginBanner: { background:"#dcfce7", border:"1px solid #16a34a", borderRadius:12, padding:"14px 18px", fontSize:13, color:"#16a34a", marginBottom:16, textAlign:"center", lineHeight:1.6 },
  btnConfirm: (d,n) => ({ width:"100%", padding:18, background: d?"#f0f7f0":(n?"linear-gradient(135deg,#2563eb,#3b82f6)":"#16a34a"), border:`1px solid ${d?"#d1e7d1":"transparent"}`, borderRadius:14, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, color: d?"#9ca3af":(n?"#ffffff":"#ffffff"), cursor: d?"not-allowed":"pointer", marginBottom:12, transition:"all .25s" }),
  btnClear: { width:"100%", padding:12, background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:"#6b7280", cursor:"pointer" },
  toast: v => ({ position:"fixed", bottom:32, left:"50%", transform: v?"translateX(-50%) translateY(0)":"translateX(-50%) translateY(20px)", background:"#16a34a", color:"#f0f7f0", fontWeight:700, fontSize:14, padding:"14px 28px", borderRadius:20, opacity: v?1:0, transition:"all .4s cubic-bezier(0.34,1.56,0.64,1)", zIndex:999, whiteSpace:"normal", maxWidth:"90vw", textAlign:"center", pointerEvents:"none" }),

  // Payment modal
  payOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  payBox: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:20, padding:"32px", minWidth:340, maxWidth:420, width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" },
  payTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:28, letterSpacing:2, color:"#14532d", marginBottom:4 },
  paySub: { fontSize:13, color:"#6b7280", marginBottom:24, lineHeight:1.6 },
  payRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f0f7f0" },
  payLabel: { fontSize:13, color:"#6b7280" },
  payVal: { fontSize:14, fontWeight:600, color:"#14532d" },
  payTotal: { fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#16a34a", letterSpacing:1 },
  payInputWrap: { marginTop:20, marginBottom:8 },
  payInputLabel: { fontSize:11, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#4b7a4b", marginBottom:8, display:"block" },
  payInput: { width:"100%", padding:"12px 16px", background:"#f0f7f0", border:"1px solid #d1e7d1", borderRadius:10, fontSize:16, fontWeight:600, color:"#14532d", outline:"none", boxSizing:"border-box" },
  payMsg: { fontSize:12, color:"#6b7280", marginBottom:20, lineHeight:1.6, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 14px" },
  payBtnRow: { display:"flex", gap:10, marginTop:16 },
  payBtn: { flex:1, padding:"14px", background:"#16a34a", border:"none", borderRadius:10, fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, color:"#ffffff", cursor:"pointer" },
  payCancelBtn: { padding:"14px 20px", background:"#f0f7f0", border:"1px solid #d1e7d1", borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:"#6b7280", cursor:"pointer" },
  payError: { fontSize:12, color:"#dc2626", marginTop:4 },

  // Admin slot info modal
  modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" },
  modalBox: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:20, padding:"32px", minWidth:320, maxWidth:400, position:"relative" },
  modalTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2, color:"#14532d", marginBottom:4 },
  modalSlot: { fontSize:12, color:"#6b7280", marginBottom:24 },
  modalRow: { display:"flex", alignItems:"center", gap:12, marginBottom:16, padding:"12px 16px", background:"#f0f7f0", borderRadius:10, border:"1px solid #d1e7d1" },
  modalIcon: { fontSize:20, flexShrink:0 },
  modalLabel: { fontSize:10, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:"#6b7280", marginBottom:2 },
  modalVal: { fontSize:14, fontWeight:600, color:"#14532d" },
  modalVia: { fontSize:11, color:"#b45309", marginTop:8, padding:"6px 12px", background:"#fefce8", border:"1px solid #fde68a", borderRadius:6 },
  modalClose: { width:"100%", padding:"12px", marginTop:8, background:"#d1e7d1", border:"none", borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:"#14532d", cursor:"pointer" },
};

export default function Booking() {
  const navigate = useNavigate();
  const today    = new Date();
  today.setHours(0,0,0,0);

  // ── Calendar state ────────────────────────────────────────────────────────
  const [calYear,   setCalYear]   = useState(today.getFullYear());
  const [calMonth,  setCalMonth]  = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(new Date(today));

  // ── App state ─────────────────────────────────────────────────────────────
  const [facilities,       setFacilities]       = useState([]);
  const [loadingFacility,  setLoadingFacility]  = useState(true);
  const [session,          setSession]          = useState("day");
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedSlots,    setSelectedSlots]    = useState(new Set());
  const [bookedSlots,      setBookedSlots]      = useState([]);
  const [loadingSlots,     setLoadingSlots]     = useState(false);
  const [dayType,    setDayType]    = useState("weekday");
  const [activeRate, setActiveRate] = useState({ day: 0, night: 0 });
  const [toast,            setToast]            = useState({ v:false, msg:"" });
  const [loggedIn,         setLoggedIn]         = useState(false);
  const [isAdmin,          setIsAdmin]          = useState(false);
  const [confirming,       setConfirming]       = useState(false);
  const [showPayModal,     setShowPayModal]     = useState(false);
  const [paidAmount,       setPaidAmount]       = useState(500);
  const [lockedSlots,      setLockedSlots]      = useState([]);
  const [isBlocked,        setIsBlocked]        = useState(false);
  const [blockReason,      setBlockReason]      = useState("");
  const [lockExpiry,       setLockExpiry]       = useState(null);
  const [timeLeft,         setTimeLeft]         = useState(600);
  const [lockError,        setLockError]        = useState("");
  const [slotModal,        setSlotModal]        = useState(null); // { slot, info }

  const isNight    = session === "night";
  const TIME_SLOTS = isNight ? NIGHT_SLOTS : DAY_SLOTS;
  const dateISO    = toISODate(selectedDate);
  const dateLabel  = `${DAYS_FULL[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS_FULL[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setIsAdmin(getRole() === "admin");

    // Load facilities
    getFacilities()
      .then(d => setFacilities(d.facilities))
      .catch(() => showToast("Failed to load facilities"))
      .finally(() => setLoadingFacility(false));

    // Load holidays for current year and next year from DB
    const currentYear = new Date().getFullYear();
    Promise.all([
      getHolidays(currentYear),
      getHolidays(currentYear + 1),
    ]).then(([r1, r2]) => {
      const all = [...(r1.holidays || []), ...(r2.holidays || [])];
      // Build lookup object { "2026-04-14": "Sinhala & Tamil New Year" }
      const lookup = {};
      all.forEach(h => { lookup[h.date] = h.name; });
      SL_HOLIDAYS = lookup;
    }).catch(() => {});
  }, []);

  const loadBookedSlots = useCallback(async () => {
    if (selectedFacility === null) { setBookedSlots([]); setLockedSlots([]); return; }
    setLoadingSlots(true);
    try {
      const d = await getBookedSlots(facilities[selectedFacility].id, dateISO, session);
      setBookedSlots(d.booked_slots || []);
      setLockedSlots(d.locked_slots || []);
      setIsBlocked(d.blocked || false);
      setBlockReason(d.block_reason || "");
      setDayType(d.day_type || "weekday");
      setActiveRate({ day: d.day_rate || 0, night: d.night_rate || 0 });
    } catch (_) {
      setBookedSlots([]);
      setLockedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedFacility, dateISO, session, facilities]);

  useEffect(() => { loadBookedSlots(); }, [loadBookedSlots]);

  useEffect(() => {
    if (selectedFacility === null) {
      setDayType(getDayType(selectedDate));
      setActiveRate({ day: 0, night: 0 });
    }
  }, [selectedDate, selectedFacility]);

  const showToast = (msg) => {
    setToast({ v:true, msg });
    setTimeout(() => setToast({ v:false, msg }), 3000);
  };

  // ── Calendar navigation ───────────────────────────────────────────────────
  const prevMonth = () => {
    if (calYear === today.getFullYear() && calMonth === today.getMonth()) return; // can't go before current month
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); }
    else setCalMonth(m => m-1);
  };

  const nextMonth = () => {
    // Allow up to 1 year ahead
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 12, 1);
    const nextM   = calMonth === 11 ? 0 : calMonth + 1;
    const nextY   = calMonth === 11 ? calYear + 1 : calYear;
    if (new Date(nextY, nextM, 1) > maxDate) return;
    setCalMonth(nextM);
    setCalYear(nextY);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const isPast = day < today;
    if (isPast) return;
    setSelectedDate(day);
    setSelectedSlots(new Set());
  };

  // ── Slot handlers ─────────────────────────────────────────────────────────
  const handleSessionChange = s => { setSession(s); setSelectedSlots(new Set()); };
  const handleFacilitySelect = idx => { setSelectedFacility(idx); setSelectedSlots(new Set()); };

  // Admin clicks a booked slot — fetch who booked it
  const handleAdminSlotClick = async (slotStr) => {
    if (selectedFacility === null) return;
    const f = facilities[selectedFacility];
    try {
      const info = await adminGetSlotInfo(f.id, dateISO, session, slotStr);
      setSlotModal({ slot: slotStr, info });
    } catch (e) {
      showToast("Failed to load slot info");
    }
  };

  const handleSlotToggle = async (slotStr) => {
    if (selectedFacility === null) { showToast("Please select a facility first"); return; }
    if (isSlotPast(slotStr, selectedDate)) return;
    if (bookedSlots.includes(slotStr)) return;
    if (lockedSlots.includes(slotStr)) return;

    const i = TIME_SLOTS.indexOf(slotStr);
    const f = facilities[selectedFacility];

    // If deselecting — remove from selection and update locks
    if (selectedSlots.has(i)) {
      const newSelected = new Set(selectedSlots);
      newSelected.delete(i);
      setSelectedSlots(newSelected);

      // Update DB locks — re-lock remaining slots or unlock all if none left
      if (loggedIn) {
        if (newSelected.size === 0) {
          // No slots selected — release all locks
          unlockSlots().catch(() => {});
        } else {
          // Re-lock remaining slots only
          const remainingSlots = [...newSelected].map(idx => TIME_SLOTS[idx]);
          lockSlots({
            facility_id: f.id,
            date:        dateISO,
            session,
            slots:       remainingSlots,
            duration:    2,
          }).catch(() => {});
        }
        // Refresh so other users see the change
        setTimeout(() => loadBookedSlots(), 500);
      }
      return;
    }

    // If selecting — lock slot immediately
    if (loggedIn) {
      try {
        const allSlots = [...selectedSlots].map(idx => TIME_SLOTS[idx]);
        allSlots.push(slotStr);
        await lockSlots({
          facility_id: f.id,
          date:        dateISO,
          session,
          slots:       allSlots,
          duration:    2, // 2 mins when slot clicked
        });
        setSelectedSlots(prev => { const next = new Set(prev); next.add(i); return next; });
        // Refresh to show locked status to other users
        loadBookedSlots();
      } catch (e) {
        if (e.message.includes("being processed")) {
          showToast("⚠️ This slot is being processed by another user!");
          loadBookedSlots();
        } else {
          setSelectedSlots(prev => { const next = new Set(prev); next.add(i); return next; });
        }
      }
    } else {
      setSelectedSlots(prev => { const next = new Set(prev); next.add(i); return next; });
    }
  };

  // Release locks when user leaves the page
  useEffect(() => {
    return () => {
      if (loggedIn) {
        unlockSlots().catch(() => {});
      }
    };
  }, [loggedIn]);
  useEffect(() => {
    if (!showPayModal || !lockExpiry) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.round((new Date(lockExpiry) - new Date()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        setShowPayModal(false);
        setLockedSlots([]);
        setLockExpiry(null);
        unlockSlots().catch(() => {});
        showToast("⏰ Time expired! Please select your slots again.");
        setSelectedSlots(new Set());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showPayModal, lockExpiry]);

  const handleConfirm = async () => {
    if (!loggedIn) { navigate("/login"); return; }
    const f        = facilities[selectedFacility];
    const newSlots = [...selectedSlots].sort((a,b)=>a-b).map(i => TIME_SLOTS[i]);
    setLockError("");

    // Admin skips payment modal — books directly with full payment
    if (isAdmin) {
      setConfirming(true);
      try {
        await createBooking({ facility_id:f.id, date:dateISO, session, slots:newSlots, paid_amount:0 });
        showToast("🎉 Booking Confirmed!");
        setSelectedFacility(null);
        setSelectedSlots(new Set());
        setBookedSlots([]);
      } catch (e) {
        showToast("❌ " + e.message);
      } finally {
        setConfirming(false);
      }
      return;
    }

    // Regular user — extend lock and show payment modal
    try {
      const res = await lockSlots({
        facility_id: f.id,
        date:        dateISO,
        session,
        slots:       newSlots,
        duration:    10,
      });
      setLockExpiry(res.expires_at);
      setTimeLeft(600);
    } catch (e) {
      showToast("⚠️ " + e.message);
      loadBookedSlots();
      return;
    }

    setPaidAmount(500);
    setShowPayModal(true);
  };

  const handlePayAndBook = async () => {
    const f        = facilities[selectedFacility];
    const newSlots = [...selectedSlots].sort((a,b)=>a-b).map(i => TIME_SLOTS[i]);
    const paid     = parseInt(paidAmount) || 0;
    if (paid < 500) { showToast("❌ Minimum deposit is LKR 500"); return; }
    if (paid > total) { showToast("❌ Cannot pay more than total"); return; }
    setConfirming(true);
    try {
      await createBooking({ facility_id:f.id, date:dateISO, session, slots:newSlots, paid_amount:paid });
      setShowPayModal(false);
      setLockedSlots([]);
      setLockExpiry(null);
      showToast("🎉 Booking Confirmed!");
      setSelectedFacility(null);
      setSelectedSlots(new Set());
      setBookedSlots([]);
      setPaidAmount(500);
    } catch (e) {
      showToast(`❌ ${e.message}`);
    } finally {
      setConfirming(false);
    }
  };

  const handleClear = () => { setSelectedFacility(null); setSelectedSlots(new Set()); };

  // ── Derived ───────────────────────────────────────────────────────────────
  const calDays     = buildCalendarDays(calYear, calMonth);
  const sortedSlots     = [...selectedSlots].sort((a,b)=>a-b);
  const selectedDayType = getDayType(selectedDate);
  // Use rate from API (already correct for weekday/weekend/holiday)
  // Fall back to base facility rate if API rate not loaded yet
  const rate = selectedFacility !== null
    ? (activeRate.day > 0
        ? (isNight ? activeRate.night : activeRate.day)
        : (isNight ? facilities[selectedFacility]?.night_rate : facilities[selectedFacility]?.day_rate) || 0)
    : 0;
  const total = rate * selectedSlots.size;
  const canConfirm  = selectedFacility !== null && selectedSlots.size > 0;
  const accentColor = isNight ? "#3b82f6" : "#16a34a";
  const isCurrentMonthAndYear = calYear === today.getFullYear() && calMonth === today.getMonth();

  return (
    <>
      <div style={S.lines} />
      <div style={S.nightOverlay(isNight)} />
      <div style={S.page} className="booking-page">

        {/* ── LEFT PANEL ── */}
        <div style={S.main} className="booking-main">
          <div style={S.pageLabel}>Horizon Indoor Complex</div>
          <div style={S.pageTitle} className="booking-page-title">Book a <span style={{ color:accentColor }}>Facility</span></div>

          {/* ── CALENDAR DATE PICKER ── */}
          <div style={S.sLabel}>Select Date</div>
          <div style={S.calendarWrap} className="booking-cal">
            {/* Month navigation */}
            <div style={S.calHeader}>
              <button
                style={{ ...S.calNavBtn, opacity: isCurrentMonthAndYear ? 0.3 : 1, cursor: isCurrentMonthAndYear ? "not-allowed" : "pointer" }}
                onClick={prevMonth}
              >
                ‹
              </button>
              <div style={S.calMonthYear}>{MONTHS_FULL[calMonth]} {calYear}</div>
              <button style={S.calNavBtn} onClick={nextMonth}>›</button>
            </div>

            {/* Day labels */}
            <div style={S.calGrid} className="booking-cal-grid">
              {DAYS_SHORT.map(d => (
                <div key={d} style={S.calDayLabel}>{d.slice(0,2)}</div>
              ))}

              {/* Calendar days */}
              {calDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const isPast     = day < today;
                const isToday    = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDate);
                const isDisabled = isPast;
                const dayType    = getDayType(day);

                return (
                  <div
                    key={i}
                    style={S.calDay(isSelected, isToday, isPast, isDisabled, dayType)}
                    onClick={() => handleDayClick(day)}
                    title={getHolidayName(day) || ""}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Calendar legend */}
            <div style={S.calLegend}>
              <div style={S.calLegendItem}><div style={S.calLegendDot("#16a34a")} /> Weekday</div>
              <div style={S.calLegendItem}><div style={S.calLegendDot("#3b82f6")} /> Weekend</div>
              <div style={S.calLegendItem}><div style={S.calLegendDot("#ff8080")} /> Holiday</div>
            </div>

            {/* Selected date label */}
            <div style={S.calSelectedLabel}>
              <span style={S.calSelIcon}>📅</span>
              <span style={S.calSelText}>
                {DAYS_SHORT[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTHS_SHORT[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
            </div>
          </div>

          {/* ── SESSION TOGGLE ── */}
          <div style={S.sLabel}>Select Session</div>
          <div style={S.sessionWrap} className="booking-session-wrap">
            <button style={S.sessionBtn(!isNight,false)} onClick={() => handleSessionChange("day")}>
              <span style={{ fontSize:22 }}>☀️</span>
              <div>
                <span style={S.sBtnTitle}>Day Session</span>
                <span style={S.sBtnSub(!isNight,false)}>06:00–18:00 · 12 slots</span>
              </div>
            </button>
            <button style={S.sessionBtn(isNight,true)} onClick={() => handleSessionChange("night")}>
              <span style={{ fontSize:22 }}>🌙</span>
              <div>
                <span style={S.sBtnTitle}>Night Session</span>
                <span style={S.sBtnSub(isNight,true)}>18:00–00:00 · 6 slots</span>
              </div>
            </button>
          </div>

          {/* ── FACILITIES ── */}
          <div style={S.sLabel}>Select Facility</div>
          {loadingFacility ? (
            <div style={S.loadingBox}>Loading facilities...</div>
          ) : (
            <div style={S.facilityGrid} className="booking-facility-grid">
              {facilities.map((f, idx) => {
                const sel = selectedFacility === idx;
                return (
                  <div key={f.id} style={S.facilityCard(sel, isNight)} onClick={() => handleFacilitySelect(idx)}>
                    <div style={S.fcAccent(sel, isNight)} />
                    <span style={S.fcIcon}>{f.icon}</span>
                    <div style={S.fcName}>{f.name}</div>
                    <div style={S.fcTag}>{f.tag}</div>
                    <div style={S.fcRate(isNight)}>LKR {getFacilityDisplayRate(f, selectedDate, isNight).toLocaleString()} / hr</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TIME SLOTS ── */}
          <div style={S.sLabel}>Select Time Slots</div>
          <div style={S.slotHeader(isNight)}>
            <span style={{ fontSize:15 }}>{isNight ? "🌙" : "☀️"}</span>
            <span style={S.slotHeaderText(isNight)}>{isNight ? "Night Session" : "Day Session"}</span>
            <span style={S.slotHeaderSub}>{isNight ? "18:00–00:00 · 6 slots" : "06:00–18:00 · 12 slots"}</span>
          </div>

          <div style={S.legend}>
            {[
              [accentColor,                     "Available"],
              [isNight ? "#2563eb" : "#15803d", "Selected"],
              ["#ef4444",                       "Booked"],
              ["#f59e0b",                       "Processing"],
              ["#9ca3af",                       "Past"],
            ].map(([c,l]) => (
              <div key={l} style={S.legendItem}><div style={S.legendDot(c)} /> {l}</div>
            ))}
          </div>

          {loadingSlots ? (
            <div style={S.loadingBox}>Checking availability...</div>
          ) : isBlocked ? (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"32px 24px", textAlign:"center", gridColumn:"1/-1" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🚫</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#dc2626", marginBottom:8 }}>Facility Unavailable</div>
              <div style={{ fontSize:14, color:"#6b7280" }}>This facility is not available on the selected date.</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#dc2626", marginTop:8, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"6px 16px", display:"inline-block" }}>
                Reason: {blockReason}
              </div>
            </div>
          ) : (
            <div style={S.slotGrid} className="booking-slot-grid">
              {TIME_SLOTS.map((slotStr, i) => {
                const past     = isSlotPast(slotStr, selectedDate);
                const booked   = bookedSlots.includes(slotStr);
                const selected = selectedSlots.has(i) && !past;
                const locked   = !selected && lockedSlots.includes(slotStr);
                return (
                  <div
                    key={i}
                    style={{
                      ...(locked ? S.slotLocked : S.slot(selected, booked, past, isNight)),
                      ...(isAdmin && booked && !past ? { cursor:"pointer", borderColor: isNight ? "#3b82f6" : "#16a34a", opacity:0.75 } : {}),
                    }}
                    onClick={() => {
                      if (past) return;
                      if (locked) return;
                      if (booked) {
                        if (isAdmin) handleAdminSlotClick(slotStr);
                        return;
                      }
                      handleSlotToggle(slotStr);
                    }}
                  >
                    <span style={S.slotTime}>{slotStr}</span>
                    <span style={S.slotBadge}>
                      {locked ? "⏳ Processing" : past ? "Past" : booked ? (isAdmin ? "Booked 👁" : "Booked") : selected ? "Selected ✓" : "Available"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT SUMMARY ── */}
        <div style={S.summary} className="booking-summary">
          <div style={S.sumTitle}>Booking Summary</div>

          <div style={S.sumRow}>
            <div style={S.sumKey}>Date</div>
            <div style={S.sumVal(false)}>{dateLabel}</div>
            {selectedDayType !== "weekday" && (
              <div style={{ ...S.dayTypeBadge(selectedDayType), marginTop:8, marginBottom:0 }}>
                {selectedDayType === "holiday" ? "🎉 Holiday" : "📅 Weekend"}
              </div>
            )}
          </div>
          <div style={S.sumRow}>
            <div style={S.sumKey}>Session</div>
            <div style={S.sesBadge(isNight)}>{isNight ? "🌙 Night 18:00–00:00" : "☀️ Day 06:00–18:00"}</div>
          </div>
          <div style={S.sumRow}>
            <div style={S.sumKey}>Facility</div>
            <div style={S.sumVal(selectedFacility===null)}>
              {selectedFacility !== null ? facilities[selectedFacility]?.name : "Not selected"}
            </div>
          </div>
          <div style={S.sumRow}>
            <div style={S.sumKey}>Time Slots</div>
            {sortedSlots.length === 0
              ? <div style={S.sumVal(true)}>No slots selected</div>
              : <div>{sortedSlots.map(i => <span key={i} style={S.slotPill(isNight)}>{TIME_SLOTS[i]}</span>)}</div>
            }
          </div>

          {canConfirm && (
            <div style={{ marginBottom:20 }}>
              <div style={S.durRow}>
                <span style={S.durLabel}>Duration</span>
                <span style={S.durVal}>{selectedSlots.size} hr{selectedSlots.size>1?"s":""}</span>
              </div>
              <div style={S.durRow}>
                <span style={S.durLabel}>Rate ({isNight?"Night 🌙":"Day ☀️"})</span>
                <span style={S.durVal}>
                  LKR {(rate||0).toLocaleString()} / hr
                </span>
              </div>
              <div style={S.totalRow}>
                <span style={S.totalLabel}>Total</span>
                <span style={S.totalPrice(isNight)}>LKR {total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div style={S.spacer} />

          {!loggedIn && canConfirm && (
            <div style={S.loginBanner}>🔒 Login or register to confirm your booking.</div>
          )}

          <button
            style={S.btnConfirm(!canConfirm || confirming, isNight)}
            disabled={!canConfirm || confirming}
            onClick={handleConfirm}
          >
            {confirming ? "CONFIRMING..." : loggedIn ? "CONFIRM BOOKING" : "LOGIN TO BOOK"}
          </button>
          <button style={S.btnClear} onClick={handleClear}>Clear Selection</button>
        </div>
      </div>

      {/* Admin slot info modal */}
      {slotModal && (
        <div style={S.modalOverlay} onClick={() => setSlotModal(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Slot Info</div>
            <div style={S.modalSlot}>🕐 {slotModal.slot} · {session === "night" ? "Night 🌙" : "Day ☀️"}</div>

            {slotModal.info?.booked ? (
              <>
                <div style={S.modalRow}>
                  <span style={S.modalIcon}>👤</span>
                  <div>
                    <div style={S.modalLabel}>Customer Name</div>
                    <div style={S.modalVal}>{slotModal.info.user?.name || "—"}</div>
                  </div>
                </div>
                <div style={S.modalRow}>
                  <span style={S.modalIcon}>📞</span>
                  <div>
                    <div style={S.modalLabel}>Phone Number</div>
                    <div style={S.modalVal}>{slotModal.info.user?.phone || "—"}</div>
                  </div>
                </div>
                <div style={S.modalRow}>
                  <span style={S.modalIcon}>📧</span>
                  <div>
                    <div style={S.modalLabel}>Email</div>
                    <div style={S.modalVal}>{slotModal.info.user?.email || "—"}</div>
                  </div>
                </div>
                {slotModal.info.is_shadow && (
                  <div style={S.modalVia}>
                    ⚠️ Auto-blocked via: {slotModal.info.booked_via}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color:"#6b7280", fontSize:14 }}>No booking found for this slot.</div>
            )}

            <button style={S.modalClose} onClick={() => setSlotModal(null)}>Close</button>
          </div>
        </div>
      )}


      {/* ── PAYMENT MODAL ── */}
      {showPayModal && (
        <div style={S.payOverlay} onClick={() => !confirming && setShowPayModal(false)}>
          <div style={S.payBox} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <div style={S.payTitle}>Confirm Booking</div>
              <div style={{ fontSize:13, fontWeight:600, color: timeLeft < 120 ? "#dc2626" : "#16a34a", background: timeLeft < 120 ? "#fef2f2" : "#f0fdf4", border:`1px solid ${timeLeft < 120 ? "#fecaca" : "#bbf7d0"}`, borderRadius:8, padding:"4px 12px" }}>
                ⏱ {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}
              </div>
            </div>
            <div style={S.paySub}>Pay a minimum deposit of LKR 500 now. Remaining balance to be paid at the venue.</div>

            {/* Booking summary */}
            <div style={S.payRow}>
              <span style={S.payLabel}>Facility</span>
              <span style={S.payVal}>{facilities[selectedFacility]?.name}</span>
            </div>
            <div style={S.payRow}>
              <span style={S.payLabel}>Date</span>
              <span style={S.payVal}>{dateLabel}</span>
            </div>
            <div style={S.payRow}>
              <span style={S.payLabel}>Slots</span>
              <span style={S.payVal}>{[...selectedSlots].length} hr{[...selectedSlots].length > 1 ? "s" : ""}</span>
            </div>
            <div style={{ ...S.payRow, borderBottom:"none", marginTop:8 }}>
              <span style={{ ...S.payLabel, fontWeight:700, color:"#14532d" }}>Total Amount</span>
              <span style={S.payTotal}>LKR {total.toLocaleString()}</span>
            </div>

            {/* Amount input */}
            <div style={S.payInputWrap}>
              <label style={S.payInputLabel}>Pay Now (LKR)</label>
              <input
                style={S.payInput}
                type="number"
                min={500}
                max={total}
                value={paidAmount}
                onChange={e => setPaidAmount(Math.min(total, Math.max(0, parseInt(e.target.value) || 0)))}
              />
              {paidAmount < 500 && <div style={S.payError}>⚠️ Minimum deposit is LKR 500</div>}
              {paidAmount > total && <div style={S.payError}>⚠️ Cannot exceed total amount</div>}
            </div>

            {/* Balance info */}
            <div style={S.payMsg}>
              💰 Paying now: <strong>LKR {paidAmount.toLocaleString()}</strong>
              {paidAmount < total && (
                <> · Balance at venue: <strong>LKR {(total - paidAmount).toLocaleString()}</strong></>
              )}
              {paidAmount === total && <> · <strong>Full amount paid ✅</strong></>}
            </div>

            <div style={S.payBtnRow}>
              <button style={S.payCancelBtn} onClick={() => { setShowPayModal(false); setLockedSlots([]); setLockExpiry(null); unlockSlots().catch(()=>{}); }} disabled={confirming}>
                Cancel
              </button>
              <button
                style={{ ...S.payBtn, opacity: (paidAmount < 500 || paidAmount > total || confirming) ? 0.6 : 1, cursor: (paidAmount < 500 || paidAmount > total || confirming) ? "not-allowed" : "pointer" }}
                onClick={handlePayAndBook}
                disabled={paidAmount < 500 || paidAmount > total || confirming}
              >
                {confirming ? "CONFIRMING..." : "CONFIRM & BOOK"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={S.toast(toast.v)}>{toast.msg}</div>
    </>
  );
}