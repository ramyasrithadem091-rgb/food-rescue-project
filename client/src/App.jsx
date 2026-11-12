
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// PUBLIC PAGES
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Impact from "./pages/Impact";

// DONOR
import DonateFood from "./pages/DonateFood";
import DonorDashboard from "./pages/DonorDashboard";

// RECEIVER
import ReceiverDashboard from "./receiver/ReceiverDashboard";
import ReceiverInvitation from "./receiver/ReceiverInvitation";

// VOLUNTEER
import VolunteerDashboard from "./volunteer/VolunteerDashboard";

// ADMIN
import AdminDashboard from "./admin/AdminDashboard";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/impact" element={<Impact />} />

          {/* PUBLIC RECEIVER INVITATION */}
          <Route
            path="/receiver-invitation/:token"
            element={<ReceiverInvitation />}
          />

          {/* DONOR ROUTES */}
          <Route
            path="/donor-dashboard"
            element={
              <ProtectedRoute allowedRole="donor">
                <DonorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/donate-food"
            element={
              <ProtectedRoute allowedRole="donor">
                <DonateFood />
              </ProtectedRoute>
            }
          />

          {/* RECEIVER ROUTE */}
          <Route
            path="/receiver-dashboard"
            element={
              <ProtectedRoute allowedRole="receiver">
                <ReceiverDashboard />
              </ProtectedRoute>
            }
          />

          {/* VOLUNTEER ROUTE */}
          <Route
            path="/volunteer-dashboard"
            element={
              <ProtectedRoute allowedRole="volunteer">
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTE */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div style={{ padding: "40px", textAlign: "center" }}>
                <h1>404</h1>
                <p>Page not found.</p>
                <a href="/login">Go to Login</a>
              </div>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
