import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      {/* Logo */}
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">
          <Heart size={22} fill="currentColor" />
        </div>

        <span>Food Rescue</span>
      </Link>

      {/* Navigation Links */}
      <div className="navbar-links">

        <Link to="/" className="nav-link">
          Home
        </Link>

        <a href="/#how-it-works" className="nav-link nav-link-extra">
          How it works
        </a>

        <a href="/#accounts" className="nav-link nav-link-extra">
          Accounts
        </a>

        <Link to="/about" className="nav-link nav-link-extra">
          About
        </Link>

        <Link to="/contact" className="nav-link nav-link-extra">
          Contact
        </Link>

        <Link to="/register" className="nav-link">
          Register
        </Link>

        <Link to="/login" className="login-btn">
          Login
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;
