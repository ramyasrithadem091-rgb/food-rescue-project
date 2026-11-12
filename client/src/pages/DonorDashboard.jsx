import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  Heart,
  Home,
  PlusCircle,
  Package,
  History,
  Bell,
  User,
  LogOut,
  Utensils,
  Users,
  Leaf
} from "lucide-react";

import "./DonorDashboard.css";


function DonorDashboard() {

  const navigate = useNavigate();


  // ======================================================
  // STATE
  // ======================================================

  const [activeMenu, setActiveMenu] =
    useState("dashboard");


  const [donations, setDonations] =
    useState([]);


  const [loadingDonations, setLoadingDonations] =
    useState(true);


  const [donationError, setDonationError] =
    useState("");


  // ======================================================
  // GET LOGGED-IN USER
  // ======================================================

  const storedUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");


  const user = storedUser
    ? JSON.parse(storedUser)
    : null;


  // ======================================================
  // MARK VOLUNTEER PAYMENT AS PAID
  // ======================================================

  const handleMarkPaid = async (donationId) => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:5000/api/donations/${donationId}/payment-paid`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not update payment");
        return;
      }

      setDonations((previous) =>
        previous.map((item) =>
          item._id === donationId
            ? {
                ...item,
                paymentStatus: "PAID"
              }
            : item
        )
      );
    } catch (error) {
      alert("Could not reach the server");
    }
  };


  // ======================================================
  // FETCH DONATIONS
  // ======================================================

  useEffect(() => {

    const fetchDonations = async () => {

      try {

        setLoadingDonations(true);

        setDonationError("");


        // ===============================
        // GET TOKEN
        // ===============================

        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");


        // ===============================
        // NO TOKEN
        // ===============================

        if (!token) {

          navigate("/login");

          return;

        }


        // ===============================
        // API REQUEST
        // ===============================

        const response =
          await fetch(
            "http://localhost:5000/api/donations/my",
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );


        // ===============================
        // RESPONSE
        // ===============================

        const data =
          await response.json();


        // ===============================
        // ERROR
        // ===============================

        if (!response.ok) {

          setDonationError(
            data.message ||
            "Unable to load donations."
          );

          return;

        }


        // ===============================
        // SAVE DONATIONS
        // ===============================

        setDonations(
          data.donations || []
        );

      } catch (error) {

        console.error(
          "Fetch donations error:",
          error
        );


        setDonationError(
          "Unable to connect to the server."
        );

      } finally {

        setLoadingDonations(false);

      }

    };


    fetchDonations();

  }, [navigate]);


  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    sessionStorage.removeItem("token");

    sessionStorage.removeItem("user");

    navigate("/login");

  };


  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="donor-dashboard">


      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="dashboard-sidebar">


        {/* LOGO */}

        <div className="dashboard-logo">

          <div className="dashboard-logo-icon">

            <Heart
              size={24}
              fill="currentColor"
            />

          </div>


          <span>
            Food Rescue
          </span>

        </div>


        {/* USER */}

        <div className="dashboard-user">

          <div className="user-avatar">

            {user?.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "D"}

          </div>


          <div>

            <h3>
              {user?.name || "Donor"}
            </h3>

            <p>
              Food Donor
            </p>

          </div>

        </div>


        {/* MENU */}

        <nav className="dashboard-menu">


          {/* DASHBOARD */}

          <button
            className={
              activeMenu === "dashboard"
                ? "menu-item active"
                : "menu-item"
            }

            onClick={() =>
              setActiveMenu("dashboard")
            }
          >

            <Home size={19} />

            Dashboard

          </button>


          {/* DONATE FOOD */}

          <button
            className="menu-item"

            onClick={() =>
              navigate(
                "/donate-food"
              )
            }
          >

            <PlusCircle size={19} />

            Donate Food

          </button>


          {/* ACTIVE DONATIONS */}

          <button
            className={
              activeMenu === "active"
                ? "menu-item active"
                : "menu-item"
            }

            onClick={() =>
              setActiveMenu("active")
            }
          >

            <Package size={19} />

            Active Donations

          </button>


          {/* HISTORY */}

          <button
            className={
              activeMenu === "history"
                ? "menu-item active"
                : "menu-item"
            }

            onClick={() =>
              setActiveMenu("history")
            }
          >

            <History size={19} />

            Donation History

          </button>


          {/* NOTIFICATIONS */}

          <button
            className={
              activeMenu === "notifications"
                ? "menu-item active"
                : "menu-item"
            }

            onClick={() =>
              setActiveMenu(
                "notifications"
              )
            }
          >

            <Bell size={19} />

            Notifications

          </button>


          {/* PROFILE */}

          <button
            className={
              activeMenu === "profile"
                ? "menu-item active"
                : "menu-item"
            }

            onClick={() =>
              setActiveMenu("profile")
            }
          >

            <User size={19} />

            My Profile

          </button>

        </nav>


        {/* LOGOUT */}

        <button
          className="logout-btn"

          onClick={handleLogout}
        >

          <LogOut size={19} />

          Logout

        </button>

      </aside>


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="dashboard-main">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="dashboard-header">


          <div>

            <h1>
              Welcome,{" "}
              {user?.name || "Donor"}!
            </h1>

            <p>
              Thank you for helping reduce food waste.
            </p>

          </div>


          <div className="header-actions">


            <button
              className="notification-btn"
            >

              <Bell size={21} />

              <span>
                2
              </span>

            </button>


            <div className="header-avatar">

              {user?.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "D"}

            </div>

          </div>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="stats-grid">


          {/* TOTAL DONATIONS */}

          <div className="stat-card">

            <div className="stat-icon green">

              <Utensils size={24} />

            </div>


            <div>

              <p>
                Total Donations
              </p>

              <h2>
                {donations.length}
              </h2>

            </div>

          </div>


          {/* PEOPLE HELPED */}

          <div className="stat-card">

            <div className="stat-icon blue">

              <Users size={24} />

            </div>


            <div>

              <p>
                People Helped
              </p>

              <h2>
                0
              </h2>

            </div>

          </div>


          {/* FOOD SAVED */}

          <div className="stat-card">

            <div className="stat-icon orange">

              <Package size={24} />

            </div>


            <div>

              <p>
                Food Saved
              </p>

              <h2>
                0 kg
              </h2>

            </div>

          </div>


          {/* IMPACT SCORE */}

          <div className="stat-card">

            <div className="stat-icon purple">

              <Leaf size={24} />

            </div>


            <div>

              <p>
                Impact Score
              </p>

              <h2>
                0
              </h2>

            </div>

          </div>

        </div>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="dashboard-section">


          <div className="section-title">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Start making an impact today.
              </p>

            </div>

          </div>


          <div className="quick-actions">


            {/* DONATE */}

            <button
              className="quick-card"

              onClick={() =>
                navigate(
                  "/donate-food"
                )
              }
            >

              <div className="quick-icon">

                <PlusCircle
                  size={28}
                />

              </div>


              <h3>
                Donate Food
              </h3>


              <p>
                Share surplus food with people
                who need it.
              </p>

            </button>


            {/* TRACK */}

            <button
              className="quick-card"

              onClick={() =>
                setActiveMenu(
                  "active"
                )
              }
            >

              <div className="quick-icon">

                <Package
                  size={28}
                />

              </div>


              <h3>
                Track Donations
              </h3>


              <p>
                View your active food donations
                and their status.
              </p>

            </button>


            {/* HISTORY */}

            <button
              className="quick-card"

              onClick={() =>
                setActiveMenu(
                  "history"
                )
              }
            >

              <div className="quick-icon">

                <History
                  size={28}
                />

              </div>


              <h3>
                Donation History
              </h3>


              <p>
                See all your previous donations.
              </p>

            </button>

          </div>

        </section>


        {/* =================================================
            RECENT DONATIONS
        ================================================= */}

        <section className="dashboard-section">


          <div className="section-title">

            <div>

              <h2>
                Recent Donations
              </h2>

              <p>
                Your latest food rescue activities.
              </p>

            </div>


            <button
              className="view-all-btn"

              onClick={() =>
                setActiveMenu(
                  "history"
                )
              }
            >

              View All

            </button>

          </div>


          {/* =================================================
              LOADING
          ================================================= */}

          {loadingDonations && (

            <div className="empty-donations">

              <div className="empty-icon">

                <Package size={40} />

              </div>


              <h3>
                Loading donations...
              </h3>


              <p>
                Please wait while we fetch your donations.
              </p>

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!loadingDonations &&
            donationError && (

              <div className="empty-donations">

                <div className="empty-icon">

                  <Package size={40} />

                </div>


                <h3>
                  Unable to load donations
                </h3>


                <p>
                  {donationError}
                </p>

              </div>

            )}


          {/* =================================================
              NO DONATIONS
          ================================================= */}

          {!loadingDonations &&
            !donationError &&
            donations.length === 0 && (

              <div className="empty-donations">

                <div className="empty-icon">

                  <Package size={40} />

                </div>


                <h3>
                  No donations yet
                </h3>


                <p>
                  Your donated food will appear here.
                </p>


                <button
                  className="start-donation-btn"

                  onClick={() =>
                    navigate(
                      "/donate-food"
                    )
                  }
                >

                  <PlusCircle
                    size={18}
                  />

                  Donate Food

                </button>

              </div>

            )}


          {/* =================================================
              DONATIONS
          ================================================= */}

          {!loadingDonations &&
            !donationError &&
            donations.length > 0 && (

              <div className="donations-list">


                {donations.map(
                  (donation) => (

                    <div
                      className="donation-card"

                      key={
                        donation._id
                      }
                    >


                      {/* DONATION HEADER */}

                      <div className="donation-card-header">


                        <div>

                          <h3>
                            {donation.foodName}
                          </h3>


                          <p>
                            {donation.category}
                          </p>

                        </div>


                        <span
                          className={
                            `donation-status ${
                              donation.status.toLowerCase()
                            }`
                          }
                        >

                          {donation.status}

                        </span>

                      </div>


                      {/* DONATION DETAILS */}

                      <div className="donation-details">


                        <div>

                          <strong>
                            Quantity
                          </strong>

                          <span>
                            {donation.quantity}{" "}
                            {donation.quantityUnit}
                          </span>

                        </div>


                        <div>

                          <strong>
                            Food Type
                          </strong>

                          <span>

                            {donation.foodType ===
                            "veg"
                              ? "Vegetarian"
                              : "Non-Vegetarian"}

                          </span>

                        </div>


                        <div>

                          <strong>
                            Location
                          </strong>

                          <span>
                            {donation.donorArea},{" "}
                            {donation.city}
                          </span>

                        </div>


                        <div>

                          <strong>
                            Consume Before
                          </strong>

                          <span>

                            {new Date(
                              donation.expiresAt
                            ).toLocaleString()}

                          </span>

                        </div>

                      </div>

                      {/* VOLUNTEER AND PAYMENT */}

                      {donation.volunteerId && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "14px",
                            border: "1px solid #bbf7d0",
                            borderRadius: "10px",
                            background: "#f0fdf4"
                          }}
                        >
                          <h4 style={{ margin: "0 0 8px" }}>
                            Volunteer
                          </h4>

                          <p style={{ margin: "2px 0" }}>
                            <strong>Name:</strong>{" "}
                            {donation.volunteerId.name}
                          </p>

                          <p style={{ margin: "2px 0" }}>
                            <strong>Phone:</strong>{" "}
                            {donation.volunteerId.phone}
                          </p>

                          {donation.paymentStatus === "PENDING" && (
                            <>
                              <p style={{ margin: "8px 0 2px" }}>
                                <strong>Amount to pay:</strong>{" "}
                                ₹{donation.deliveryAmount}
                              </p>

                              {donation.volunteerId.upiId && (
                                <p style={{ margin: "2px 0" }}>
                                  <strong>UPI ID:</strong>{" "}
                                  {donation.volunteerId.upiId}
                                </p>
                              )}

                              {donation.volunteerId.upiQr && (
                                <img
                                  src={donation.volunteerId.upiQr}
                                  alt="Volunteer payment QR"
                                  style={{
                                    width: "170px",
                                    display: "block",
                                    margin: "8px 0"
                                  }}
                                />
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkPaid(donation._id)
                                }
                                style={{
                                  background: "#15803d",
                                  color: "#fff",
                                  border: "none",
                                  padding: "10px 16px",
                                  borderRadius: "8px",
                                  cursor: "pointer"
                                }}
                              >
                                I have paid
                              </button>
                            </>
                          )}

                          {donation.paymentStatus === "PAID" && (
                            <p style={{ margin: "8px 0 0" }}>
                              ✓ Paid ₹{donation.deliveryAmount} to the
                              volunteer
                            </p>
                          )}

                          {donation.paymentStatus ===
                            "NOT_REQUESTED" && (
                            <p style={{ margin: "8px 0 0" }}>
                              {donation.status === "DELIVERED" ||
                              donation.status === "COMPLETED"
                                ? "No payment requested."
                                : "Payment details appear after delivery."}
                            </p>
                          )}
                        </div>
                      )}

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


export default DonorDashboard;