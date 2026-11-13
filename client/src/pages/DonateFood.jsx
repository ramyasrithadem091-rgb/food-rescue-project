
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Utensils,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Check
} from "lucide-react";
import "./DonateFood.css";

const initialFormData = {
  foodName: "",
  category: "",
  foodType: "veg",
  quantity: "",
  quantityUnit: "kg",
  preparedAt: "",
  expiresAt: "",
  donorArea: "",
  city: "",
  pincode: "",
  donorAddress: "",
  searchRadius: 10,
  receiverTypes: ["all"],
  pickupMethod: "volunteer",
  description: ""
};

const DonateFood = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invitationLinks, setInvitationLinks] = useState([]);
  const [matched, setMatched] = useState([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Handle normal form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Handle safety declaration
  const handleSafetyChange = (e) => {
    const checked = e.target.checked;

    console.log("Safety declaration:", checked);

    setSafetyConfirmed(checked);
    setError("");
  };

  // Copy invitation link
  const handleCopyLink = async (url, index) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setError("");
    } catch (err) {
      console.error("Copy error:", err);
      setError("Unable to copy link. Please copy it manually.");
    }
  };

  // Validate form
  const validateForm = () => {
    if (
      !formData.foodName.trim() ||
      !formData.category ||
      !formData.quantity ||
      !formData.preparedAt ||
      !formData.expiresAt ||
      !formData.donorArea.trim() ||
      !formData.city.trim()
    ) {
      setError("Please fill in all required fields.");
      return false;
    }

    if (
      !Number.isFinite(Number(formData.quantity)) ||
      Number(formData.quantity) <= 0
    ) {
      setError("Please enter a valid food quantity.");
      return false;
    }

    if (!safetyConfirmed) {
      setError(
        "Please confirm that the donated food is safe for consumption."
      );
      return false;
    }

    const preparedDate = new Date(formData.preparedAt);
    const expiryDate = new Date(formData.expiresAt);

    if (
      Number.isNaN(preparedDate.getTime()) ||
      Number.isNaN(expiryDate.getTime()) ||
      expiryDate <= preparedDate
    ) {
      setError("Expiry time must be later than preparation time.");
      return false;
    }

    if (expiryDate <= new Date()) {
      setError("The food expiry time must be in the future.");
      return false;
    }

    return true;
  };

  // Submit donation
  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setInvitationLinks([]);
    setMatched([]);
    setUsedFallback(false);
    setCopiedIndex(null);

    console.log("Declaration at submission:", safetyConfirmed);

    if (!validateForm()) {
      return;
    }

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/donations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            // This was missing: the checkbox lives in its own state,
            // so it was never sent and the server always rejected it.
            safetyConfirmed,
            quantity: Number(formData.quantity),
            searchRadius: Number(formData.searchRadius)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Food donation creation failed."
        );
      }

      setMessage(
        `Food donation created successfully! ${
          data.matchingReceiverCount || 0
        } receiver organisations matched. SMS sent to ${
          data.smsSummary?.sent || 0
        } of ${data.smsSummary?.attempted || 0}.`
      );

      setInvitationLinks(
        data.developmentInvitationLinks || []
      );
      setMatched(data.matchedOrganisations || []);
      setUsedFallback(Boolean(data.usedFallback));

      setFormData({ ...initialFormData });
      setSafetyConfirmed(false);

    } catch (err) {
      console.error("DONATION ERROR:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-food-page">
      <div className="donate-food-container">

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/donor-dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <header className="donate-food-header">
          <div className="header-icon">
            <Utensils size={30} />
          </div>
          <h1>Donate Food</h1>
          <p>
            Share surplus food. We will find nearby organisations
            that can use it and tell them right away.
          </p>
        </header>

        <form
          className="donate-food-form"
          onSubmit={(e) => e.preventDefault()}
        >

          {/* FOOD INFORMATION */}
          <section className="form-card">
            <div className="card-heading">
              <span className="card-icon"><Utensils size={20} /></span>
              <div>
                <h2>Food Information</h2>
                <p>What are you donating?</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full">
                <label>Food Name *</label>
                <input
                  type="text"
                  name="foodName"
                  placeholder="Example: Vegetable biryani"
                  value={formData.foodName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Food Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  <option value="cooked">Cooked Food</option>
                  <option value="raw">Raw Food</option>
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="bakery">Bakery Items</option>
                  <option value="packed">Packed Food</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Food Type *</label>
                <select
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleChange}
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non_veg">Non-Vegetarian</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  min="0.1"
                  step="0.1"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Quantity Unit *</label>
                <select
                  name="quantityUnit"
                  value={formData.quantityUnit}
                  onChange={handleChange}
                >
                  <option value="kg">Kilograms</option>
                  <option value="packets">Packets</option>
                  <option value="plates">Plates</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>

              <div className="form-group">
                <label><Calendar size={15} /> Prepared At *</label>
                <input
                  type="datetime-local"
                  name="preparedAt"
                  value={formData.preparedAt}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label><Clock size={15} /> Use Before *</label>
                <input
                  type="datetime-local"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Anything the receiver should know (optional)"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
            </div>
          </section>

          {/* LOCATION */}
          <section className="form-card">
            <div className="card-heading">
              <span className="card-icon"><MapPin size={20} /></span>
              <div>
                <h2>Pickup Location</h2>
                <p>Where can the food be collected?</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Area *</label>
                <input
                  type="text"
                  name="donorArea"
                  placeholder="Example: Hanamkonda"
                  value={formData.donorArea}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Example: Warangal"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full">
                <label>Pickup Address</label>
                <input
                  type="text"
                  name="donorAddress"
                  placeholder="House no., street, landmark (shown to the volunteer)"
                  value={formData.donorAddress}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  maxLength="6"
                  placeholder="Example: 506002"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Search Radius (km)</label>
                <input
                  type="number"
                  name="searchRadius"
                  min="1"
                  max="100"
                  value={formData.searchRadius}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* PICKUP */}
          <section className="form-card">
            <div className="card-heading">
              <span className="card-icon"><Truck size={20} /></span>
              <div>
                <h2>Delivery Preferences</h2>
                <p>Who should receive it, and how will it travel?</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Pickup Method</label>
                <select
                  name="pickupMethod"
                  value={formData.pickupMethod}
                  onChange={handleChange}
                >
                  <option value="volunteer">Need a Volunteer</option>
                  <option value="receiver_pickup">
                    Receiver Will Pick Up
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Receiver Organisations</label>
                <select
                  value={formData.receiverTypes[0]}
                  onChange={(e) =>
                    setFormData((previous) => ({
                      ...previous,
                      receiverTypes: [e.target.value]
                    }))
                  }
                >
                  <option value="all">All Organisations</option>
                  <option value="orphanage">Orphanages</option>
                  <option value="old_age_home">Old Age Homes</option>
                  <option value="ngo">NGOs</option>
                  <option value="shelter">Shelters</option>
                </select>
              </div>
            </div>
          </section>

          {/* SAFETY */}
          <section className="safety-confirmation">
            <label>
              <input
                type="checkbox"
                checked={safetyConfirmed}
                onChange={handleSafetyChange}
              />
              <span>
                <strong><ShieldCheck size={16} /> Food safety declaration</strong>
                I confirm that the donated food is safe for
                consumption and has been stored properly.
              </span>
            </label>
          </section>

          <button
            type="button"
            className="donate-submit-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting Donation..." : "Create Food Donation"}
          </button>

        </form>

        {error && <div className="donate-error">{error}</div>}

        {message && (
          <div className="donate-success">
            <Check size={18} /> {message}
          </div>
        )}

        {matched.length > 0 && (
          <section className="invitation-links-section">
            <h2>Matched Receiver Organisations</h2>

            {usedFallback ? (
              <p className="fallback-note">
                No organisation matched your exact details (type, capacity,
                time or distance), so we suggested our default
                organisations instead. They have been sent an invitation.
              </p>
            ) : (
              <p>
                These organisations matched your donation and have been
                sent an invitation.
              </p>
            )}

            {matched.map((item, index) => {
              const link = invitationLinks.find(
                (l) => l.receiverName === item.name
              );

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="invitation-link-card"
                >
                  <div className="invitation-top">
                    <h3>{item.name}</h3>
                    <span className="distance-chip">
                      {item.isDefault ? "Default organisation" : ""}
                      {item.isDefault && item.distanceKm != null ? " · " : ""}
                      {item.distanceKm != null
                        ? `${item.distanceKm} km`
                        : item.isDefault
                        ? ""
                        : "—"}
                    </span>
                  </div>

                  {link && (
                    <>
                      <input
                        type="text"
                        value={link.invitationUrl}
                        readOnly
                        onFocus={(e) => e.target.select()}
                      />

                      <div className="invitation-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyLink(link.invitationUrl, index)
                          }
                        >
                          {copiedIndex === index
                            ? "Copied!"
                            : "Copy Invitation Link"}
                        </button>

                        <a
                          href={link.invitationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Link
                        </a>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {message && matched.length === 0 && (
          <p className="no-invitation-message">
            No organisation could be reached for this donation. Please try
            again later or contact the administrator.
          </p>
        )}

      </div>
    </div>
  );
};

export default DonateFood;
