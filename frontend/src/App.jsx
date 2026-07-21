import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./responsive.css";
import Navbar         from "./components/Navbar";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Booking        from "./pages/Booking";
import Dashboard      from "./pages/Dashboard";
import AdminDashboard  from "./pages/AdminDashboard";
import ForgotPassword  from "./pages/ForgotPassword";
import ResetPassword   from "./pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />}           />
        <Route path="/login"     element={<Login />}          />
        <Route path="/register"  element={<Register />}       />
        <Route path="/booking"   element={<Booking />}        />
        <Route path="/dashboard" element={<Dashboard />}      />
        <Route path="/admin"           element={<AdminDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />}  />
      </Routes>
    </BrowserRouter>
  );
}