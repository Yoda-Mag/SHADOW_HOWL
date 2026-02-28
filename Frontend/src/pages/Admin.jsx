import React, { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingSignalId, setProcessingSignalId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ===============================
     FETCH USERS / SIGNALS
  =============================== */
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      if (activeTab === "users") {
        const res = await fetch(`${API_URL}/admin/users`, { headers });
        const data = await res.json();
        if (res.ok) setUsers(data);
      } else {
        const res = await fetch(`${API_URL}/admin/signals`, { headers });
        const data = await res.json();
        if (res.ok) setSignals(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ===============================
     USER SUBSCRIPTION TOGGLE
  =============================== */
  const handleUserToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      fetchData();
    } catch (err) {
      console.error("User toggle error:", err);
    }
  };

  /* ===============================
     SIGNAL CRUD
  =============================== */
  const deleteSignal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this signal?")) return;

    try {
      await fetch(`${API_URL}/admin/signals/${id}`, {
        method: "DELETE",
        headers,
      });

      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleApproval = async (signalId) => {
    setProcessingSignalId(signalId);

    try {
      await fetch(`${API_URL}/admin/signals/${signalId}/approve`, {
        method: "PATCH",
        headers,
      });

      fetchData();
    } catch (err) {
      console.error("Approval toggle error:", err);
    } finally {
      setProcessingSignalId(null);
    }
  };

  /* ===============================
     SIGNAL MODAL SUBMIT
  =============================== */
  const handleSubmitSignal = async (formData) => {
    const endpoint = editingSignal
      ? `/admin/signals/${editingSignal.id}`
      : `/admin/signals`;

    const method = editingSignal ? "PUT" : "POST";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingSignal(null);
        fetchData();
      }
    } catch (err) {
      console.error("Signal save error:", err);
    }
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Dashboard</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("signals")}>Signals</button>
      </div>

      {loading && <p>Loading...</p>}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.status}</td>
                <td>
                  <button
                    onClick={() =>
                      handleUserToggle(user.id, user.status)
                    }
                  >
                    Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* SIGNALS TAB */}
      {activeTab === "signals" && (
        <>
          <button
            onClick={() => {
              setEditingSignal(null);
              setShowModal(true);
            }}
            style={{ marginBottom: "20px" }}
          >
            Create Signal
          </button>

          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr key={signal.id}>
                  <td>{signal.id}</td>
                  <td>{signal.title}</td>
                  <td>{signal.description}</td>
                  <td>{signal.approved ? "Yes" : "No"}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingSignal(signal);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteSignal(signal.id)}
                      style={{ marginLeft: "10px" }}
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => toggleApproval(signal.id)}
                      disabled={processingSignalId === signal.id}
                      style={{ marginLeft: "10px" }}
                    >
                      {processingSignalId === signal.id
                        ? "Processing..."
                        : "Toggle Approval"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* SIMPLE MODAL */}
      {showModal && (
        <SignalModal
          initialData={editingSignal}
          onClose={() => {
            setShowModal(false);
            setEditingSignal(null);
          }}
          onSubmit={handleSubmitSignal}
        />
      )}
    </div>
  );
}

/* ===============================
   SIGNAL MODAL COMPONENT
=============================== */
function SignalModal({ initialData, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{ background: "#00000099", padding: "50px" }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: "#fff", padding: "20px" }}
      >
        <h3>{initialData ? "Edit Signal" : "Create Signal"}</h3>

        <input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <br />
        <br />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <br />
        <br />

        <button type="submit">Save</button>
        <button type="button" onClick={onClose} style={{ marginLeft: 10 }}>
          Cancel
        </button>
      </form>
    </div>
  );
}