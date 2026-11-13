
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "/api";

function ReceiverInvitation() {
  const { token } = useParams();

  const [invitation, setInvitation] = useState(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState({
    area: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvitation() {
      try {
        const response = await fetch(
          `${API}/receiver-invitations/${token}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load invitation.");
        }

        setInvitation(data);

        setContactPhone(data.receiver?.phone || "");

        setAddress({
          area: data.deliveryAddress?.area || "",
          city: data.deliveryAddress?.city || "",
          state: data.deliveryAddress?.state || "",
          pincode: data.deliveryAddress?.pincode || ""
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  async function respond(action) {
    setError("");
    setMessage("");

    if (!contactPhone.trim()) {
      setError("Please enter the registered organisation phone number.");
      return;
    }

    if (action === "accept") {
      if (!contactName.trim()) {
        setError("Please enter the contact person's name.");
        return;
      }

      if (!address.area || !address.city || !address.state) {
        setError("Please complete the delivery address.");
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API}/receiver-invitations/${token}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action,
            contactName,
            contactPhone,
            deliveryAddress: address
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to process response.");
      }

      setMessage(data.message);
      setInvitation(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div style={styles.container}>Loading invitation...</div>;
  }

  if (error && !invitation) {
    return (
      <div style={styles.container}>
        <h2>Invitation unavailable</h2>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  if (message) {
    return (
      <div style={styles.container}>
        <h2>Food Rescue</h2>
        <p style={styles.success}>{message}</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div style={styles.container}>
        <h2>Invitation unavailable</h2>
        <p>{error || "This invitation is no longer available."}</p>
      </div>
    );
  }

  const receiver = invitation.receiver;
  const donation = invitation.donation;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Food Rescue</h1>
        <h2>Food Donation Invitation</h2>

        <p>
          Hello, <strong>
            {receiver.organisationName || receiver.name}
          </strong>
        </p>

        <h3>Donation Details</h3>

        <div style={styles.details}>
          <p><strong>Food:</strong> {donation.foodName}</p>
          <p><strong>Category:</strong> {donation.category}</p>
          <p><strong>Food type:</strong> {donation.foodType}</p>
          <p>
            <strong>Quantity:</strong>{" "}
            {donation.quantity} {donation.quantityUnit}
          </p>
          <p><strong>Donor area:</strong> {donation.donorArea}</p>
          <p><strong>City:</strong> {donation.city}</p>
          <p><strong>Pickup method:</strong> {donation.pickupMethod}</p>
          <p>
            <strong>Expiry:</strong>{" "}
            {new Date(donation.expiresAt).toLocaleString()}
          </p>
        </div>

        <h3>Organisation Contact Details</h3>

        <label>Contact person's name</label>
        <input
          style={styles.input}
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Enter contact name"
        />

        <label>Registered organisation phone</label>
        <input
          style={styles.input}
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Enter registered phone"
        />

        <h3>Delivery Address</h3>

        <input
          style={styles.input}
          placeholder="Area"
          value={address.area}
          onChange={(e) =>
            setAddress({ ...address, area: e.target.value })
          }
        />

        <input
          style={styles.input}
          placeholder="City"
          value={address.city}
          onChange={(e) =>
            setAddress({ ...address, city: e.target.value })
          }
        />

        <input
          style={styles.input}
          placeholder="State"
          value={address.state}
          onChange={(e) =>
            setAddress({ ...address, state: e.target.value })
          }
        />

        <input
          style={styles.input}
          placeholder="6-digit pincode"
          value={address.pincode}
          onChange={(e) =>
            setAddress({ ...address, pincode: e.target.value })
          }
        />

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.buttons}>
          <button
            style={styles.accept}
            disabled={submitting}
            onClick={() => respond("accept")}
          >
            {submitting ? "Processing..." : "Accept Donation"}
          </button>

          <button
            style={styles.decline}
            disabled={submitting}
            onClick={() => respond("decline")}
          >
            Decline
          </button>
        </div>

        <p style={styles.note}>
          Only one organisation can successfully accept this donation.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f3f6f4",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "25px"
  },
  card: {
    width: "100%",
    maxWidth: "650px",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
  },
  heading: {
    color: "#16834a",
    textAlign: "center"
  },
  details: {
    background: "#f6f8f6",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    margin: "9px 0 16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "15px"
  },
  buttons: {
    display: "flex",
    gap: "12px",
    marginTop: "20px"
  },
  accept: {
    flex: 1,
    padding: "13px",
    background: "#16834a",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer"
  },
  decline: {
    flex: 1,
    padding: "13px",
    background: "#c0392b",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer"
  },
  error: {
    color: "#c0392b",
    fontWeight: "bold"
  },
  success: {
    color: "#16834a",
    fontWeight: "bold",
    textAlign: "center"
  },
  note: {
    marginTop: "20px",
    color: "#666",
    fontSize: "13px",
    textAlign: "center"
  }
};

export default ReceiverInvitation;
