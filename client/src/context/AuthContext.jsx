import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // Check localStorage first, then sessionStorage
  const storedUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  const storedToken =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const [user, setUser] = useState(
    storedUser ? JSON.parse(storedUser) : null
  );

  const [token, setToken] = useState(storedToken || null);

  // Login
  const login = (userData, jwtToken, rememberMe) => {

    setUser(userData);
    setToken(jwtToken);

    const storage = rememberMe
      ? localStorage
      : sessionStorage;

    storage.setItem(
      "user",
      JSON.stringify(userData)
    );

    storage.setItem(
      "token",
      jwtToken
    );
  };

  // Logout
  const logout = () => {

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};