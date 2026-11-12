import "./About.css";
import { Heart, Brain, MapPin, Users } from "lucide-react";

function About() {
  return (
    <section className="about-section" id="about">

      <div className="about-container">

        {/* Left side */}
        <div className="about-content">

          <span className="about-tag">
            ABOUT FOOD RESCUE
          </span>

          <h2>
            Turning Surplus Food
            <span> Into Hope.</span>
          </h2>

          <p className="about-intro">
            Food Rescue is a smart platform designed to connect
            surplus food with people and organizations that need it.
          </p>

          <p>
            Donors can share available food, while verified receivers
            can find suitable donations based on area, capacity,
            need and availability.
          </p>

          <p>
            Volunteers can also help with pickup and delivery,
            creating a coordinated journey from surplus food
            to someone who needs it.
          </p>

          <div className="about-features">

            <div className="about-feature">
              <div className="about-feature-icon">
                <Heart />
              </div>

              <div>
                <h3>Reduce Food Waste</h3>
                <p>Give surplus food another purpose.</p>
              </div>
            </div>

            <div className="about-feature">
              <div className="about-feature-icon">
                <Users />
              </div>

              <div>
                <h3>Connect Communities</h3>
                <p>Bring donors and receivers together.</p>
              </div>
            </div>

            <div className="about-feature">
              <div className="about-feature-icon">
                <MapPin />
              </div>

              <div>
                <h3>Smart Local Matching</h3>
                <p>Find suitable nearby receivers.</p>
              </div>
            </div>

            <div className="about-feature">
              <div className="about-feature-icon">
                <Brain />
              </div>

              <div>
                <h3>Intelligent Platform</h3>
                <p>Use data to improve redistribution.</p>
              </div>
            </div>

          </div>

        </div>


        {/* Right side */}
        <div className="about-visual">

          <div className="about-main-card">

            <div className="about-heart">
              <Heart />
            </div>

            <h3>
              Good Food
              <br />
              <span>should never go to waste.</span>
            </h3>

            <div className="about-flow">

              <div>
                <strong>01</strong>
                <span>Surplus</span>
              </div>

              <div className="flow-line"></div>

              <div>
                <strong>02</strong>
                <span>Match</span>
              </div>

              <div className="flow-line"></div>

              <div>
                <strong>03</strong>
                <span>Serve</span>
              </div>

            </div>

          </div>

          <div className="about-small-card">
            <Heart />
            <div>
              <strong>Community First</strong>
              <span>Food • People • Impact</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}

export default About;