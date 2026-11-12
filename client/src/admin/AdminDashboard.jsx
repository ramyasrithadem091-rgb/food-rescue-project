import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Heart,
  LayoutDashboard,
  Users,
  Utensils,
  Truck,
  CheckCircle,
  Clock,
  RefreshCw,
  LogOut,
  Package,
  Trash2,
  UserCog,
  Building2
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import "./AdminDashboard.css";
import "./AdminReceivers.css";


function AdminDashboard() {

  const navigate = useNavigate();

  const { user, logout } = useAuth();


  // ==================================================
  // STATE
  // ==================================================

  const [activeSection, setActiveSection] =
    useState("dashboard");


  const [stats, setStats] = useState({

    totalUsers: 0,
    donors: 0,
    receivers: 0,
    volunteers: 0,
    totalDonations: 0,
    availableDonations: 0,
    volunteerRequests: 0,
    completedDonations: 0

  });


  const [users, setUsers] =
    useState([]);


  const [donations, setDonations] =
    useState([]);


  const [volunteers, setVolunteers] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [actionLoading, setActionLoading] =
    useState(false);


  // ==================================================
  // TOKEN
  // ==================================================

  const getToken = () => {

    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );

  };


  // ==================================================
  // FETCH DATA
  // ==================================================

  const fetchAdminData = async () => {

    try {

      setLoading(true);
      setError("");

      const token = getToken();


      if (!token) {

        navigate("/login");

        return;

      }


      // ----------------------------------------------
      // DASHBOARD
      // ----------------------------------------------

      const statsResponse = await fetch(
        "http://localhost:5000/api/admin/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      const statsData =
        await statsResponse.json();


      if (!statsResponse.ok) {

        throw new Error(
          statsData.message ||
          "Unable to load dashboard"
        );

      }


      setStats(
        statsData.stats
      );


      // ----------------------------------------------
      // USERS
      // ----------------------------------------------

      const usersResponse = await fetch(
        "http://localhost:5000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      const usersData =
        await usersResponse.json();


      if (!usersResponse.ok) {

        throw new Error(
          usersData.message ||
          "Unable to load users"
        );

      }


      setUsers(
        usersData.users || []
      );


      // ----------------------------------------------
      // DONATIONS
      // ----------------------------------------------

      const donationsResponse = await fetch(
        "http://localhost:5000/api/admin/donations",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      const donationsData =
        await donationsResponse.json();


      if (!donationsResponse.ok) {

        throw new Error(
          donationsData.message ||
          "Unable to load donations"
        );

      }


      setDonations(
        donationsData.donations || []
      );


      // ----------------------------------------------
      // VOLUNTEERS
      // ----------------------------------------------

      const volunteersResponse = await fetch(
        "http://localhost:5000/api/admin/volunteers",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      const volunteersData =
        await volunteersResponse.json();


      if (!volunteersResponse.ok) {

        throw new Error(
          volunteersData.message ||
          "Unable to load volunteers"
        );

      }


      setVolunteers(
        volunteersData.volunteers || []
      );


    } catch (err) {

      console.error(
        "ADMIN DASHBOARD ERROR:",
        err
      );


      setError(
        err.message ||
        "Unable to connect to server"
      );


    } finally {

      setLoading(false);

    }

  };


  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {

    fetchAdminData();

  }, []);


  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {

    logout();

    navigate("/login");

  };


  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (date) => {

    if (!date) {

      return "N/A";

    }


    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  };


  // ==================================================
  // STATUS CLASS
  // ==================================================

  const getStatusClass = (status) => {

    if (!status) {

      return "";

    }


    return status
      .toLowerCase()
      .replaceAll("_", "-");

  };


  // ==================================================
  // CHANGE USER ROLE
  // ==================================================

  const handleRoleChange = async (
    userId,
    newRole
  ) => {

    try {

      setActionLoading(true);
      setError("");

      const token = getToken();


      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            role: newRole
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to change user role"
        );

      }


      // Reload all data
      await fetchAdminData();


    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to change user role"
      );


    } finally {

      setActionLoading(false);

    }

  };


  // ==================================================
  // DELETE USER
  // ==================================================

  const handleDeleteUser = async (
    userId,
    userName
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${userName}?`
      );


    if (!confirmed) {

      return;

    }


    try {

      setActionLoading(true);
      setError("");

      const token = getToken();


      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to delete user"
        );

      }


      await fetchAdminData();


    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to delete user"
      );


    } finally {

      setActionLoading(false);

    }

  };


  // ==================================================
  // CHANGE DONATION STATUS
  // ==================================================

  const handleDonationStatusChange = async (
    donationId,
    newStatus
  ) => {

    try {

      setActionLoading(true);
      setError("");

      const token = getToken();


      const response = await fetch(
        `http://localhost:5000/api/admin/donations/${donationId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            status: newStatus
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to update donation status"
        );

      }


      await fetchAdminData();


    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to update donation"
      );


    } finally {

      setActionLoading(false);

    }

  };


  // ==================================================
  // NAVIGATION
  // ==================================================

  // ==================================================
  // RECEIVER ORGANISATIONS (list and add)
  // ==================================================

  const emptyReceiverForm = {
    name: "",
    organisationName: "",
    phone: "",
    receiverType: "",
    city: "Warangal",
    state: "Telangana",
    area: "",
    newArea: "",
    referenceArea: "",
    referenceDistanceKm: "",
    plates: "",
    kg: "",
    packets: "",
    boxes: "",
    expectedDeliveryMinutes: "60"
  };

  const [receivers, setReceivers] = useState([]);
  const [receiverForm, setReceiverForm] = useState(emptyReceiverForm);
  const [knownAreas, setKnownAreas] = useState([]);
  const [receiverMessage, setReceiverMessage] = useState("");
  const [receiverError, setReceiverError] = useState("");

  const apiGet = async (path) => {
    const response = await fetch(`http://localhost:5000${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const loadReceivers = async () => {
    try {
      const data = await apiGet("/api/admin/receivers");
      setReceivers(data.receivers || []);
    } catch (err) {
      setReceiverError(err.message);
    }
  };

  const loadAreas = async (city) => {
    try {
      const data = await apiGet(
        `/api/admin/areas?city=${encodeURIComponent(city)}`
      );
      setKnownAreas(data.areas || []);
    } catch (err) {
      setKnownAreas([]);
    }
  };

  // ---- receiver requests (from the Register page) ----
  const [requests, setRequests] = useState([]);
  const [areasByCity, setAreasByCity] = useState({});
  const [approveExtra, setApproveExtra] = useState({});

  const loadRequests = async () => {
    try {
      const data = await apiGet("/api/admin/receiver-requests");
      const list = data.requests || [];
      setRequests(list);

      const cities = [
        ...new Set(
          list
            .filter((r) => r.status === "PENDING")
            .map((r) => r.address?.city)
            .filter(Boolean)
        )
      ];
      const map = {};
      for (const city of cities) {
        try {
          const d = await apiGet(
            `/api/admin/areas?city=${encodeURIComponent(city)}`
          );
          map[city] = d.areas || [];
        } catch (e) {
          map[city] = [];
        }
      }
      setAreasByCity(map);
    } catch (err) {
      setReceiverError(err.message);
    }
  };

  const areaIsKnown = (r) =>
    (areasByCity[r.address?.city] || []).some(
      (a) => a.toLowerCase() === String(r.address?.area || "").toLowerCase()
    );

  const handleApprove = async (r) => {
    setReceiverError("");
    setReceiverMessage("");
    const extra = approveExtra[r._id] || {};

    try {
      setActionLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/admin/receiver-requests/${r._id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            referenceArea: extra.referenceArea || "",
            referenceDistanceKm: extra.referenceDistanceKm || ""
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setReceiverError(data.message || "Could not approve");
        return;
      }
      setReceiverMessage(
        `${r.organisationName} was approved and added to the receivers.`
      );
      loadRequests();
      loadReceivers();
    } catch (err) {
      setReceiverError("Could not reach the server");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (r) => {
    if (!window.confirm(`Reject the request from ${r.organisationName}?`)) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/receiver-requests/${r._id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({})
        }
      );
      if (response.ok) {
        setReceiverMessage(`Request from ${r.organisationName} was rejected.`);
        loadRequests();
      }
    } catch (err) {
      setReceiverError("Could not reach the server");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeSection === "receivers") {
      loadReceivers();
      loadRequests();
      loadAreas(receiverForm.city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const handleReceiverField = (e) => {
    const { name, value } = e.target;
    setReceiverForm((previous) => ({ ...previous, [name]: value }));
    setReceiverError("");
    setReceiverMessage("");
    if (name === "city") {
      loadAreas(value);
      setReceiverForm((previous) => ({
        ...previous,
        city: value,
        area: "",
        newArea: "",
        referenceArea: ""
      }));
    }
  };

  const handleAddReceiver = async (e) => {
    e.preventDefault();
    setReceiverError("");
    setReceiverMessage("");

    const usingNewArea = receiverForm.area === "__new__";
    const areaName = usingNewArea
      ? receiverForm.newArea.trim()
      : receiverForm.area;

    try {
      setActionLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/receivers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            ...receiverForm,
            area: areaName,
            referenceArea: usingNewArea ? receiverForm.referenceArea : "",
            referenceDistanceKm: usingNewArea
              ? receiverForm.referenceDistanceKm
              : ""
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setReceiverError(data.message || "Could not add receiver");
        return;
      }

      setReceiverMessage(
        `${data.receiver.organisationName} was added and will now be matched to new donations.`
      );
      setReceiverForm({ ...emptyReceiverForm, city: receiverForm.city });
      loadReceivers();
      loadAreas(receiverForm.city);
    } catch (err) {
      setReceiverError("Could not reach the server");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleReceiver = async (id, isActive) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/receivers/${id}/active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ isActive })
        }
      );
      if (response.ok) loadReceivers();
    } catch (err) {
      setReceiverError("Could not update receiver");
    }
  };

  const typeLabel = (t) =>
    ({
      orphanage: "Orphanage",
      old_age_home: "Old Age Home",
      slum_area: "Slum Area"
    }[t] || t);

  const renderReceivers = () => (
    <>
      {renderHeader(
        "Receiver Organisations",
        "Add new organisations that can receive donated food."
      )}

      <section className="admin-section">
        <div className="section-title">
          <div>
            <h2>Receiver Requests</h2>
            <p>
              Organisations that registered as receivers. Pending:{" "}
              {pendingRequests.length}
            </p>
          </div>
        </div>

        {receiverError && (
          <div className="admin-error" style={{ marginBottom: 14 }}>
            ⚠️ {receiverError}
          </div>
        )}
        {receiverMessage && (
          <div className="receiver-success" style={{ marginBottom: 14 }}>
            ✓ {receiverMessage}
          </div>
        )}

        {pendingRequests.length === 0 ? (
          <div className="admin-empty">No pending requests.</div>
        ) : (
          pendingRequests.map((r) => (
            <div className="request-card" key={r._id}>
              <div className="request-top">
                <div>
                  <h3>{r.organisationName}</h3>
                  <span>
                    {typeLabel(r.receiverType)} · requested{" "}
                    {formatDate(r.createdAt)}
                  </span>
                </div>
              </div>

              <div className="request-details">
                <p><strong>Contact:</strong> {r.name}</p>
                <p><strong>Phone:</strong> {r.phone}</p>
                {r.email && <p><strong>Email:</strong> {r.email}</p>}
                <p>
                  <strong>Address:</strong> {r.address?.area},{" "}
                  {r.address?.city}, {r.address?.state}
                </p>
                <p>
                  <strong>Capacity:</strong> {r.capacity?.plates} plates,{" "}
                  {r.capacity?.kg} kg, {r.capacity?.packets} packets,{" "}
                  {r.capacity?.boxes} boxes
                </p>
                <p>
                  <strong>Delivery time needed:</strong>{" "}
                  {r.expectedDeliveryMinutes} min
                </p>
              </div>

              {!areaIsKnown(r) && (
                <div className="request-newarea">
                  <p>
                    “{r.address?.area}” is a new area. Choose the nearest
                    known area and the distance to it so matching can work.
                  </p>
                  <select
                    value={approveExtra[r._id]?.referenceArea || ""}
                    onChange={(e) =>
                      setApproveExtra((p) => ({
                        ...p,
                        [r._id]: { ...p[r._id], referenceArea: e.target.value }
                      }))
                    }
                  >
                    <option value="">Nearest known area</option>
                    {(areasByCity[r.address?.city] || []).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Distance (km)"
                    value={approveExtra[r._id]?.referenceDistanceKm || ""}
                    onChange={(e) =>
                      setApproveExtra((p) => ({
                        ...p,
                        [r._id]: {
                          ...p[r._id],
                          referenceDistanceKm: e.target.value
                        }
                      }))
                    }
                  />
                </div>
              )}

              <div className="request-actions">
                <button
                  className="request-approve"
                  disabled={actionLoading}
                  onClick={() => handleApprove(r)}
                >
                  Approve and add
                </button>
                <button
                  className="request-reject"
                  disabled={actionLoading}
                  onClick={() => handleReject(r)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <div>
            <h2>Add New Receiver</h2>
            <p>
              Once added, the organisation is matched to new donations and
              receives SMS invitations.
            </p>
          </div>
        </div>

        <form className="receiver-form" onSubmit={handleAddReceiver}>
          <label>
            Contact person name *
            <input name="name" value={receiverForm.name}
              onChange={handleReceiverField} placeholder="Name of the person in charge" />
          </label>

          <label>
            Organisation name *
            <input name="organisationName" value={receiverForm.organisationName}
              onChange={handleReceiverField} placeholder="Example: Sunrise Children's Home" />
          </label>

          <label>
            Phone (10 digits, receives SMS) *
            <input name="phone" value={receiverForm.phone} maxLength="10"
              onChange={(e) =>
                handleReceiverField({
                  target: { name: "phone", value: e.target.value.replace(/\D/g, "") }
                })
              }
              placeholder="10-digit mobile number" />
          </label>

          <label>
            Type *
            <select name="receiverType" value={receiverForm.receiverType}
              onChange={handleReceiverField}>
              <option value="">Select type</option>
              <option value="orphanage">Orphanage</option>
              <option value="old_age_home">Old Age Home</option>
              <option value="slum_area">Slum Area</option>
            </select>
          </label>

          <label>
            City *
            <select name="city" value={receiverForm.city}
              onChange={handleReceiverField}>
              <option>Warangal</option>
              <option>Hanamkonda</option>
              <option>Kazipet</option>
            </select>
          </label>

          <label>
            Area *
            <select name="area" value={receiverForm.area}
              onChange={handleReceiverField}>
              <option value="">Select area</option>
              {knownAreas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
              <option value="__new__">+ Area not in the list</option>
            </select>
          </label>

          {receiverForm.area === "__new__" && (
            <>
              <label>
                New area name *
                <input name="newArea" value={receiverForm.newArea}
                  onChange={handleReceiverField} placeholder="Name of the new area" />
              </label>

              <label>
                Nearest known area *
                <select name="referenceArea" value={receiverForm.referenceArea}
                  onChange={handleReceiverField}>
                  <option value="">Select area</option>
                  {knownAreas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>

              <label>
                Distance to that area (km) *
                <input type="number" min="0" step="0.1" name="referenceDistanceKm"
                  value={receiverForm.referenceDistanceKm}
                  onChange={handleReceiverField} placeholder="Example: 3" />
              </label>
            </>
          )}

          <label>
            Capacity: plates
            <input type="number" min="0" name="plates"
              value={receiverForm.plates} onChange={handleReceiverField} />
          </label>
          <label>
            Capacity: kg
            <input type="number" min="0" name="kg"
              value={receiverForm.kg} onChange={handleReceiverField} />
          </label>
          <label>
            Capacity: packets
            <input type="number" min="0" name="packets"
              value={receiverForm.packets} onChange={handleReceiverField} />
          </label>
          <label>
            Capacity: boxes
            <input type="number" min="0" name="boxes"
              value={receiverForm.boxes} onChange={handleReceiverField} />
          </label>

          <label>
            Time needed to receive a delivery (minutes)
            <input type="number" min="1" name="expectedDeliveryMinutes"
              value={receiverForm.expectedDeliveryMinutes}
              onChange={handleReceiverField} />
          </label>

          <div className="receiver-form-actions">
            <button type="submit" disabled={actionLoading}>
              {actionLoading ? "Adding..." : "Add Receiver"}
            </button>
          </div>
        </form>

        {receiverError && (
          <div className="admin-error" style={{ marginTop: 14 }}>
            ⚠️ {receiverError}
          </div>
        )}
        {receiverMessage && (
          <div className="receiver-success">✓ {receiverMessage}</div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title">
          <div>
            <h2>All Receivers</h2>
            <p>Total organisations: {receivers.length}</p>
          </div>
        </div>

        <div className="admin-table-wrapper">
          {receivers.length === 0 ? (
            <div className="admin-empty">No receivers found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Type</th>
                  <th>Area</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {receivers.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{r.organisationName}</strong></td>
                    <td>{typeLabel(r.receiverType)}</td>
                    <td>{r.address?.area}, {r.address?.city}</td>
                    <td>{r.name}</td>
                    <td>{r.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <button
                        className="receiver-toggle"
                        onClick={() => handleToggleReceiver(r._id, !r.isActive)}
                      >
                        {r.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );


  const changeSection = (section) => {

    setActiveSection(section);

    setError("");

  };


  // ==================================================
  // SIDEBAR
  // ==================================================

  const renderSidebar = () => {

    return (

      <aside className="admin-sidebar">

        <div className="admin-logo">

          <div className="admin-logo-icon">

            <Heart
              size={22}
              fill="currentColor"
            />

          </div>

          <span>
            Food Rescue
          </span>

        </div>


        <div className="admin-profile">

          <div className="admin-avatar">

            {user?.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "A"}

          </div>


          <div>

            <strong>
              {user?.name ||
                "Administrator"}
            </strong>

            <span>
              Food Rescue Admin
            </span>

          </div>

        </div>


        <nav className="admin-navigation">

          <button
            className={`admin-nav-item ${
              activeSection === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("dashboard")
            }
          >

            <LayoutDashboard size={18} />

            Dashboard

          </button>


          <button
            className={`admin-nav-item ${
              activeSection === "users"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("users")
            }
          >

            <Users size={18} />

            Users

          </button>


          <button
            className={`admin-nav-item ${
              activeSection === "donations"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("donations")
            }
          >

            <Utensils size={18} />

            Donations

          </button>


          <button
            className={`admin-nav-item ${
              activeSection === "volunteers"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("volunteers")
            }
          >

            <Truck size={18} />

            Volunteers

          </button>


          <button
            className={`admin-nav-item ${
              activeSection === "receivers"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeSection("receivers")
            }
          >

            <Building2 size={18} />

            Receivers

            {pendingRequests.length > 0 && (
              <span className="request-badge">
                {pendingRequests.length}
              </span>
            )}

          </button>

        </nav>


        <button
          className="admin-logout"
          onClick={handleLogout}
        >

          <LogOut size={18} />

          Logout

        </button>

      </aside>

    );

  };


  // ==================================================
  // HEADER
  // ==================================================

  const renderHeader = (
    title,
    subtitle
  ) => {

    return (

      <header className="admin-header">

        <div>

          <h1>
            {title}
          </h1>

          <p>
            {subtitle}
          </p>

        </div>


        <div className="admin-header-actions">

          <button
            className="admin-refresh"
            onClick={fetchAdminData}
            disabled={
              loading ||
              actionLoading
            }
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </button>


          <div className="admin-header-avatar">

            {user?.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "A"}

          </div>

        </div>

      </header>

    );

  };


  // ==================================================
  // DASHBOARD SECTION
  // ==================================================

  const renderDashboard = () => {

    return (

      <>

        {renderHeader(
          "Admin Dashboard",
          "Monitor and manage the Food Rescue platform."
        )}


        <section className="admin-stats">

          <div className="admin-stat-card">

            <div className="stat-icon users">
              <Users size={23} />
            </div>

            <div>

              <span>
                Total Users
              </span>

              <strong>
                {stats.totalUsers}
              </strong>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="stat-icon donations">
              <Package size={23} />
            </div>

            <div>

              <span>
                Total Donations
              </span>

              <strong>
                {stats.totalDonations}
              </strong>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="stat-icon volunteers">
              <Truck size={23} />
            </div>

            <div>

              <span>
                Volunteers
              </span>

              <strong>
                {stats.volunteers}
              </strong>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="stat-icon completed">
              <CheckCircle size={23} />
            </div>

            <div>

              <span>
                Completed
              </span>

              <strong>
                {stats.completedDonations}
              </strong>

            </div>

          </div>

        </section>


        <section className="admin-section">

          <div className="section-title">

            <div>

              <h2>
                User Overview
              </h2>

              <p>
                Registered users by role
              </p>

            </div>

          </div>


          <div className="role-cards">

            <div className="role-card">

              <Users size={22} />

              <div>

                <span>
                  Donors
                </span>

                <strong>
                  {stats.donors}
                </strong>

              </div>

            </div>


            <div className="role-card">

              <Heart size={22} />

              <div>

                <span>
                  Receivers
                </span>

                <strong>
                  {stats.receivers}
                </strong>

              </div>

            </div>


            <div className="role-card">

              <Truck size={22} />

              <div>

                <span>
                  Volunteers
                </span>

                <strong>
                  {stats.volunteers}
                </strong>

              </div>

            </div>

          </div>

        </section>


        <section className="admin-section">

          <div className="section-title">

            <div>

              <h2>
                Donation Overview
              </h2>

              <p>
                Current donation status
              </p>

            </div>

          </div>


          <div className="donation-status-grid">

            <div>

              <Clock size={20} />

              <span>
                Available
              </span>

              <strong>
                {stats.availableDonations}
              </strong>

            </div>


            <div>

              <Truck size={20} />

              <span>
                Volunteer Requests
              </span>

              <strong>
                {stats.volunteerRequests}
              </strong>

            </div>


            <div>

              <CheckCircle size={20} />

              <span>
                Completed
              </span>

              <strong>
                {stats.completedDonations}
              </strong>

            </div>

          </div>

        </section>

      </>

    );

  };


  // ==================================================
  // USERS SECTION
  // ==================================================

  const renderUsers = () => {

    return (

      <>

        {renderHeader(
          "User Management",
          "View and manage all registered Food Rescue users."
        )}


        <section className="admin-section">

          <div className="section-title">

            <div>

              <h2>
                All Users
              </h2>

              <p>
                Total registered users:{" "}
                {users.length}
              </p>

            </div>

          </div>


          <div className="admin-table-wrapper">

            {users.length === 0 ? (

              <div className="admin-empty">
                No users found.
              </div>

            ) : (

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Joined
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {users.map((item) => (

                    <tr
                      key={item._id}
                    >

                      <td>

                        <div className="table-user">

                          <div className="small-avatar">

                            {item.name
                              ?.charAt(0)
                              .toUpperCase()}

                          </div>

                          <strong>
                            {item.name}
                          </strong>

                        </div>

                      </td>


                      <td>
                        {item.email}
                      </td>


                      <td>
                        {item.phone}
                      </td>


                      <td>

                        <select
                          value={item.role}
                          disabled={
                            actionLoading ||
                            item._id ===
                              user?.id ||
                            item._id ===
                              user?._id
                          }
                          onChange={(e) =>
                            handleRoleChange(
                              item._id,
                              e.target.value
                            )
                          }
                          style={{
                            padding: "6px 9px",
                            borderRadius: "7px",
                            border:
                              "1px solid #ddd",
                            cursor:
                              "pointer"
                          }}
                        >

                          <option value="donor">
                            Donor
                          </option>

                          <option value="receiver">
                            Receiver
                          </option>

                          <option value="volunteer">
                            Volunteer
                          </option>

                          <option value="admin">
                            Admin
                          </option>

                        </select>

                      </td>


                      <td>
                        {formatDate(
                          item.createdAt
                        )}
                      </td>


                      <td>

                        <button
                          onClick={() =>
                            handleDeleteUser(
                              item._id,
                              item.name
                            )
                          }
                          disabled={
                            actionLoading ||
                            item._id ===
                              user?.id ||
                            item._id ===
                              user?._id
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding:
                              "7px 10px",
                            border: "none",
                            borderRadius:
                              "7px",
                            cursor:
                              "pointer",
                            background:
                              "#ffe5e5",
                            color:
                              "#c62828"
                          }}
                        >

                          <Trash2 size={15} />

                          Delete

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </>

    );

  };


  // ==================================================
  // DONATIONS SECTION
  // ==================================================

  const renderDonations = () => {

    const statuses = [

      "AVAILABLE",
      "NOTIFIED",
      "ALLOCATED",
      "PICKUP_PENDING",
      "VOLUNTEER_REQUESTED",
      "VOLUNTEER_ASSIGNED",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "EXPIRED",
      "CANCELLED"

    ];


    return (

      <>

        {renderHeader(
          "Donation Management",
          "Monitor and update all food donations."
        )}


        <section className="admin-section">

          <div className="section-title">

            <div>

              <h2>
                All Donations
              </h2>

              <p>
                Total donations:{" "}
                {donations.length}
              </p>

            </div>

          </div>


          <div className="admin-table-wrapper">

            {donations.length === 0 ? (

              <div className="admin-empty">
                No donations found.
              </div>

            ) : (

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>
                      Food
                    </th>

                    <th>
                      Donor
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Pickup
                    </th>

                    <th>
                      Volunteer
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Created
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {donations.map(
                    (donation) => (

                      <tr
                        key={
                          donation._id
                        }
                      >

                        <td>

                          <div className="food-name">

                            <Utensils
                              size={17}
                            />

                            <strong>
                              {
                                donation.foodName
                              }
                            </strong>

                          </div>

                        </td>


                        <td>

                          {
                            donation.donorId
                              ?.name ||
                            "Unknown"
                          }

                        </td>


                        <td>

                          {
                            donation.quantity
                          }{" "}

                          {
                            donation.quantityUnit
                          }

                        </td>


                        <td>

                          {
                            donation.pickupMethod ===
                            "volunteer"
                              ? "Volunteer"
                              : "Receiver"
                          }

                        </td>


                        <td>
                          {donation.volunteerId
                            ? `${donation.volunteerId.name} (${donation.volunteerId.phone})`
                            : "—"}
                        </td>


                        <td>
                          {donation.paymentStatus === "PENDING"
                            ? `₹${donation.deliveryAmount} pending`
                            : donation.paymentStatus === "PAID"
                            ? `₹${donation.deliveryAmount} paid`
                            : "—"}
                        </td>


                        <td>

                          <select
                            value={
                              donation.status
                            }
                            disabled={
                              actionLoading
                            }
                            onChange={(e) =>
                              handleDonationStatusChange(
                                donation._id,
                                e.target.value
                              )
                            }
                            style={{
                              padding:
                                "6px 8px",
                              borderRadius:
                                "7px",
                              border:
                                "1px solid #ddd",
                              cursor:
                                "pointer",
                              fontSize:
                                "12px"
                            }}
                          >

                            {statuses.map(
                              (status) => (

                                <option
                                  key={
                                    status
                                  }
                                  value={
                                    status
                                  }
                                >
                                  {status}
                                </option>

                              )
                            )}

                          </select>

                        </td>


                        <td>

                          {
                            formatDate(
                              donation.createdAt
                            )
                          }

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </>

    );

  };


  // ==================================================
  // VOLUNTEERS SECTION
  // ==================================================

  const renderVolunteers = () => {

    return (

      <>

        {renderHeader(
          "Volunteer Management",
          "View all registered Food Rescue volunteers."
        )}


        <section className="admin-section">

          <div className="section-title">

            <div>

              <h2>
                All Volunteers
              </h2>

              <p>
                Total volunteers:{" "}
                {volunteers.length}
              </p>

            </div>

          </div>


          <div className="admin-table-wrapper">

            {volunteers.length === 0 ? (

              <div className="admin-empty">
                No volunteers found.
              </div>

            ) : (

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>
                      Volunteer
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Joined
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {volunteers.map(
                    (volunteer) => (

                      <tr
                        key={
                          volunteer._id
                        }
                      >

                        <td>

                          <div className="table-user">

                            <div className="small-avatar">

                              {volunteer.name
                                ?.charAt(0)
                                .toUpperCase()}

                            </div>

                            <strong>

                              {
                                volunteer.name
                              }

                            </strong>

                          </div>

                        </td>


                        <td>
                          {
                            volunteer.email
                          }
                        </td>


                        <td>
                          {
                            volunteer.phone
                          }
                        </td>


                        <td>

                          <span className="role-badge volunteer">

                            <Truck
                              size={13}
                            />

                            Volunteer

                          </span>

                        </td>


                        <td>

                          {
                            formatDate(
                              volunteer.createdAt
                            )
                          }

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </>

    );

  };


  // ==================================================
  // MAIN PAGE
  // ==================================================

  return (

    <div className="admin-page">

      {renderSidebar()}


      <main className="admin-main">

        {error && (

          <div className="admin-error">

            ⚠️ {error}

          </div>

        )}


        {loading ? (

          <div
            className="admin-empty"
            style={{
              marginTop: "30px"
            }}
          >

            Loading admin data...

          </div>

        ) : (

          <>

            {activeSection ===
              "dashboard" &&
              renderDashboard()}


            {activeSection ===
              "users" &&
              renderUsers()}


            {activeSection ===
              "donations" &&
              renderDonations()}


            {activeSection ===
              "volunteers" &&
              renderVolunteers()}


            {activeSection ===
              "receivers" &&
              renderReceivers()}

          </>

        )}

      </main>

    </div>

  );

}


export default AdminDashboard; 