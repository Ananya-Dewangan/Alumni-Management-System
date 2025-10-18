import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        await axios.post(
          "http://localhost:5000/api/auth/logout",
          {},
          { withCredentials: true } // ✅ include cookies
        );
        navigate("/auth"); // redirect after logout
      } catch (err) {
        console.error("Logout error:", err.response?.data || err.message);
        alert(err.response?.data?.msg || "Error logging out");
        navigate("/auth"); // still redirect to login even if error
      }
    };

    logout();
  }, [navigate]);

  return null; // nothing to render
}
