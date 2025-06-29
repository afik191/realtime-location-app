import { useState } from "react";
import BeautifulButton from "./button";
import { useNavigate } from "react-router-dom";

async function submit(user, mode) {
  const formPayload = new FormData();
  formPayload.append("email", user.email);
  formPayload.append("password", user.password);

  if (mode === "register") {
    formPayload.append("firstName", user.firstName);
    formPayload.append("lastName", user.lastName);
    if (user.avatar instanceof File) {
      formPayload.append("avatar", user.avatar);
    }
  }

  const response = await fetch(`http://localhost:3000/api/${mode}`, {
    method: "POST",
    body: formPayload,
    credentials: "include",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Something went wrong");
  }

  return result;
}

export default function AuthForm({ setUser }) {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: null,
  });
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      setFormData({ ...formData, avatar: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
      if (name === "password") {
        setPasswordStrength(evaluatePasswordStrength(value));
      }
    }
  };

  const evaluatePasswordStrength = (password) => {
    if (!password) return "";
    if (password.length < 6) return "Weak";
    if (/[A-Z]/.test(password) && /\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
      return "Strong";
    }
    return "Medium";
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!email || !password || (mode === "register" && (!firstName || !lastName || !confirmPassword))) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Invalid email address.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await submit(formData, mode);
      setUser(result.user);
      navigate("/map");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 px-4 relative overflow-hidden">
      {/* Background Blur Circles */}
      <div className="absolute w-96 h-96 bg-blue-300 rounded-full opacity-20 top-[-100px] left-[-100px] blur-3xl z-0"></div>
      <div className="absolute w-96 h-96 bg-purple-300 rounded-full opacity-20 bottom-[-100px] right-[-100px] blur-3xl z-0"></div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-xl z-10 max-w-md w-full p-8 rounded-2xl shadow-2xl border border-gray-200"
      >
        <h2 className="text-primary text-3xl font-bold mb-6 text-center">
          {mode === "login" ? "Log In" : "Register"}
        </h2>

        {mode === "register" && (
          <>
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <label htmlFor="firstName" className="block font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Israel"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="lastName" className="block font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Israeli"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <label htmlFor="avatar" className="block font-medium mb-2">
              Avatar
            </label>
            <input
              type="file"
              id="avatar"
              name="avatar"
              accept="image/*"
              onChange={handleChange}
              className="mb-4"
            />
            {formData.avatar && (
              <img
                src={URL.createObjectURL(formData.avatar)}
                alt="Preview"
                className="w-16 h-16 rounded-full mb-4 object-cover border"
              />
            )}
          </>
        )}

        <label htmlFor="email" className="block font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="w-full p-3 mb-4 border rounded-md focus:ring-2 focus:ring-primary"
          required
        />

        <label htmlFor="password" className="block font-medium mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full p-3 mb-2 border rounded-md focus:ring-2 focus:ring-primary"
          required
        />

        {formData.password && mode === "register" && (
          <p
            className={`text-sm mb-4 font-semibold ${
              passwordStrength === "Strong"
                ? "text-green-600"
                : passwordStrength === "Medium"
                ? "text-yellow-500"
                : "text-red-500"
            }`}
          >
            Password strength: {passwordStrength}
          </p>
        )}

        {mode === "register" && (
          <>
            <label htmlFor="confirmPassword" className="block font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full p-3 mb-4 border rounded-md focus:ring-2 focus:ring-primary"
              required
            />
          </>
        )}

        {error && (
          <p className="text-red-500 text-sm font-medium mb-4" role="alert">
            {error}
          </p>
        )}

        <BeautifulButton type="submit" disabled={loading}>
          {loading
            ? mode === "login"
              ? "Logging in..."
              : "Registering..."
            : mode === "login"
            ? "Log In"
            : "Register"}
        </BeautifulButton>

        <p className="text-sm mt-4 text-center">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-primary font-semibold hover:underline"
          >
            {mode === "login" ? "Register here" : "Log in"}
          </button>
        </p>
      </form>
    </div>
  );
}
