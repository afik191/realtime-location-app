import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import MainNavBar from "./navbar";
import AuthForm from "./authform";
import HomePage from "./homePage";
import MyMap from "./map";
import GroupJoin from "./groupJoin";
import UserSettings from "./userSettings";

function App() {
  const [user, setUser] = useState(null);
  const [groupId, setGroupId] = useState(localStorage.getItem("groupId") || null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingGroupId, setLoadingGroupId] = useState(true);
  const navigate = useNavigate();

  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("https://realtime-location-app.onrender.com/api/me", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  
  useEffect(() => {
    const fetchGroupsAndSetFirst = async () => {
      if (user && !groupId) {
        try {
          const res = await fetch("https://realtime-location-app.onrender.com/api/groups", {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch groups");
          const data = await res.json();

          if (data.groups.length > 0) {
            const firstId = data.groups[0]._id.toString();
            setGroupId(firstId);
            localStorage.setItem("groupId", firstId);
          }
        } catch (err) {
          console.error("Failed to load groups:", err);
        } finally {
          setLoadingGroupId(false);
        }
      } else {
        setLoadingGroupId(false); 
      }
    };

    fetchGroupsAndSetFirst();
  }, [user, groupId]);

 
  useEffect(() => {
    if (!loadingUser && !loadingGroupId && user && groupId) {
      navigate("/map");
    }
  }, [user, groupId, loadingUser, loadingGroupId]);

  const handleLogout = async () => {
    try {
      await fetch("https://realtime-location-app.onrender.com/api/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setGroupId(null);
      localStorage.removeItem("groupId");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      <MainNavBar
        user={user}
        onAuthClick={() => navigate("/auth")}
        onLogout={handleLogout}
        onJoinGroup={() => navigate("/group")}
      />

      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/auth" element={<AuthForm setUser={setUser} />} />
        <Route
          path="/map"
          element={
            loadingUser || loadingGroupId ? (
              <div className="pt-20 text-center text-gray-500 font-medium text-lg">
                Loading...
              </div>
            ) : user && groupId ? (
              <MyMap setGroupId={setGroupId} />
            ) : (
              <div className="pt-20 text-center text-red-600 font-bold text-xl">
                ⚠️ You must be logged in and join a group.
              </div>
            )
          }
        />
        <Route path="/group" element={<GroupJoin setGroupId={setGroupId} />} />
        <Route path="/settings" element={<UserSettings user={user} setUser={setUser} />} />
      </Routes>
    </>
  );
}

export default App;
