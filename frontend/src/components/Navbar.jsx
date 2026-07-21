import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isLoggedIn, getRole, getUsername, apiLogout } from "../api";

const LINKS = [
  { to: "/",         label: "Home" },
  { to: "/booking",  label: "Book Now" },
  { to: "/dashboard",label: "My Bookings", authOnly: true,  adminHide: true },
  { to: "/admin",    label: "Admin Panel", adminOnly: true },
];

export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [loggedIn,   setLoggedIn]   = useState(false);
  const [role,       setRole]       = useState("user");
  const [username,   setUsername]   = useState("");

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setRole(getRole());
    setUsername(getUsername());
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (p) =>
    p === "/" ? location.pathname === "/" : location.pathname.startsWith(p);

  const handleLogout = async () => {
    await apiLogout();
    setLoggedIn(false);
    navigate("/login");
  };

  const visibleLinks = LINKS.filter(({ authOnly, adminOnly, adminHide }) => {
    if (adminOnly  && role !== "admin") return false;
    if (adminHide  && role === "admin") return false;
    if (authOnly   && !loggedIn)        return false;
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
        .nb-root { position:fixed;top:0;left:0;right:0;z-index:1000;background:#ffffff;border-bottom:1px solid #dcfce7;font-family:'DM Sans',sans-serif; }
        .nb-inner { max-width:1280px;margin:0 auto;padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between; }
        .nb-logo { display:flex;align-items:center;gap:10px;text-decoration:none; }
        .nb-logo-icon { width:34px;height:34px;background:#16a34a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px; }
        .nb-logo-text { font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;color:#14532d;line-height:1; }
        .nb-logo-text span { color:#16a34a; }
        .nb-links { display:flex;align-items:center;gap:2px;list-style:none;margin:0;padding:0; }
        .nb-link { text-decoration:none;font-size:14px;font-weight:500;padding:8px 18px;border-radius:8px;color:#4b7a4b;transition:color .18s,background .18s;position:relative; }
        .nb-link:hover { color:#14532d;background:#ffffff; }
        .nb-link.active { color:#16a34a;background:#f0fdf4; }
        .nb-link.active::after { content:'';position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:18px;height:2px;background:#16a34a;border-radius:2px; }
        .nb-auth { display:flex;align-items:center;gap:8px; }
        .nb-user { display:flex;align-items:center;gap:8px; }
        .nb-avatar { width:32px;height:32px;background:#bbf7d0;border:1px solid #16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#16a34a; }
        .nb-uname { font-size:13px;font-weight:500;color:#1a2e1a; }
        .nb-admin-badge { font-size:10px;font-weight:600;background:#fefce8;border:1px solid #b45309;color:#b45309;border-radius:20px;padding:2px 8px;letter-spacing:1px;text-transform:uppercase; }
        .nb-ghost { text-decoration:none;font-size:13px;font-weight:500;padding:8px 18px;border-radius:8px;color:#14532d;border:1px solid #16a34a;background:transparent;transition:all .18s; }
        .nb-ghost:hover { color:#14532d;border-color:#14532d;background:#bbf7d0; }
        .nb-solid { text-decoration:none;font-size:13px;font-weight:600;padding:8px 20px;border-radius:8px;color:#f0f7f0;background:#16a34a;border:1px solid #16a34a;transition:background .18s;cursor:pointer; }
        .nb-solid:hover { background:#22c55e; }
        .nb-logout { font-size:13px;font-weight:500;padding:8px 16px;border-radius:8px;color:#14532d;border:1px solid #d1e7d1;background:transparent;cursor:pointer;transition:all .18s; }
        .nb-logout:hover { color:#f87171;border-color:#f87171;background:#ffffff; }
        .nb-burger { display:none;flex-direction:column;gap:5px;cursor:pointer;padding:6px;background:none;border:none; }
        .nb-burger span { display:block;width:22px;height:2px;background:#4b7a4b;border-radius:2px;transition:all .22s; }
        .nb-burger.open span:nth-child(1) { transform:translateY(7px) rotate(45deg);background:#16a34a; }
        .nb-burger.open span:nth-child(2) { opacity:0; }
        .nb-burger.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg);background:#16a34a; }
        .nb-mobile { display:none;flex-direction:column;gap:2px;padding:12px 20px 20px;background:#ffffff;border-top:1px solid #dcfce7;position:absolute;top:56px;left:0;right:0;z-index:999;box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .nb-mobile.open { display:flex !important; }
        .nb-mlink { text-decoration:none;font-size:14px;font-weight:500;padding:10px 14px;border-radius:8px;color:#4b7a4b;transition:all .18s; }
        .nb-mlink:hover,.nb-mlink.active { color:#14532d;background:#bbf7d0; }
        .nb-mdiv { height:1px;background:#d1e7d1;margin:8px 0; }
        @media(max-width:768px){ .nb-links{display:none !important;} .nb-burger{display:flex !important;} .nb-inner{padding:0 12px !important;} .nb-auth{display:flex !important;} .nb-uname{display:none !important;} .nb-admin-badge{display:none !important;} .nb-ghost{font-size:11px !important;padding:5px 10px !important;} .nb-solid{font-size:11px !important;padding:5px 10px !important;} .nb-logout{font-size:11px !important;padding:5px 10px !important;} .nb-avatar{width:26px !important;height:26px !important;font-size:11px !important;} .nb-logo-text{font-size:14px !important;} .nb-logo-icon{width:26px !important;height:26px !important;font-size:13px !important;} }
      `}</style>

      <nav className="nb-root">
        <div className="nb-inner">
          <Link to="/" className="nb-logo">
            <div className="nb-logo-icon">🏟️</div>
            <div className="nb-logo-text">HORIZON<span>·INDOOR</span></div>
          </Link>

          <ul className="nb-links">
            {visibleLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={`nb-link ${isActive(to) ? "active" : ""}`}>{label}</Link>
              </li>
            ))}
          </ul>

          <div className="nb-auth">
            {loggedIn ? (
              <div className="nb-user">
                <div className="nb-avatar">{username.charAt(0).toUpperCase()}</div>
                <span className="nb-uname">{username}</span>
                {role === "admin" && <span className="nb-admin-badge">Admin</span>}
                <button className="nb-logout" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <>
                <Link to="/login"    className="nb-ghost">Login</Link>
                <Link to="/register" className="nb-solid">Register</Link>
              </>
            )}
          </div>

          <button className={`nb-burger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>

        <div className={`nb-mobile ${menuOpen ? "open" : ""}`}>
          {visibleLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={`nb-mlink ${isActive(to) ? "active" : ""}`}>{label}</Link>
          ))}
          <div className="nb-mdiv" />
          {loggedIn
            ? <button className="nb-mlink" style={{ border:"none",background:"none",textAlign:"left",color:"#dc2626",cursor:"pointer" }} onClick={handleLogout}>Logout</button>
            : <>
                <Link to="/login"    className="nb-mlink">Login</Link>
                <Link to="/register" className="nb-mlink">Register</Link>
              </>
          }
        </div>
      </nav>
      <div style={{ height: 64, background:"#ffffff" }} />
    </>
  );
}