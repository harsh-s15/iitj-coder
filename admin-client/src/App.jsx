import { useState, useEffect } from "react";
import AdminLoginForm from "./components/AdminLoginForm";
import AdminDashboard from "./components/AdminDashboard";
import { login, logout } from "./api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("admin_logged_in") === "true";
  });
  const [user, setUser] = useState(null);

  const handleLogin = async ({ username, password }) => {
    try {
      const data = await login(username, password);
      if (data.role !== "ADMIN") {
        throw new Error("Access Denied: Only admins can login here.");
      }
      setIsLoggedIn(true);
      setUser(data);
      localStorage.setItem("admin_logged_in", "true");
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem("admin_logged_in");
    }
  };

  if (!isLoggedIn) {
    return <AdminLoginForm onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} user={user} />;
}

export default App;
