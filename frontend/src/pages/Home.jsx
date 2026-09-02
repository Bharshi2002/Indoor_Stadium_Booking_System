import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFacilities, isLoggedIn, getUsername } from "../api";

const S = {
  page: { fontFamily:"'DM Sans',sans-serif", background:"linear-gradient(180deg, #f0fdf4 0%, #ffffff 40%)", minHeight:"100vh", color:"#14532d", position:"relative", display:"flex", flexDirection:"column" },
  lines: { position:"fixed", inset:0, background:"repeating-linear-gradient(90deg,transparent,transparent 120px,rgba(22,163,74,0.03) 120px,rgba(22,163,74,0.03) 121px),repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(22,163,74,0.03) 80px,rgba(22,163,74,0.03) 81px)", pointerEvents:"none", zIndex:0 },
  content: { flex:1 },

  // Hero
  hero: { position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"48px 40px 40px", display:"flex", flexDirection:"column", alignItems:"flex-start" },
  badge: { display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:100, padding:"6px 16px", fontSize:12, fontWeight:600, color:"#ffffff", letterSpacing:1, textTransform:"uppercase", marginBottom:16 },
  h1: { fontFamily:"'Bebas Neue',sans-serif", fontSize:88, letterSpacing:3, lineHeight:0.95, color:"#ffffff", marginBottom:12, marginTop:0, maxWidth:700, textShadow:"0 4px 16px rgba(0,0,0,0.4)" },
  h1a: { color:"#4ade80", textShadow:"0 0 20px rgba(74,222,128,0.5)" },
  sub: { fontSize:16, color:"rgba(255,255,255,0.85)", maxWidth:520, lineHeight:1.6, marginBottom:28 },
  btnRow: { display:"flex", gap:16, flexWrap:"wrap" },
  btnP: { display:"inline-block", textDecoration:"none", fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, padding:"16px 40px", borderRadius:12, background:"#16a34a", color:"#f0f7f0", cursor:"pointer", border:"none" },
  btnS: { display:"inline-block", textDecoration:"none", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, padding:"16px 32px", borderRadius:12, background:"rgba(255,255,255,0.15)", color:"#ffffff", border:"1px solid rgba(255,255,255,0.4)" },

  // Welcome back banner (logged in)
  welcomeBanner: { position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"32px 40px 0" },
  welcomeBox: { background:"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border:"1px solid #86efac", boxShadow:"0 4px 16px rgba(22,163,74,0.1)", borderRadius:16, padding:"24px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 },
  welcomeText: { fontSize:16, fontWeight:600, color:"#14532d" },
  welcomeSub: { fontSize:13, color:"#6b7280", marginTop:4 },

  // Stats
  statsRow: { position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"32px 40px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 },
  statCard: { flex:1, minWidth:180, background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, padding:"28px 24px", borderTop:"3px solid #16a34a", boxShadow:"0 4px 20px rgba(22,163,74,0.08)", transition:"transform .2s, box-shadow .2s" },
  statNum: { fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:"#16a34a", lineHeight:1, letterSpacing:2, marginBottom:8, textShadow:"0 0 20px rgba(22,163,74,0.25)" },
  statLabel: { fontSize:13, color:"#6b7280", marginTop:6, fontWeight:500 },

  // Facilities
  section: { position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"0 40px 80px" },
  sectionTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:2, color:"#14532d", marginBottom:8 },
  sectionSub: { fontSize:14, color:"#6b7280", marginBottom:40 },
  facilityGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 },
  facilityCard: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:16, overflow:"hidden", transition:"all .25s", boxShadow:"0 4px 16px rgba(22,163,74,0.08)", cursor:"pointer", display:"flex", flexDirection:"column" },
  facilityPhoto: { width:"100%", height:160, objectFit:"cover", display:"block" },
  lightboxOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  lightboxImg: { maxWidth:"90vw", maxHeight:"85vh", objectFit:"contain", borderRadius:12, boxShadow:"0 24px 64px rgba(0,0,0,0.5)" },
  lightboxClose: { position:"absolute", top:20, right:24, background:"rgba(255,255,255,0.15)", border:"none", color:"#ffffff", fontSize:28, width:44, height:44, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" },
  lightboxName: { position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.6)", color:"#ffffff", fontSize:14, fontWeight:600, padding:"8px 20px", borderRadius:20, whiteSpace:"nowrap", backdropFilter:"blur(4px)" },
  facilityCardBody: { padding:"16px 20px 20px", display:"flex", flexDirection:"column", flex:1 },
  facilityAccent: { position:"absolute", top:0, left:0, right:0, height:2, background:"#16a34a" },
  facilityIcon: { fontSize:36, marginBottom:14, display:"block" },
  facilityName: { fontSize:15, fontWeight:600, color:"#14532d", marginBottom:4 },
  facilityTag:  { fontSize:12, color:"#6b7280", marginBottom:12 },
  facilityRate: { fontSize:13, fontWeight:700, color:"#16a34a" },
  facilityBtn: { display:"inline-block", marginTop:16, textDecoration:"none", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, padding:"8px 20px", borderRadius:8, background:"transparent", color:"#16a34a", border:"1px solid rgba(200,245,58,0.3)", transition:"all .18s" },

  // CTA (only shown when not logged in)
  cta: { position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"0 40px 80px" },
  ctaBox: { background:"#ffffff", border:"1px solid #d1e7d1", borderRadius:24, padding:"60px 56px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:40, flexWrap:"wrap" },
  ctaTitle: { fontFamily:"'Bebas Neue',sans-serif", fontSize:42, letterSpacing:2, color:"#14532d", lineHeight:1, marginBottom:10 },
  ctaSub: { fontSize:15, color:"#6b7280" },

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  footer: { position:"relative", zIndex:1, background:"#f0fdf4", borderTop:"3px solid #16a34a", marginTop:"auto", boxShadow:"0 -4px 20px rgba(22,163,74,0.08)" },
  footerInner: { maxWidth:900, margin:"0 auto", padding:"48px 40px 24px" },
  footerGrid: { display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:40, marginBottom:32 },
  footerBrand: {},
  footerLogoRow: { display:"flex", alignItems:"center", gap:10, marginBottom:12 },
  footerLogoIcon: { width:36, height:36, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  footerLogoText: { fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:"#14532d" },
  footerLogoAccent: { color:"#16a34a" },
  footerDesc: { fontSize:13, color:"#374151", lineHeight:1.7, maxWidth:280 },
  footerColTitle: { fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#14532d", marginBottom:16 },
  footerItem: { display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#111827", marginBottom:10 },
  footerItemIcon: { fontSize:15, flexShrink:0 },
  footerHours: { fontSize:13, color:"#111827", lineHeight:2 },
  footerDivider: { height:"1px", background:"#bbf7d0", marginBottom:24 },
  footerBottom: { display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 },
  footerCopy: { fontSize:12, color:"#6b7280" },
  footerCredit: { fontSize:12, color:"#6b7280" },
  footerCreditName: { color:"#16a34a", fontWeight:600 },
};

export default function Home() {
  // Inject mobile responsive CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "home-mobile-css";
    style.innerHTML = `
      @media (max-width: 768px) {
        /* Hero */
        .home-hero { padding: 28px 16px 24px !important; }
        .home-h1 { font-size: 46px !important; letter-spacing: 2px !important; }
        .home-btn-row { flex-wrap: wrap !important; gap: 10px !important; }

        /* Stats */
        .home-stats-row { 
          grid-template-columns: repeat(2, 1fr) !important; 
          padding: 20px 16px !important; 
          gap: 10px !important; 
        }

        /* Facilities */
        .home-section { padding: 0 16px 32px !important; }
        .home-facility-grid { 
          grid-template-columns: repeat(2, 1fr) !important; 
          gap: 10px !important; 
        }

        /* Welcome banner */
        .home-welcome { padding: 0 16px 16px !important; }

        /* CTA */
        .home-cta { padding: 0 16px 32px !important; }
        .home-cta-box { 
          padding: 28px 20px !important; 
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 20px !important;
        }

        /* Footer */
        .home-footer-inner { padding: 28px 16px 16px !important; }
        .home-footer-grid { 
          grid-template-columns: 1fr !important; 
          gap: 20px !important; 
          margin-bottom: 20px !important;
        }
        .home-footer-grid > div { font-size: 14px !important; }
        .home-footer-grid a, .home-footer-grid div { font-size: 13px !important; }
      }

      @media (max-width: 480px) {
        .home-h1 { font-size: 38px !important; }
        .home-footer-grid { grid-template-columns: 1fr !important; }
        .home-facility-grid { grid-template-columns: repeat(2, 1fr) !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { const s = document.getElementById("home-mobile-css"); if(s) s.remove(); };
  }, []);

  const slideshowPhotos = [
    "https://images.unsplash.com/photo-1776999035766-9c2b5cddf613?w=1920&h=900&fit=crop&q=90",
    "https://images.unsplash.com/photo-1660110661640-671af78f39b7?w=1920&h=900&fit=crop&q=90",
    "https://images.unsplash.com/photo-1581412037192-c197ef399462?w=1920&h=900&fit=crop&q=90",
    "https://images.unsplash.com/photo-1599204606350-d7fb87de75f6?w=1920&h=900&fit=crop&q=90",
    "https://images.unsplash.com/photo-1666901356149-93f2eb3ba5a2?w=1920&h=900&fit=crop&q=90",
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1920&h=900&fit=crop&q=90",
  ];

  // Auto-rotate slideshow every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % slideshowPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  const navigate   = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loggedIn,   setLoggedIn]   = useState(false);
  const [username,   setUsername]   = useState("");
  const [lightbox,   setLightbox]   = useState(null); // { src, name }
  const [slideIndex,  setSlideIndex]  = useState(0);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);

    setLoggedIn(isLoggedIn());
    setUsername(getUsername());

    getFacilities()
      .then(d => setFacilities(d.facilities))
      .catch(() => setFacilities([]));

    return () => document.head.removeChild(link);
  }, []);

  // Map facility names to their photos
  const facilityPhotos = {
    "Football":               "/facilities/football.jpeg",
    "Cricket 1":              "/facilities/cricket1.jpeg",
    "Cricket Practice Net":   "/facilities/cricket2.jpeg",
    "Cricket 2":              "/facilities/cricket2.jpeg",
    "Badminton Court 1":      "/facilities/badminton1.jpeg",
    "Badminton Court 2":      "/facilities/badminton2.jpeg",
    "Volleyball Court":       "/facilities/volleyball.jpeg",
    "Pool Table":             "/facilities/pool-table.jpeg",
  };

  return (
    <div style={S.page}>
      <div style={S.lines} />

      <div style={S.content}>

        {/* ── HERO ── */}
        <div style={{ position:"relative", overflow:"hidden", minHeight:600 }}>
          {/* Slideshow images */}
          {slideshowPhotos.map((src, i) => (
            <div key={i} style={{
              position:"absolute", inset:0,
              backgroundImage:`url('${src}')`,
              backgroundSize:"cover",
              backgroundPosition:"center center",
              backgroundRepeat:"no-repeat",
              opacity: i === slideIndex ? 1 : 0,
              transition:"opacity 1.2s ease-in-out",
              zIndex:0,
            }} />
          ))}
          {/* Dark overlay */}
          <div style={{ position:"absolute", inset:0, background:"rgba(5,46,22,0.72)", zIndex:1 }} />
          {/* Slide dots */}
          <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)", display:"flex", gap:8, zIndex:3 }}>
            {slideshowPhotos.map((_, i) => (
              <div key={i} onClick={() => setSlideIndex(i)} style={{ width: i===slideIndex ? 24 : 8, height:8, borderRadius:4, background: i===slideIndex ? "#4ade80" : "rgba(255,255,255,0.4)", cursor:"pointer", transition:"all .3s" }} />
            ))}
          </div>
          <div style={{ ...S.hero, position:"relative", zIndex:2 }} className="home-hero">
          <div style={S.badge} className="home-badge">🏟️ Horizon Indoor Complex</div>
          <h1 style={S.h1} className="home-h1">
            Book Your <span style={S.h1a}>Court.</span><br />
            Play Your <span style={S.h1a}>Game.</span>
          </h1>
          <p style={S.sub} className="home-sub">
            Reserve badminton courts, cricket nets, football grounds, volleyball courts
            and more — instantly online. Day and night sessions available.
          </p>
          <div style={S.btnRow} className="home-btn-row">
            <Link to="/booking" style={S.btnP}>Book Now</Link>
            {!loggedIn && (
              <Link to="/register" style={S.btnS}>Create Account</Link>
            )}
          </div>
          <a
            href="https://maps.app.goo.gl/QgJ2E8Ay8GK2NF8X6"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:16, textDecoration:"none", background:"rgba(255,255,255,0.15)", color:"#ffffff", fontSize:13, fontWeight:600, padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,0.4)", cursor:"pointer" }}
          >
            📍 Madawala Bazzar, Kandy — View on Google Maps
          </a>
          </div>
        </div>

        {/* ── WELCOME BANNER (logged in only) ── */}
        {loggedIn && (
          <div style={S.welcomeBanner} className="home-welcome">
            <div style={S.welcomeBox} className="home-welcome-box">
              <div>
                <div style={S.welcomeText}>👋 Welcome back, {username}!</div>
                <div style={S.welcomeSub}>Ready for your next session? Book a court below.</div>
              </div>
              <Link to="/dashboard" style={{ ...S.btnS, fontSize:13, padding:"10px 24px" }}>
                My Bookings
              </Link>
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        <div style={S.statsRow} className="home-stats-row">
          {[
            { num:"6+",  label:"Sports Facilities" },
            { num:"18",  label:"Time Slots Daily"  },
            { num:"06",  label:"Opens at 06:00 AM" },
            { num:"24H", label:"Online Booking"    },
          ].map(({ num, label }) => (
            <div key={label} style={S.statCard}>
              <div style={S.statNum}>{num}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── FACILITIES ── */}
        <div style={S.section} className="home-section">
          <div style={S.sectionTitle} className="home-section-title">Our Facilities</div>
          <div style={S.sectionSub}>Pick your sport, pick your time — it's that simple.</div>
          <div style={S.facilityGrid} className="home-facility-grid">
            {facilities.map((f) => (
              <div key={f.id} style={S.facilityCard}>
                <img
                  src={facilityPhotos[f.name] || "/facilities/cricket1.jpeg"}
                  alt={f.name}
                  style={{ ...S.facilityPhoto, cursor:"zoom-in" }}
                  onClick={() => setLightbox({ src: facilityPhotos[f.name] || "/facilities/cricket1.jpeg", name: f.name })}
                />
                <div style={S.facilityCardBody}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:18 }}>{f.icon}</span>
                    <div style={S.facilityName}>{f.name}</div>
                  </div>
                  <div style={S.facilityTag}>{f.tag}</div>
                  <Link to="/booking" style={{ display:"inline-block", marginTop:"auto", paddingTop:12, textDecoration:"none", background:"linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color:"#ffffff", fontSize:12, fontWeight:700, padding:"10px 20px", borderRadius:8, boxShadow:"0 4px 14px rgba(22,163,74,0.4), 0 0 0 1px rgba(22,163,74,0.2)", letterSpacing:"0.5px" }}>
                    Book Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA — only shown when NOT logged in ── */}
        {!loggedIn && (
          <div style={S.cta} className="home-cta">
            <div style={S.ctaBox} className="home-cta-box">
              <div>
                <div style={S.ctaTitle}>Ready to Play?</div>
                <div style={S.ctaSub}>Register for free and book your first session today.</div>
              </div>
              <Link to="/register" style={{ ...S.btnP, fontSize:16 }}>GET STARTED</Link>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerInner} className="home-footer-inner">
          <div style={S.footerGrid} className="home-footer-grid">

            {/* Brand */}
            <div style={S.footerBrand}>
              <div style={S.footerLogoRow}>
                <div style={{ width:36, height:36, background:"#16a34a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏟️</div>
                <div style={S.footerLogoText}>
                  HORIZON<span style={S.footerLogoAccent}>·INDOOR</span>
                </div>
              </div>
              <div style={S.footerDesc}>
                Horizon Indoor Sports Complex — your premier destination for badminton,
                volleyball, cricket and more. Book online, play anytime.
              </div>
            </div>

            {/* Contact */}
            <div>
              <div style={S.footerColTitle}>Contact</div>
              <div style={S.footerItem}>
                <span style={S.footerItemIcon}>📞</span>
                +94 750405050
              </div>
              <a
                href="https://www.facebook.com/profile.php?id=61558877739022"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...S.footerItem, textDecoration:"none", cursor:"pointer" }}
              >
                <span style={{ flexShrink:0, width:20, height:20, background:"#1877f2", borderRadius:4, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                </span>
                Facebook Page
              </a>
              <a
                href="https://maps.app.goo.gl/QgJ2E8Ay8GK2NF8X6"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...S.footerItem, textDecoration:"none", cursor:"pointer" }}
              >
                <span style={S.footerItemIcon}>📍</span>
                Madawala Bazzar, Kandy
              </a>

              <div style={S.footerItem}>
                <span style={S.footerItemIcon}>🌐</span>
                horizon-indoor.com
              </div>
            </div>

            {/* Opening Hours */}
            <div>
              <div style={S.footerColTitle}>Opening Hours</div>
              <div style={S.footerHours}>
                <div style={{ color:"#14532d", fontWeight:600, marginBottom:4 }}>Mon – Sun</div>
                <div>06:00 AM – 12:00 AM</div>
                <div style={{ marginTop:8, color:"#166534", fontSize:12 }}>
                  Day · 06:00 – 18:00<br />
                  Night · 18:00 – 00:00
                </div>
              </div>
            </div>
          </div>

          <div style={S.footerDivider} />

          {/* Bottom bar */}
          <div style={S.footerBottom} className="home-footer-bottom">
            <div style={S.footerCopy}>
              © 2026 Horizon Indoor. All rights reserved.
            </div>
            {/* ── Creator credit ── */}
            <div style={S.footerCredit}>
              Designed & Developed by{" "}
              <span style={S.footerCreditName}>Aadhil Nazir</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div style={S.lightboxOverlay} onClick={() => setLightbox(null)}>
          <button style={S.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
          <img
            src={lightbox.src}
            alt={lightbox.name}
            style={S.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          <div style={S.lightboxName}>{lightbox.name}</div>
        </div>
      )}
    </div>
  );
}