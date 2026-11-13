
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  // The landing page links here with ?role=donor or ?role=volunteer
  const [searchParams] = useSearchParams();
  const roleFromLink = searchParams.get("role");
  const startingRole = ["donor", "volunteer"].includes(roleFromLink)
    ? roleFromLink
    : "";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: startingRole,

    // Receiver details
    organisationName: "",
    receiverType: "",
    area: "",
    city: "",
    state: "",

    // Food capacity
    plates: "",
    kg: "",
    packets: "",
    boxes: "",

    expectedDeliveryMinutes: "",

    // Volunteer payment details
    upiId: "",
    upiQr: ""
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: ""
    }));
  };

  const handleQrFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 250 * 1024) {
      setErrors((previous) => ({
        ...previous,
        upiId: "QR code must be an image smaller than 250 KB"
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((previous) => ({ ...previous, upiQr: reader.result }));
      setErrors((previous) => ({ ...previous, upiId: "" }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must contain at least 2 characters";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must contain exactly 10 digits";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.role === "receiver") {
      // Receiver organisations send a request; no password is needed.
    } else if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[!@#$%^&*]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one special character";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    // Receiver-specific validation
    if (formData.role === "receiver") {
      if (!formData.organisationName.trim()) {
        newErrors.organisationName = "Organisation name is required";
      }

      if (!formData.receiverType) {
        newErrors.receiverType = "Please select receiver type";
      }

      if (!formData.area.trim()) {
        newErrors.area = "Area is required";
      }

      if (!formData.city.trim()) {
        newErrors.city = "City is required";
      }

      if (!formData.state.trim()) {
        newErrors.state = "State is required";
      }

      if (
        formData.expectedDeliveryMinutes &&
        (
          !Number.isFinite(Number(formData.expectedDeliveryMinutes)) ||
          Number(formData.expectedDeliveryMinutes) <= 0
        )
      ) {
        newErrors.expectedDeliveryMinutes =
          "Enter a valid delivery time in minutes";
      }
    }

    if (formData.role === "volunteer") {
      if (!formData.upiId.trim() && !formData.upiQr) {
        newErrors.upiId = "Enter your UPI ID or upload your payment QR code";
      } else if (
        formData.upiId.trim() &&
        !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(formData.upiId.trim())
      ) {
        newErrors.upiId = "Enter a valid UPI ID such as name@bank";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Common registration details
      const registrationData = {
        name: formData.name.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        role: formData.role
      };

      if (formData.role !== "receiver") {
        registrationData.password = formData.password;
      }

      if (formData.role === "volunteer") {
        registrationData.upiId = formData.upiId.trim();
        registrationData.upiQr = formData.upiQr;
      }

      // Add receiver details only for receiver registration
      if (formData.role === "receiver") {
        registrationData.organisationName =
          formData.organisationName.trim();

        registrationData.receiverType = formData.receiverType;

        registrationData.address = {
          area: formData.area.trim(),
          city: formData.city.trim(),
          state: formData.state.trim()
        };

        registrationData.capacity = {
          plates: Number(formData.plates) || 0,
          kg: Number(formData.kg) || 0,
          packets: Number(formData.packets) || 0,
          boxes: Number(formData.boxes) || 0
        };

        registrationData.expectedDeliveryMinutes =
          Number(formData.expectedDeliveryMinutes) || 60;
      }

      const response = await fetch(
        "/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(registrationData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }

      if (formData.role === "receiver") {
        setMessage(
          data.message ||
            "Your request was sent to the administrator for approval."
        );
        return;
      }

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
  console.error("Registration error:", error);
  setMessage(
    error.message || "Unable to connect to the server. Please check the backend."
  );
} finally {
  setLoading(false);
}
  };

  return (
    <div className="register-page">
      <div className="register-container">

        <h1>Create Account</h1>

        <p className="register-subtitle">
          Join Food Rescue and help reduce food waste.
        </p>

        <form onSubmit={handleSubmit}>

          {/* ROLE */}
          <div className="form-group">
            <label>Register As</label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="">Select Role</option>
              <option value="donor">Donor</option>
              <option value="receiver">Receiver</option>
              <option value="volunteer">Volunteer</option>
            </select>

            {errors.role && (
              <p className="error-message">{errors.role}</p>
            )}
          </div>

          {/* NAME */}
          <div className="form-group">
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
            />

            {errors.name && (
              <p className="error-message">{errors.name}</p>
            )}
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              placeholder="Enter 10-digit phone number"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");

                if (value.length <= 10) {
                  setFormData((previous) => ({
                    ...previous,
                    phone: value
                  }));

                  setErrors((previous) => ({
                    ...previous,
                    phone: ""
                  }));
                }
              }}
              maxLength="10"
            />

            <small className="field-hint">
              Phone number must contain exactly 10 digits.
            </small>

            {errors.phone && (
              <p className="error-message">{errors.phone}</p>
            )}
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleChange}
            />

            <small className="field-hint">
              Example: example@gmail.com
            </small>

            {errors.email && (
              <p className="error-message">{errors.email}</p>
            )}
          </div>

          {/* PASSWORD (not needed for receiver organisations) */}
          {formData.role !== "receiver" && (
          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
            />

            <div className="password-rules">
              <p>Password must contain:</p>

              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (! @ # $ %)</li>
              </ul>
            </div>

            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
          </div>
          )}

          {formData.role === "receiver" && (
            <p className="field-hint">
              Receiver organisations do not need an account. Your details go to
              the administrator, who decides whether to add your organisation.
              If approved, you will get donation alerts by SMS on this phone.
            </p>
          )}

          {/* VOLUNTEER PAYMENT DETAILS */}
          {formData.role === "volunteer" && (
            <>
              <hr />
              <h3>Payment details</h3>
              <p>
                Donors will use these to pay you for the delivery. Give a UPI
                ID, a QR code, or both.
              </p>

              <div className="form-group">
                <label>UPI ID</label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="yourname@bank"
                />
              </div>

              <div className="form-group">
                <label>Payment QR code (image, up to 250 KB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFile}
                />
                {formData.upiQr && (
                  <img
                    src={formData.upiQr}
                    alt="Your payment QR"
                    style={{ width: 140, marginTop: 8 }}
                  />
                )}
              </div>

              {errors.upiId && (
                <p className="error-message">{errors.upiId}</p>
              )}
            </>
          )}

          {/* RECEIVER DETAILS */}
          {formData.role === "receiver" && (
            <>
              <hr />

              <h3>Receiver / Organisation Details</h3>

              <p className="field-hint">
                Enter your organisation information so Food Rescue can
                identify suitable food donations for you.
              </p>

              {/* ORGANISATION NAME */}
              <div className="form-group">
                <label>Organisation Name</label>

                <input
                  type="text"
                  name="organisationName"
                  placeholder="Enter organisation name"
                  value={formData.organisationName}
                  onChange={handleChange}
                />

                {errors.organisationName && (
                  <p className="error-message">
                    {errors.organisationName}
                  </p>
                )}
              </div>

              {/* RECEIVER TYPE */}
              <div className="form-group">
                <label>Receiver Type</label>

                <select
                  name="receiverType"
                  value={formData.receiverType}
                  onChange={handleChange}
                >
                  <option value="">Select Receiver Type</option>
                  <option value="orphanage">Orphanage</option>
                  <option value="old_age_home">Old Age Home</option>
                  <option value="slum_area">Slum Area</option>
                </select>

                {errors.receiverType && (
                  <p className="error-message">
                    {errors.receiverType}
                  </p>
                )}
              </div>

              {/* LOCATION */}
              <h3>Organisation Location</h3>

              <div className="form-group">
                <label>Area / Locality</label>

                <input
                  type="text"
                  name="area"
                  placeholder="Enter your area"
                  value={formData.area}
                  onChange={handleChange}
                />

                {errors.area && (
                  <p className="error-message">{errors.area}</p>
                )}
              </div>

              <div className="form-group">
                <label>City</label>

                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                />

                {errors.city && (
                  <p className="error-message">{errors.city}</p>
                )}
              </div>

              <div className="form-group">
                <label>State</label>

                <input
                  type="text"
                  name="state"
                  placeholder="Enter state"
                  value={formData.state}
                  onChange={handleChange}
                />

                {errors.state && (
                  <p className="error-message">{errors.state}</p>
                )}
              </div>

              {/* FOOD CAPACITY */}
              <hr />

              <h3>Food Receiving Capacity</h3>

              <p className="field-hint">
                Enter the approximate amount of food your organisation
                can receive. You can leave unused capacity fields empty.
              </p>

              <div className="form-group">
                <label>Maximum Plates</label>

                <input
                  type="number"
                  name="plates"
                  min="0"
                  placeholder="Example: 100"
                  value={formData.plates}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Maximum Kilograms (kg)</label>

                <input
                  type="number"
                  name="kg"
                  min="0"
                  step="0.1"
                  placeholder="Example: 20"
                  value={formData.kg}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Maximum Packets</label>

                <input
                  type="number"
                  name="packets"
                  min="0"
                  placeholder="Example: 50"
                  value={formData.packets}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Maximum Boxes</label>

                <input
                  type="number"
                  name="boxes"
                  min="0"
                  placeholder="Example: 10"
                  value={formData.boxes}
                  onChange={handleChange}
                />
              </div>

              {/* DELIVERY TIME */}
              <div className="form-group">
                <label>
                  Expected Delivery Time (Minutes)
                </label>

                <input
                  type="number"
                  name="expectedDeliveryMinutes"
                  min="1"
                  placeholder="Example: 60"
                  value={formData.expectedDeliveryMinutes}
                  onChange={handleChange}
                />

                <small className="field-hint">
                  Enter how many minutes your organisation can wait
                  for a food delivery. Default is 60 minutes.
                </small>

                {errors.expectedDeliveryMinutes && (
                  <p className="error-message">
                    {errors.expectedDeliveryMinutes}
                  </p>
                )}
              </div>
            </>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : formData.role === "receiver"
              ? "Send Request to Admin"
              : "Create Account"}
          </button>

        </form>

        {message && (
          <p className="register-message">
            {message}
          </p>
        )}

      </div>
    </div>
  );
}

export default Register;
