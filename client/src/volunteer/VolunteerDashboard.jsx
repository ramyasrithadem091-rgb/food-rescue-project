
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./VolunteerDashboard.css";

const API_BASE_URL = "";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const responseText = await response.text();

    console.error("Non-JSON API response:", {
      url: response.url,
      status: response.status,
      response: responseText.slice(0, 300),
    });

    throw new Error(
      `Backend returned a non-JSON response (HTTP ${response.status}). Check API route: ${response.url}`
    );
  }

  const data = await response.json();

  if (response.status === 401) {
    const error = new Error(
      data.message || "Session expired. Please log in again."
    );
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (HTTP ${response.status})`);
  }

  return data;
}

function VolunteerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myDeliveriesLoading, setMyDeliveriesLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [amounts, setAmounts] = useState({});

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const authHeaders = (json = false) => {
    const token = getToken();

    if (!token) {
      const error = new Error("Please log in to continue.");
      error.status = 401;
      throw error;
    }

    return {
      Authorization: `Bearer ${token}`,
      ...(json ? { "Content-Type": "application/json" } : {}),
    };
  };

  const handleRequestError = useCallback(
    (err) => {
      console.error("VOLUNTEER API ERROR:", err);

      if (err.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      setError(err.message || "Something went wrong. Please try again.");
    },
    [logout, navigate]
  );

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }

    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Fetch available volunteer requests.
  // Backend route: GET /api/volunteer/donations
  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/api/volunteer/donations", {
        headers: authHeaders(),
      });

      setDeliveries(data.donations || []);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  }, [handleRequestError]);

  // Fetch deliveries assigned to the logged-in volunteer.
  // Backend route: GET /api/volunteer/my-donations
  const fetchMyDeliveries = useCallback(async () => {
    try {
      setMyDeliveriesLoading(true);

      const data = await apiRequest("/api/volunteer/my-donations", {
        headers: authHeaders(),
      });

      setMyDeliveries(data.donations || []);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setMyDeliveriesLoading(false);
    }
  }, [handleRequestError]);

  const refreshDashboard = async () => {
    setMessage("");
    setError("");

    await Promise.all([
      fetchDeliveries(),
      fetchMyDeliveries(),
    ]);
  };

  // Accept an available delivery.
  // Backend route: POST /api/volunteer/donations/:id/accept
  const handleAcceptDelivery = async (deliveryId) => {
    try {
      setActionId(deliveryId);
      setMessage("");
      setError("");

      const data = await apiRequest(
        `/api/volunteer/donations/${deliveryId}/accept`,
        {
          method: "POST",
          headers: authHeaders(true),
        }
      );

      setMessage(data.message || "Delivery accepted successfully!");

      await Promise.all([
        fetchDeliveries(),
        fetchMyDeliveries(),
      ]);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setActionId(null);
    }
  };

  // Update delivery status.
  // Backend status routes use PATCH, not POST.
  const updateDelivery = async (
    deliveryId,
    action,
    successMessage,
    body
  ) => {
    try {
      setActionId(deliveryId);
      setMessage("");
      setError("");

      const data = await apiRequest(
        `/api/volunteer/donations/${deliveryId}/${action}`,
        {
          method: "PATCH",
          headers: authHeaders(true),
          ...(body ? { body: JSON.stringify(body) } : {}),
        }
      );

      setMessage(data.message || successMessage);

      await Promise.all([
        fetchDeliveries(),
        fetchMyDeliveries(),
      ]);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setActionId(null);
    }
  };

  const handlePickup = (id) =>
    updateDelivery(
      id,
      "pickup",
      "Food pickup confirmed successfully!"
    );

  const handleStartDelivery = (id) =>
    updateDelivery(
      id,
      "out-for-delivery",
      "Delivery has started!"
    );

  const handleDelivered = (id) => {
    const raw = amounts[id];
    const amount = Number(raw);

    if (raw === undefined || raw === "" || !Number.isFinite(amount) || amount < 0) {
      setError("Enter the delivery amount in rupees (enter 0 if free).");
      return;
    }

    return updateDelivery(
      id,
      "delivered",
      "Food delivered successfully!",
      { amount }
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    fetchDeliveries();
    fetchMyDeliveries();
  }, [fetchDeliveries, fetchMyDeliveries]);

  const completedCount = myDeliveries.filter(
    (delivery) =>
      delivery.status === "DELIVERED" ||
      delivery.status === "COMPLETED"
  ).length;

  return (
    <div className="volunteer-dashboard">
      <aside className="volunteer-sidebar">
        <div className="volunteer-logo">
          <div className="volunteer-logo-icon">♥</div>
          <span>Food Rescue</span>
        </div>

        <div className="volunteer-user-card">
          <div className="volunteer-avatar">
            {user?.name?.charAt(0).toUpperCase() || "V"}
          </div>

          <div>
            <strong>{user?.name || "Volunteer"}</strong>
            <span>Food Rescue Volunteer</span>
          </div>
        </div>

        <nav className="volunteer-navigation">
          <button
            className="volunteer-nav-item active"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            🏠 Dashboard
          </button>

          <button
            className="volunteer-nav-item"
            onClick={() =>
              document
                .getElementById("delivery-requests")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            🚚 Delivery Requests
          </button>

          <button
            className="volunteer-nav-item"
            onClick={() =>
              document
                .getElementById("my-deliveries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            📦 My Deliveries
          </button>

          <button
            className="volunteer-nav-item"
            onClick={refreshDashboard}
          >
            🔄 Refresh
          </button>
        </nav>

        <button
          className="volunteer-logout"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>
      </aside>

      <main className="volunteer-main">
        <header className="volunteer-header">
          <div>
            <h1>Welcome, {user?.name || "Volunteer"}!</h1>
            <p>Help deliver surplus food to people who need it.</p>
          </div>

          <div className="volunteer-header-avatar">
            {user?.name?.charAt(0).toUpperCase() || "V"}
          </div>
        </header>

        {message && (
          <div className="volunteer-success">✓ {message}</div>
        )}

        {error && (
          <div className="volunteer-error">⚠ {error}</div>
        )}

        <section className="volunteer-stats">
          <div className="volunteer-stat-card">
            <div className="stat-icon green">🚚</div>
            <div>
              <span>Available Requests</span>
              <strong>{deliveries.length}</strong>
            </div>
          </div>

          <div className="volunteer-stat-card">
            <div className="stat-icon blue">📦</div>
            <div>
              <span>My Deliveries</span>
              <strong>{myDeliveries.length}</strong>
            </div>
          </div>

          <div className="volunteer-stat-card">
            <div className="stat-icon orange">❤️</div>
            <div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>
          </div>
        </section>

        {/* AVAILABLE DELIVERY REQUESTS */}
        <section
          id="delivery-requests"
          className="volunteer-section"
        >
          <div className="section-heading">
            <div>
              <h2>Available Delivery Requests</h2>
              <p>Food donations waiting for volunteer delivery.</p>
            </div>

            <button
              className="refresh-button"
              onClick={fetchDeliveries}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="volunteer-empty">
              <div className="loader" />
              <p>Loading delivery requests...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="volunteer-empty">
              <div className="empty-icon">🚚</div>
              <h3>No delivery requests</h3>
              <p>
                There are currently no food deliveries waiting for
                volunteers.
              </p>
            </div>
          ) : (
            <div className="delivery-grid">
              {deliveries.map((delivery) => (
                <div className="delivery-card" key={delivery._id}>
                  <div className="delivery-card-header">
                    <div>
                      <h3>{delivery.foodName}</h3>
                      <span className="category">
                        {delivery.category}
                      </span>
                    </div>

                    <span className="status-badge">
                      {delivery.status}
                    </span>
                  </div>

                  <div className="delivery-details">
                    <div className="detail-row">
                      <span>🍽️ Food Type</span>
                      <strong>
                        {delivery.foodType === "veg"
                          ? "Vegetarian"
                          : "Non-Vegetarian"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>📦 Quantity</span>
                      <strong>
                        {delivery.quantity} {delivery.quantityUnit}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>📍 Pickup</span>
                      <strong>
                        {delivery.donorArea}, {delivery.city}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>⏰ Consume Before</span>
                      <strong>{formatDate(delivery.expiresAt)}</strong>
                    </div>
                  </div>

                  {delivery.donorId && (
                    <div className="person-info">
                      <span>Donor</span>
                      <strong>
                        {delivery.donorId.name || "Donor"}
                      </strong>
                    </div>
                  )}

                  <button
                    className="accept-delivery-button"
                    onClick={() => handleAcceptDelivery(delivery._id)}
                    disabled={actionId === delivery._id}
                  >
                    {actionId === delivery._id
                      ? "Accepting..."
                      : "Accept Delivery"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MY ASSIGNED DELIVERIES */}
        <section
          id="my-deliveries"
          className="volunteer-section"
        >
          <div className="section-heading">
            <div>
              <h2>My Deliveries</h2>
              <p>Track your assigned food deliveries.</p>
            </div>

            <button
              className="refresh-button"
              onClick={fetchMyDeliveries}
            >
              ↻ Refresh
            </button>
          </div>

          {myDeliveriesLoading ? (
            <div className="volunteer-empty">
              <div className="loader" />
              <p>Loading your deliveries...</p>
            </div>
          ) : myDeliveries.length === 0 ? (
            <div className="volunteer-empty">
              <div className="empty-icon">📦</div>
              <h3>No deliveries assigned</h3>
              <p>Accept a delivery request to see it here.</p>
            </div>
          ) : (
            <div className="delivery-grid">
              {myDeliveries.map((delivery) => (
                <div
                  className="delivery-card assigned"
                  key={delivery._id}
                >
                  <div className="delivery-card-header">
                    <div>
                      <h3>{delivery.foodName}</h3>
                      <span className="category">
                        {delivery.category}
                      </span>
                    </div>

                    <span className="assigned-badge">
                      {delivery.status}
                    </span>
                  </div>

                  <div className="delivery-details">
                    <div className="detail-row">
                      <span>📍 Pickup</span>
                      <strong>
                        {delivery.donorArea}, {delivery.city}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>📦 Quantity</span>
                      <strong>
                        {delivery.quantity} {delivery.quantityUnit}
                      </strong>
                    </div>

                    {delivery.donorAddress && (
                      <div className="detail-row">
                        <span>🏠 Pickup address</span>
                        <strong>{delivery.donorAddress}</strong>
                      </div>
                    )}

                    {delivery.acceptedReceiverId && (
                      <div className="detail-row">
                        <span>🏢 Drop to</span>
                        <strong>
                          {delivery.acceptedReceiverId.organisationName ||
                            delivery.acceptedReceiverId.name}
                          {delivery.deliveryAddress?.area
                            ? `, ${delivery.deliveryAddress.area}`
                            : ""}
                        </strong>
                      </div>
                    )}

                    {delivery.volunteerAssignedAt && (
                      <div className="detail-row">
                        <span>📅 Assigned</span>
                        <strong>
                          {formatDate(delivery.volunteerAssignedAt)}
                        </strong>
                      </div>
                    )}

                    {delivery.donorId && (
                      <div className="detail-row">
                        <span>Donor</span>
                        <strong>
                          {delivery.donorId.name || "Donor"}
                        </strong>
                      </div>
                    )}
                  </div>

                  {delivery.status === "VOLUNTEER_ASSIGNED" && (
                    <button
                      className="action-button pickup"
                      onClick={() => handlePickup(delivery._id)}
                      disabled={actionId === delivery._id}
                    >
                      {actionId === delivery._id
                        ? "Updating..."
                        : "📦 Confirm Pickup"}
                    </button>
                  )}

                  {delivery.status === "PICKED_UP" && (
                    <button
                      className="action-button delivery"
                      onClick={() =>
                        handleStartDelivery(delivery._id)
                      }
                      disabled={actionId === delivery._id}
                    >
                      {actionId === delivery._id
                        ? "Updating..."
                        : "🚚 Start Delivery"}
                    </button>
                  )}

                  {delivery.status === "OUT_FOR_DELIVERY" && (
                    <input
                      type="number"
                      min="0"
                      placeholder="Delivery amount (₹)"
                      value={amounts[delivery._id] ?? ""}
                      onChange={(e) =>
                        setAmounts((prev) => ({
                          ...prev,
                          [delivery._id]: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "8px",
                        boxSizing: "border-box",
                      }}
                    />
                  )}

                  {delivery.status === "OUT_FOR_DELIVERY" && (
                    <button
                      className="action-button delivered"
                      onClick={() => handleDelivered(delivery._id)}
                      disabled={actionId === delivery._id}
                    >
                      {actionId === delivery._id
                        ? "Updating..."
                        : "✓ Mark as Delivered"}
                    </button>
                  )}

                  {(delivery.status === "DELIVERED" ||
                    delivery.status === "COMPLETED") && (
                    <div className="completed-message">
                      ✓ Delivery Completed
                      {delivery.deliveryAmount > 0 &&
                        ` — ₹${delivery.deliveryAmount} (${
                          delivery.paymentStatus === "PAID"
                            ? "paid by donor"
                            : "awaiting donor payment"
                        })`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default VolunteerDashboard;
