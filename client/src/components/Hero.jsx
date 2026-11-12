import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  HandHeart,
  Truck,
  ShieldCheck,
  Leaf,
} from "lucide-react";

function Hero() {
  return (
    <section className="hero" id="home">

      {/* Decorative circles */}
      <div className="hero-circle circle-one"></div>
      <div className="hero-circle circle-two"></div>

      <div className="hero-container">

        {/* LEFT SIDE */}
        <div className="hero-content">

          <div className="hero-badge">
            <Leaf size={17} />
            Reduce Food Waste • Fight Hunger
          </div>

          <h1>
            Rescue Food.
            <br />
            <span>Serve People.</span>
          </h1>

          <p className="hero-description">
            Got extra food after a meal or an event? Post it here. We find
            nearby orphanages and old age homes that can use it, tell them by
            SMS, and a volunteer can deliver it.
          </p>

          <div className="hero-buttons">

            <Link to="/register?role=donor" className="primary-btn">
              Donate Food
              <ArrowRight size={18} />
            </Link>

            <Link to="/register?role=volunteer" className="secondary-btn">
              Volunteer with us
              <ArrowRight size={18} />
            </Link>

          </div>

          {/* Trust points */}
          <div className="hero-features">

            <div>
              <ShieldCheck size={20} />
              <span>
                <strong>Safe & Verified</strong>
                <small>Trusted users</small>
              </span>
            </div>

            <div>
              <Heart size={20} />
              <span>
                <strong>Community Driven</strong>
                <small>People helping people</small>
              </span>
            </div>

            <div>
              <Leaf size={20} />
              <span>
                <strong>Less Waste</strong>
                <small>More food rescued</small>
              </span>
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="hero-visual">

          <div className="visual-card">

            <div className="visual-icon">
              <HandHeart size={60} />
            </div>

            <h2>Good Food</h2>

            <p>
              finds the right people
            </p>

            <div className="food-flow">

              <div>
                <span>🍱</span>
                <small>Surplus Food</small>
              </div>

              <ArrowRight />

              <div>
                <span>🤝</span>
                <small>Smart Match</small>
              </div>

              <ArrowRight />

              <div>
                <span>❤️</span>
                <small>People Served</small>
              </div>

            </div>

          </div>

          {/* Floating card */}
          <div className="floating-card">
            <Truck size={23} />
            <div>
              <strong>Food Rescue</strong>
              <small>From surplus to service</small>
            </div>
          </div>

        </div>

      </div>

      {/* ROLE CARDS - each one now leads somewhere */}
      <div className="role-container">

        <Link to="/register?role=donor" className="role-card donor-card">
          <div className="role-icon">
            🍱
          </div>

          <div>
            <h3>Donor</h3>
            <p>Have extra food? Donate it.</p>
          </div>

          <ArrowRight />
        </Link>


        <a href="#who-we-help" className="role-card receiver-card">
          <div className="role-icon">
            🏠
          </div>

          <div>
            <h3>Receiver</h3>
            <p>See who we help.</p>
          </div>

          <ArrowRight />
        </a>


        <Link to="/register?role=volunteer" className="role-card volunteer-card">
          <div className="role-icon">
            🛵
          </div>

          <div>
            <h3>Volunteer</h3>
            <p>Help with delivery.</p>
          </div>

          <ArrowRight />
        </Link>


        <Link to="/login" className="role-card admin-card">
          <div className="role-icon">
            🛡️
          </div>

          <div>
            <h3>Admin</h3>
            <p>Manage the platform.</p>
          </div>

          <ArrowRight />
        </Link>

      </div>

    </section>
  );
}

export default Hero;
