import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Loader from "./loader";
import io from "socket.io-client";
import { ClipboardCopy, Check } from "lucide-react";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const socket = io("https://realtime-location-app.onrender.com", { withCredentials: true });

function MyMap({ setGroupId }) {
  const [position, setPosition] = useState(null);
  const [groupLocations, setGroupLocations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(localStorage.getItem("groupId") || null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [copied, setCopied] = useState(false);

  const sendLocationToServer = async (lat, lng) => {
    try {
      await fetch("https://realtime-location-app.onrender.com/api/location", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
    } catch (err) {
      console.error("Error sending location to server:", err);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const res = await fetch("https://realtime-location-app.onrender.com/api/groups", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch groups");

      const data = await res.json();
      setGroups(data.groups);

      if (!localStorage.getItem("groupId") && data.groups.length > 0) {
        const firstId = data.groups[0]._id.toString();
        setSelectedGroupId(firstId);
        localStorage.setItem("groupId", firstId);
        setGroupId(firstId);
      }

      setLoadingGroups(false);
    } catch (err) {
      console.error(err);
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        sendLocationToServer(coords[0], coords[1]);
      },
      (err) => alert("Error while fetching location: " + err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    fetchUserGroups();

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem("groupId", selectedGroupId);
      setGroupId && setGroupId(selectedGroupId);
      socket.emit("join-group", selectedGroupId);
    }

    const handleLocationUpdate = (data) => {
      setGroupLocations((prev) => {
        const others = prev.filter((loc) => loc.userId !== data.userId);
        return [...others, data];
      });
    };

    socket.on("location-update", handleLocationUpdate);

    return () => {
      socket.off("location-update", handleLocationUpdate);
    };
  }, [selectedGroupId]);

  const handleCopy = () => {
    if (!selectedGroupId) return;
    navigator.clipboard.writeText(selectedGroupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!position || loadingGroups) return <Loader />;

  return (
    <div className="pt-16 h-screen w-full flex flex-col bg-white">
      <div className="p-4 bg-blue-50 shadow-md border-b border-blue-100 flex flex-wrap items-center gap-4 z-10">
        <label htmlFor="groupSelect" className="font-medium text-gray-800">
          Group:
        </label>

        <select
          id="groupSelect"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name} ({group._id})
            </option>
          ))}
        </select>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 animate-pulse" />
              Copied
            </>
          ) : (
            <>
              <ClipboardCopy className="w-4 h-4" />
              Copy ID
            </>
          )}
        </button>
      </div>

      <MapContainer
        center={position}
        zoom={13}
        className="flex-grow w-full"
        style={{ filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.12))" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {groupLocations.map((loc) => (
          <Marker key={loc.userId} position={[loc.lat, loc.lng]}>
            <Popup>
              <strong className="block mb-1 text-blue-600 font-semibold">{loc.name}</strong>
              {loc.avatar && (
                <img
                  src={loc.avatar}
                  alt="avatar"
                  className="w-12 h-12 rounded-full border-2 border-blue-400 shadow-md mt-2"
                />
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MyMap;
