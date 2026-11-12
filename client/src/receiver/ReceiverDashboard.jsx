import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ReceiverDashboard.css";

function ReceiverDashboard() {
  const navigate = useNavigate();

  const {
    user,
    logout
  } = useAuth();

  // ==================================================
  // STATES
  // ==================================================

  const [donations, setDonations] = useState([]);

  const [acceptedDonations, setAcceptedDonations] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const [acceptingId, setAcceptingId] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ==================================================
  // GET TOKEN
  // ==================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );
  };

  // ==================================================
  // FETCH AVAILABLE DONATIONS
  // ==================================================

  const fetchAvailableDonations = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      /*
        IMPORTANT:

        Your backend route is:

        GET /api/receiver/donations

        NOT:

        /api/donations/available
      */

      const response = await fetch(
        "http://localhost:5000/api/receiver/donations",
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch donations"
        );
      }

      setDonations(
        data.donations || []
      );

    } catch (error) {
      console.error(
        "FETCH DONATIONS ERROR:",
        error
      );

      setError(
        error.message ||
          "Unable to load donations"
      );

    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FETCH ACCEPTED DONATIONS
  // ==================================================

  const fetchAcceptedDonations = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      /*
        Backend route:

        GET /api/receiver/accepted
      */

      const response = await fetch(
        "http://localhost:5000/api/receiver/accepted",
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        console.error(
          "ACCEPTED DONATIONS ERROR:",
          data.message
        );

        return;
      }

      setAcceptedDonations(
        data.donations || []
      );

    } catch (error) {
      console.error(
        "FETCH ACCEPTED DONATIONS ERROR:",
        error
      );
    }
  };

  // ==================================================
  // FETCH NOTIFICATIONS
  // ==================================================

  const fetchNotifications = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      setNotificationLoading(true);

      /*
        Backend route:

        GET /api/receiver/notifications
      */

      const response = await fetch(
        "http://localhost:5000/api/receiver/notifications",
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      if (response.status === 404) {
        console.warn(
          "Receiver profile not found:",
          data.message
        );

        setNotifications([]);
        setUnreadCount(0);

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch notifications"
        );
      }

const receiverNotifications = data.notifications || [];

setNotifications(receiverNotifications);
setUnreadCount(data.unreadCount || 0);

const matchedDonations = receiverNotifications
  .filter((notification) => notification.isActive !== false)
  .map((notification) => notification.donationId)
  .filter((donation) =>
    donation &&
    typeof donation === "object" &&
    donation._id &&
    ["AVAILABLE", "NOTIFIED"].includes(donation.status) &&
    new Date(donation.expiresAt).getTime() > Date.now()
  );

const uniqueDonations = [
  ...new Map(
    matchedDonations.map((donation) => [
      donation._id,
      donation
    ])
  ).values()
];

