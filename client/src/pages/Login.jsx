import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  // ===============================
  // AUTH CONTEXT
  // ===============================

  const { login } = useAuth();

  // ===============================
  // STATE
  // ===============================

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ===============================
  // LOGIN FUNCTION
  // ===============================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------
    // Validation
    // -------------------------------

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // -------------------------------
      // Send login request to backend
      // -------------------------------

      const response = await fetch(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password
          })
        }
      );

      const data = await response.json();

      // -------------------------------
      // Backend error
      // -------------------------------

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      // -------------------------------
      // Login successful
      // -------------------------------

      setSuccess("Login successful!");

      console.log("Login response:", data);

      // -------------------------------
      // SAVE LOGIN USING AUTH CONTEXT
      // -------------------------------

      login(
        data.user,
        data.token,
        rememberMe
      );

      // -------------------------------
      // Redirect according to role
      // -------------------------------

      setTimeout(() => {

        if (data.user.role === "donor") {

          navigate("/donor-dashboard");

        } else if (data.user.role === "receiver") {

          navigate("/receiver-dashboard");

        } else if (data.user.role === "volunteer") {

          navigate("/volunteer-dashboard");

        } else if (data.user.role === "admin") {

          navigate("/admin-dashboard");

        } else {

          navigate("/");

        }

      }, 800);

    } catch (error) {

      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );

    } finally {

      setLoading(false);

    }
  };

  // ===============================
  // UI
  // ===============================

  return (
    <div className="login-page">

      <div className="login-container">

        {/* ================= HEADER ================= */}

        <div className="login-header">

          <div className="login-icon">

            <Heart
              size={30}
              fill="currentColor"
            />

          </div>

          <h1>Welcome Back</h1>

          <p>
            Login to continue your Food Rescue journey.
          </p>

        </div>


        {/* ================= LOGIN FORM ================= */}

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          {/* ================= EMAIL ================= */}

          <div className="form-group">

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {

                setEmail(e.target.value);
                setError("");

              }}
              required
            />

          </div>


          {/* ================= PASSWORD ================= */}

          <div className="form-group">

            <label>Password</label>

            <div className="password-wrapper">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {

                  setPassword(e.target.value);
                  setError("");

                }}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >

                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}

              </button>

            </div>

          </div>


          {/* ================= OPTIONS ================= */}

          <div className="login-options">

            <label>

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              Remember me

            </label>


            <a href="#forgot-password">
              Forgot Password?
            </a>

          </div>


          {/* ================= ERROR ================= */}

          {error && (

            <div className="error-message">
              {error}
            </div>

          )}


          {/* ================= SUCCESS ================= */}

          {success && (

            <div className="success-message">
              {success}
            </div>

          )}


          {/* ================= LOGIN BUTTON ================= */}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>


        {/* ================= REGISTER ================= */}

        <div className="register-link">

          Don't have an account?

          {" "}

          <Link to="/register">
            Register
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;