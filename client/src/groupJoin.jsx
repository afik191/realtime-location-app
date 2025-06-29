import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, PlusCircle, LogIn } from "lucide-react";

function GroupJoin({ setGroupId }) {
  const [inputId, setInputId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!inputId.trim()) {
      setError("Please enter a valid group ID.");
      return;
    }

    try {
      const joinRes = await fetch(`http://localhost:3000/api/group/${inputId}/join`, {
        method: "POST",
        credentials: "include",
      });

      if (!joinRes.ok) throw new Error("Failed to join group");

      const locationRes = await fetch(
        `http://localhost:3000/api/group/${inputId}/locations`,
        { credentials: "include" }
      );

      if (!locationRes.ok) throw new Error("Group not found or not authorized");

      localStorage.setItem("groupId", inputId);
      setGroupId(inputId);
      navigate("/map");
    } catch (err) {
      setError("Failed to join group: " + err.message);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/group", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });

      if (!res.ok) throw new Error("Failed to create group");

      const data = await res.json();
      const newGroupId = data.groupId;

      localStorage.setItem("groupId", newGroupId);
      setGroupId(newGroupId);
      navigate("/map");
    } catch (err) {
      setError("Error creating group: " + err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-8 shadow-lg"
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
        }}
      >
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center justify-center gap-2">
          <Users className="w-7 h-7 text-indigo-600" />
          Join or Create a Group
        </h1>

        {/* Join Group */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-indigo-500" />
            Join Existing Group
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Group ID"
              value={inputId}
              onChange={(e) => {
                setInputId(e.target.value);
                setError("");
              }}
              className="border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleJoin}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Join
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6 w-full border-t border-gray-300">
          <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-3 text-gray-600 text-sm select-none">
            OR
          </span>
        </div>

        {/* Create Group */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-green-500" />
            Create a New Group
          </h2>
          <input
            type="text"
            placeholder="Enter Group Name"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              setError("");
            }}
            className="border border-gray-300 rounded px-4 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={handleCreate}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition w-full"
          >
            Create Group
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-sm mt-4 select-none"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default GroupJoin;