setDonations(uniqueDonations);


    } catch (error) {
      console.error(
        "FETCH NOTIFICATIONS ERROR:",
        error
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  // ==================================================
  // MARK ONE NOTIFICATION AS READ
  // ==================================================

  const markNotificationAsRead =
    async (notificationId) => {
      try {
        const token = getToken();

        if (!token) {
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/receiver/notifications/${notificationId}/read`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to mark notification as read"
          );
        }

        // Update notification locally
        setNotifications(
          (previousNotifications) =>
            previousNotifications.map(
              (notification) =>
                notification._id ===
                notificationId
                  ? {
                      ...notification,
                      isRead: true
                    }
                  : notification
            )
        );

        // Reduce unread count
        setUnreadCount(
          (previousCount) =>
            Math.max(
              previousCount - 1,
              0
            )
        );

      } catch (error) {
        console.error(
          "MARK NOTIFICATION READ ERROR:",
          error
        );
      }
    };

  // ==================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ==================================================

  const markAllNotificationsAsRead =
    async () => {
      try {
        const token = getToken();

        if (!token) {
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/receiver/notifications/read-all",
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to mark notifications as read"
          );
        }

        setNotifications(
          (previousNotifications) =>
            previousNotifications.map(
              (notification) => ({
                ...notification,
                isRead: true
              })
            )
        );

        setUnreadCount(0);

      } catch (error) {
        console.error(
          "MARK ALL NOTIFICATIONS ERROR:",
          error
        );
      }
    };

  // ==================================================
  // ACCEPT DONATION
  // ==================================================

  const handleAcceptDonation =
    async (donation) => {
      try {
        setAcceptingId(
          donation._id
        );

        setMessage("");
        setError("");

        const token = getToken();

        if (!token) {
          navigate("/login");
          return;
        }

        /*
          The backend requires pickupMethod.

          We use the donor's selected pickup method.

          Example:

          receiver_pickup
          volunteer
        */

        const pickupMethod =
          donation.pickupMethod;

        if (
          !pickupMethod
        ) {
          throw new Error(
            "Pickup method is not available for this donation."
          );
        }

        const response = await fetch(
          `http://localhost:5000/api/receiver/donations/${donation._id}/accept`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              pickupMethod
            })
          }
        );

        const data =
          await response.json();

        if (response.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to accept donation"
          );
        }

        setMessage(
          data.message ||
            "Donation accepted successfully!"
        );

        // Remove from available donations
        setDonations(
          (previousDonations) =>
            previousDonations.filter(
              (item) =>
                item._id !==
                donation._id
            )
        );

        // Refresh accepted donations
        await fetchAcceptedDonations();

        // Refresh notifications
        await fetchNotifications();

      } catch (error) {
        console.error(
          "ACCEPT DONATION ERROR:",
          error
        );

        setError(
          error.message ||
            "Unable to accept donation"
        );

      } finally {
        setAcceptingId(null);
      }
    };

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    fetchAvailableDonations();
    fetchAcceptedDonations();
    fetchNotifications();

    /*
      Automatically check for new notifications
      every 15 seconds.
    */

    const notificationInterval =
      setInterval(() => {
        fetchNotifications();
      }, 15000);

    return () => {
      clearInterval(
        notificationInterval
      );
    };
  }, []);

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="receiver-dashboard">

      {/* ============================================
          SIDEBAR
      ============================================= */}

      <aside className="receiver-sidebar">

        {/* LOGO */}

        <div className="receiver-logo">

          <div className="receiver-logo-icon">
            ♥
          </div>

          <span>
            Food Rescue
          </span>

        </div>

        {/* USER CARD */}

        <div className="receiver-user-card">

          <div className="receiver-avatar">

            {user?.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "R"}

          </div>

          <div>

            <strong>
              {user?.name ||
                "Receiver"}
            </strong>

            <span>
              Food Receiver
            </span>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="receiver-navigation">

          <button
            className="receiver-nav-item active"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            }}
          >
            🏠 Dashboard
          </button>

          <button
            className="receiver-nav-item"
            onClick={() => {
              document
                .getElementById(
                  "available-food"
                )
                ?.scrollIntoView({
                  behavior: "smooth"
                });
            }}
          >
            🍱 Available Food
          </button>

          <button
            className="receiver-nav-item"
            onClick={() => {
              document
                .getElementById(
                  "accepted-food"
                )
                ?.scrollIntoView({
                  behavior: "smooth"
                });
            }}
          >
            📦 My Accepted Food
          </button>

          {/* NOTIFICATION BUTTON */}

          <button
            className="receiver-nav-item"
            onClick={() => {
              setShowNotifications(
                (previous) =>
                  !previous
              );

              fetchNotifications();
            }}
          >
            🔔 Notifications

            {unreadCount > 0 && (
              <span
                style={{
                  marginLeft: "8px",
                  background: "#e53935",
                  color: "white",
                  borderRadius: "50%",
                  minWidth: "22px",
                  height: "22px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700"
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* REFRESH */}

          <button
            className="receiver-nav-item"
            onClick={() => {
              fetchAvailableDonations();
              fetchAcceptedDonations();
              fetchNotifications();
            }}
          >
            🔄 Refresh
          </button>

        </nav>

        {/* LOGOUT */}

        <button
          className="receiver-logout"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>

      </aside>

      {/* ============================================
          MAIN CONTENT
      ============================================= */}

      <main className="receiver-main">

        {/* ========================================
            HEADER
        ========================================= */}

        <header className="receiver-header">

          <div>

            <h1>
              Welcome,{" "}
              {user?.name ||
                "Receiver"}
              !
            </h1>

            <p>
              Find available food and help
              reduce food waste.
            </p>

          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px"
            }}
          >

            {/* NOTIFICATION BELL */}

            <button
              onClick={() => {
                setShowNotifications(
                  (previous) =>
                    !previous
                );

                fetchNotifications();
              }}
              style={{
                position: "relative",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "none",
                background: "#ffffff",
                fontSize: "22px",
                cursor: "pointer",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.10)"
              }}
              title="Notifications"
            >
              🔔

              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#e53935",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }}
                >
                  {unreadCount}
                </span>
              )}

            </button>

            {/* AVATAR */}

            <div className="receiver-header-avatar">

              {user?.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "R"}

            </div>

          </div>

        </header>

        {/* ========================================
            NOTIFICATION PANEL
        ========================================= */}

        {showNotifications && (
          <section
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "25px",
              boxShadow:
                "0 4px 18px rgba(0,0,0,0.08)",
              border:
                "1px solid #e5e7eb"
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "15px"
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0
                  }}
                >
                  🔔 Notifications
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#6b7280"
                  }}
                >
                  New food donations matching
                  your receiver profile.
                </p>

              </div>

              {unreadCount > 0 && (
                <button
                  onClick={
                    markAllNotificationsAsRead
                  }
                  style={{
                    border: "none",
                    background:
                      "#168f4d",
                    color: "white",
                    padding:
                      "9px 14px",
                    borderRadius:
                      "8px",
                    cursor: "pointer"
                  }}
                >
                  Mark all as read
                </button>
              )}

            </div>

            {notificationLoading ? (
              <div
                style={{
                  padding: "25px",
                  textAlign: "center",
                  color: "#6b7280"
                }}
              >
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  border:
                    "1px dashed #d1d5db",
                  borderRadius: "12px",
                  color: "#6b7280"
                }}
              >
                <div
                  style={{
                    fontSize: "35px",
                    marginBottom: "10px"
                  }}
                >
                  🔕
                </div>

                <strong>
                  No notifications
                </strong>

                <p>
                  You will see matching food
                  donations here.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >

                {notifications.map(
                  (notification) => (
                    <div
                      key={
                        notification._id
                      }
                      onClick={() => {
                        if (
                          !notification.isRead
                        ) {
                          markNotificationAsRead(
                            notification._id
                          );
                        }
                      }}
                      style={{
                        padding: "15px",
                        borderRadius: "12px",
                        border:
                          "1px solid #e5e7eb",
                        background:
                          notification.isRead
                            ? "#ffffff"
                            : "#f0fdf4",
                        cursor:
                          notification.isRead
                            ? "default"
                            : "pointer",
                        borderLeft:
                          notification.isRead
                            ? "4px solid #d1d5db"
                            : "4px solid #16a34a"
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "15px"
                        }}
                      >

                        <div>

                          <strong>
                            {notification.title}
                          </strong>

                          <p
                            style={{
                              margin:
                                "6px 0",
                              color:
                                "#4b5563"
                            }}
                          >
                            {notification.message}
                          </p>

                          <small
                            style={{
                              color:
                                "#9ca3af"
                            }}
                          >
                            {formatDate(
                              notification.createdAt
                            )}
                          </small>

                        </div>

                        {!notification.isRead && (
                          <span
                            style={{
                              background:
                                "#16a34a",
                              color:
                                "white",
                              borderRadius:
                                "20px",
                              padding:
                                "5px 10px",
                              height:
                                "fit-content",
                              fontSize:
                                "11px",
                              fontWeight:
                                "bold"
                            }}
                          >
                            NEW
                          </span>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* ========================================
            MESSAGES
        ========================================= */}

        {message && (
          <div className="receiver-success">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="receiver-error">
            ⚠ {error}
          </div>
        )}

        {/* ========================================
            STATISTICS
        ========================================= */}

        <section className="receiver-stats">

          <div className="receiver-stat-card">

            <div className="stat-icon green">
              🍱
            </div>

            <div>

              <span>
                Available Food
              </span>

              <strong>
                {donations.length}
              </strong>

            </div>

          </div>

          <div className="receiver-stat-card">

            <div className="stat-icon blue">
              📦
            </div>

            <div>

              <span>
                Accepted
              </span>

              <strong>
                {acceptedDonations.length}
              </strong>

            </div>

          </div>

          <div className="receiver-stat-card">

            <div className="stat-icon orange">
              ❤️
            </div>

            <div>

              <span>
                Food Received
              </span>

              <strong>
                {acceptedDonations.reduce(
                  (
                    total,
                    donation
                  ) =>
                    total +
                    Number(
                      donation.quantity ||
                        0
                    ),
                  0
                )}
              </strong>

            </div>

          </div>

        </section>

        {/* ========================================
            AVAILABLE FOOD
        ========================================= */}

        <section
          id="available-food"
          className="receiver-section"
        >

          <div className="section-heading">

            <div>

              <h2>
                Available Food
              </h2>

              <p>
                Food donations currently
                available for you.
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={() => {
                fetchAvailableDonations();
                fetchNotifications();
              }}
            >
              ↻ Refresh
            </button>

          </div>

          {loading ? (

            <div className="receiver-empty">

              <div className="loader"></div>

              <p>
                Loading available food...
              </p>

            </div>

          ) : donations.length === 0 ? (

            <div className="receiver-empty">

              <div className="empty-icon">
                🍽️
              </div>

              <h3>
                No food available
              </h3>

              <p>
                There are currently no
                available food donations.
              </p>

            </div>

          ) : (

            <div className="donation-grid">

              {donations.map(
                (donation) => (

                  <div
                    className="receiver-donation-card"
                    key={
                      donation._id
                    }
                  >

                    {/* CARD HEADER */}

                    <div className="donation-card-header">

                      <div>

                        <h3>
                          {donation.foodName}
                        </h3>

                        <span className="category">
                          {donation.category}
                        </span>

                      </div>

                      <span className="available-badge">
                        {donation.status ||
                          "AVAILABLE"}
                      </span>

                    </div>

                    {/* DETAILS */}

                    <div className="donation-details">

                      <div className="detail-row">

                        <span>
                          🍽️ Food Type
                        </span>

                        <strong>
                          {donation.foodType ===
                          "veg"
                            ? "Vegetarian"
                            : "Non-Vegetarian"}
                        </strong>

                      </div>

                      <div className="detail-row">

                        <span>
                          📦 Quantity
                        </span>

                        <strong>
                          {donation.quantity}{" "}
                          {donation.quantityUnit}
                        </strong>

                      </div>

                      <div className="detail-row">

                        <span>
                          📍 Location
                        </span>

                        <strong>
                          {donation.donorArea},{" "}
                          {donation.city}
                        </strong>

                      </div>

                      <div className="detail-row">

                        <span>
                          ⏰ Consume Before
                        </span>

                        <strong>
                          {formatDate(
                            donation.expiresAt
                          )}
                        </strong>

                      </div>

                      {/* PICKUP METHOD */}

                      <div className="detail-row">

                        <span>
                          🚚 Pickup
                        </span>

                        <strong>
                          {donation.pickupMethod ===
                          "volunteer"
                            ? "Volunteer Pickup"
                            : "Receiver Pickup"}
                        </strong>

                      </div>

                    </div>

                    {/* DONOR */}

                    {donation.donorId && (
                      <div className="donor-info">

                        <span>
                          Donated by
                        </span>

                        <strong>
                          {
                            donation
                              .donorId
                              .name
                          }
                        </strong>

                      </div>
                    )}

                    {/* ACCEPT */}

                    <button
                      className="accept-button"
                      onClick={() =>
                        handleAcceptDonation(
                          donation
                        )
                      }
                      disabled={
                        acceptingId ===
                        donation._id
                      }
                    >

                      {acceptingId ===
                      donation._id
                        ? "Accepting..."
                        : "Accept Donation"}

                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* ========================================
            ACCEPTED FOOD
        ========================================= */}

        <section
          id="accepted-food"
          className="receiver-section"
        >

          <div className="section-heading">

            <div>

              <h2>
                My Accepted Food
              </h2>

              <p>
                Donations you have accepted.
              </p>

            </div>

          </div>

          {acceptedDonations.length ===
          0 ? (

            <div className="receiver-empty">

              <div className="empty-icon">
                📦
              </div>

              <h3>
                No accepted donations
              </h3>

              <p>
                Accept an available donation
                to see it here.
              </p>

            </div>

          ) : (

            <div className="donation-grid">

              {acceptedDonations.map(
                (donation) => (

                  <div
                    className="receiver-donation-card accepted"
                    key={
                      donation._id
                    }
                  >

                    <div className="donation-card-header">

                      <div>

                        <h3>
                          {donation.foodName}
                        </h3>

                        <span className="category">
                          {donation.category}
                        </span>

                      </div>

                      <span className="allocated-badge">
                        {donation.status}
                      </span>

                    </div>

                    <div className="donation-details">

                      <div className="detail-row">

                        <span>
                          🍽️ Food Type
                        </span>

                        <strong>
                          {donation.foodType ===
                          "veg"
                            ? "Vegetarian"
                            : "Non-Vegetarian"}
                        </strong>

                      </div>

                      <div className="detail-row">

                        <span>
                          📦 Quantity
                        </span>

                        <strong>
                          {donation.quantity}{" "}
                          {donation.quantityUnit}
                        </strong>

                      </div>

                      <div className="detail-row">

                        <span>
                          📍 Location
                        </span>

                        <strong>
                          {donation.donorArea},{" "}
                          {donation.city}
                        </strong>

                      </div>

                      <div className="detail-row">

                        <span>
                          ⏰ Consume Before
                        </span>

                        <strong>
                          {formatDate(
                            donation.expiresAt
                          )}
                        </strong>

                      </div>

                      <div className="detail-row">

                        <span>
                          📅 Accepted On
                        </span>

                        <strong>
                          {formatDate(
                            donation.acceptedAt
                          )}
                        </strong>

                      </div>

                      {/* PICKUP METHOD */}

                      <div className="detail-row">

                        <span>
                          🚚 Pickup
                        </span>

                        <strong>
                          {donation.pickupMethod ===
                          "volunteer"
                            ? "Volunteer Pickup"
                            : "Receiver Pickup"}
                        </strong>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default ReceiverDashboard;