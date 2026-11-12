import { Link } from "react-router-dom";
import {
  Utensils,
  Truck,
  MapPin,
  MessageSquare,
  Wallet,
  ShieldCheck,
  Building2,
  Heart,
  ArrowRight,
  Check
} from "lucide-react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";

import "./Home.css";

const donorPoints = [
  "Post what you have: dish, quantity, your area and the time it stays safe.",
  "See which nearby organisations match your food.",
  "Follow the pickup and delivery, then pay your volunteer directly."
];

const volunteerPoints = [
  "See open requests with the pickup and drop addresses.",
  "Accept a delivery, then mark it picked up and delivered.",
  "Enter your delivery amount and get paid by the donor on your UPI ID or QR code."
];

const reasons = [
  {
    icon: <MessageSquare size={26} />,
    title: "Organisations hear about it in minutes",
    text: "As soon as food is posted, every matching organisation gets an SMS with a private link to accept or decline."
  },
  {
    icon: <ShieldCheck size={26} />,
    title: "Only food that can still be eaten",
    text: "Food is offered only to organisations that can receive it before it expires, and only if they have room for that much."
  },
  {
    icon: <Wallet size={26} />,
    title: "Everyone can see what happened",
    text: "Donors see who delivered. Volunteers state their amount. Admins can check every donation from start to finish."
  }
];

const faqs = [
  {
    question: "Do receiving organisations need to register?",
    answer:
      "No. Our team adds each organisation after checking it. They get an SMS with a private link and use it to accept or decline a donation."
  },
  {
    question: "What food can I donate?",
    answer:
      "Cooked or packed food that is safe to eat and stored properly. You confirm this when you post it, and you set the time until which it stays safe."
  },
  {
    question: "Who picks up the food?",
    answer:
      "You choose when you post. Either the organisation collects it, or a volunteer picks it up from you and delivers it."
  },
  {
    question: "How does a volunteer get paid?",
    answer:
      "After the drop-off, the volunteer enters the delivery amount. You then see it on your dashboard with the volunteer's UPI ID and QR code, and you pay them directly. Food Rescue does not handle the money."
  }
];

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <HowItWorks />

        {/* ACCOUNTS */}
        <section className="fr-accounts" id="accounts">
          <div className="fr-wrap">
            <div className="fr-heading">
              <h2>Pick the account that fits you</h2>
              <p>
                Whether you have food to give or time to spare, you can start
                in two minutes.
              </p>
            </div>

            <div className="fr-account-grid">
              {/* Donor */}
              <article className="fr-account fr-account-donor">
                <div className="fr-account-icon">
                  <Utensils size={30} />
                </div>

                <h3>Donor account</h3>

                <p className="fr-account-for">
                  For homes, restaurants, caterers and event hosts with extra
                  food.
                </p>

                <ul>
                  {donorPoints.map((point) => (
                    <li key={point}>
                      <Check size={18} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="fr-account-actions">
                  <Link
                    to="/register?role=donor"
                    className="fr-btn fr-btn-donor"
                  >
                    Create donor account
                    <ArrowRight size={18} />
                  </Link>

                  <Link to="/login" className="fr-link">
                    I already have an account
                  </Link>
                </div>
              </article>

              {/* Volunteer */}
              <article className="fr-account fr-account-volunteer">
                <div className="fr-account-icon">
                  <Truck size={30} />
                </div>

                <h3>Volunteer account</h3>

                <p className="fr-account-for">
                  For anyone with a bike or car and a spare hour.
                </p>

                <ul>
                  {volunteerPoints.map((point) => (
                    <li key={point}>
                      <Check size={18} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="fr-account-actions">
                  <Link
                    to="/register?role=volunteer"
                    className="fr-btn fr-btn-volunteer"
                  >
                    Create volunteer account
                    <ArrowRight size={18} />
                  </Link>

                  <Link to="/login" className="fr-link">
                    I already have an account
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* WHO WE HELP */}
        <section className="fr-help" id="who-we-help">
          <div className="fr-wrap fr-help-grid">
            <div className="fr-help-text">
              <h2>Food goes to people who are waiting for it</h2>

              <p>
                We send donations to orphanages and old age homes in and around
                Warangal. Our team adds and checks every organisation, so each
                offer reaches a real contact by SMS.
              </p>

              <p>
                Run an organisation that could use food donations?{" "}
                <Link to="/contact">Ask our team to add you.</Link>
              </p>
            </div>

            <div className="fr-help-cards">
              <div className="fr-help-card">
                <Building2 size={28} />
                <div>
                  <h3>Orphanages</h3>
                  <p>Meals for children's homes.</p>
                </div>
              </div>

              <div className="fr-help-card">
                <Heart size={28} />
                <div>
                  <h3>Old age homes</h3>
                  <p>Meals for elderly residents.</p>
                </div>
              </div>

              <div className="fr-areas">
                <MapPin size={20} />
                <span>Warangal</span>
                <span>Hanamkonda</span>
                <span>Kazipet</span>
              </div>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="fr-why">
          <div className="fr-wrap">
            <div className="fr-heading">
              <h2>Why it works</h2>
            </div>

            <div className="fr-why-grid">
              {reasons.map((reason) => (
                <div className="fr-why-card" key={reason.title}>
                  <div className="fr-why-icon">{reason.icon}</div>
                  <h3>{reason.title}</h3>
                  <p>{reason.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="fr-faq" id="faq">
          <div className="fr-wrap fr-faq-wrap">
            <div className="fr-heading">
              <h2>Common questions</h2>
            </div>

            <div className="fr-faq-list">
              {faqs.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CALL */}
        <section className="fr-final">
          <div className="fr-wrap fr-final-inner">
            <h2>Food that is cooked today should be eaten today.</h2>

            <div className="fr-final-actions">
              <Link
                to="/register?role=donor"
                className="fr-btn fr-btn-light"
              >
                Donate food
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/register?role=volunteer"
                className="fr-btn fr-btn-outline"
              >
                Volunteer with us
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="fr-footer">
        <div className="fr-wrap fr-footer-inner">
          <div className="fr-footer-brand">
            <Heart size={20} fill="currentColor" />
            <strong>Food Rescue</strong>
            <span>Surplus food, delivered to people in need.</span>
          </div>

          <nav className="fr-footer-links" aria-label="Footer">
            <Link to="/about">About</Link>
            <Link to="/impact">Impact</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

export default Home;
