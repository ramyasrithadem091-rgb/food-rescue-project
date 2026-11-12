import "./Contact.css";
import { Mail, Phone, MapPin, Send } from "lucide-react";

function Contact() {
  return (
    <section className="contact-section" id="contact">

      <div className="contact-header">
        <span className="contact-badge">
          LET'S CONNECT
        </span>

        <h2>
          Get in <span>Touch</span>
        </h2>

        <p>
          Have a question, suggestion, or want to help reduce food waste?
          We'd love to hear from you.
        </p>
      </div>

      <div className="contact-container">

        {/* Contact Information */}
        <div className="contact-info">

          <h3>Let's make an impact together.</h3>

          <p>
            Whether you want to donate food, receive support, volunteer,
            or simply learn more about Food Rescue, we're here to help.
          </p>

          <div className="contact-item">
            <div className="contact-icon">
              <Mail size={22} />
            </div>

            <div>
              <strong>Email</strong>
              <p>foodrescue@example.com</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <Phone size={22} />
            </div>

            <div>
              <strong>Phone</strong>
              <p>+91 98765 43210</p>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <MapPin size={22} />
            </div>

            <div>
              <strong>Location</strong>
              <p>Warangal, Telangana, India</p>
            </div>
          </div>

        </div>


        {/* Contact Form */}
        <div className="contact-form-card">

          <h3>Send us a message</h3>

          <form>

            <div className="form-row">

              <input
                type="text"
                placeholder="Your Name"
              />

              <input
                type="email"
                placeholder="Your Email"
              />

            </div>

            <input
              type="text"
              placeholder="Subject"
            />

            <textarea
              rows="5"
              placeholder="Write your message..."
            ></textarea>

            <button type="submit">
              Send Message
              <Send size={18} />
            </button>

          </form>

        </div>

      </div>

    </section>
  );
}

export default Contact;