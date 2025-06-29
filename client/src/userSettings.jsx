import { useState, useEffect } from "react";
import { Camera } from "lucide-react";

export default function UserSettings({ user, setUser }) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (avatar) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(avatar);
    } else {
      setAvatarPreview("");
    }
  }, [avatar]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // שליחת שדות ששונו בלבד
    if (firstName.trim() !== user?.firstName) {
      formData.append("firstName", firstName.trim());
    }

    if (lastName.trim() !== user?.lastName) {
      formData.append("lastName", lastName.trim());
    }

    if (avatar) {
      if (avatar.size > 2 * 1024 * 1024) {
        setMessage("❌ Avatar file too large (max 2MB)");
        return;
      }
      formData.append("avatar", avatar);
    }

    // אם אין שינוי – החזר הודעה
    if (formData.entries().next().done) {
      setMessage("Nothing to update");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("https://realtime-location-app.onrender.com/api/userSettings", {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Update failed");
      }

      const data = await res.json();

      // השרת מחזיר payload בשם 'user'
      setUser(data.user);
      setMessage("✅ Profile updated successfully");
      setAvatar(null);
      setAvatarPreview("");
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center mt-10 text-gray-600">Loading user...</div>;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: `radial-gradient(circle at top left, #60a5fa, transparent 30%),
                     radial-gradient(circle at bottom right, #3b82f6, transparent 40%),
                     linear-gradient(135deg, #bae6fd 0%, #2563eb 100%)`,
        backgroundBlendMode: "screen",
      }}
    >
      <div className="w-full max-w-xl bg-white bg-opacity-90 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-blue-200">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Account Settings</h1>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block font-medium text-gray-800 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block font-medium text-gray-800 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block font-medium text-gray-800 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="avatar"
                className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 transition"
              >
                <Camera className="w-4 h-4" />
                Upload New
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAvatar(e.target.files[0])}
              />
              {(avatarPreview || user?.avatar) && (
                <img
                  src={avatarPreview || `https://realtime-location-app.onrender.com/uploads/${user.avatar}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border object-cover shadow"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          {/* Feedback Message */}
          {message && (
            <p
              className={`text-center text-sm mt-3 ${
                message.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
