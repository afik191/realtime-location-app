import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { FaLocationPin } from "react-icons/fa6";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function MainNavBar({ user, onAuthClick, onLogout, onJoinGroup }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNav = (path) => {
    navigate(path);
    setIsOpen(false);
    setShowMenu(false);
  };

  return (
    <nav className="w-full fixed top-0 z-[999] bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => handleNav("/")}
          aria-label="Go to home"
        >
          <FaLocationPin className="text-blue-600 w-6 h-6" />
          <span className="text-blue-700 text-xl font-extrabold tracking-tight">LiveLocation</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-700 items-center select-none">
          <button onClick={() => handleNav("/")} className="hover:text-blue-600 transition">
            Home
          </button>
          <button onClick={() => handleNav("/map")} className="hover:text-blue-600 transition">
            Map
          </button>
          {user && (
            <button
              onClick={onJoinGroup}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm"
            >
              Join Group
            </button>
          )}
        </div>

        {/* Avatar or Auth Button */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <div
            className="w-9 h-9 rounded-full border-2 border-blue-400 bg-blue-50 flex items-center justify-center shadow hover:scale-105 transition cursor-pointer overflow-hidden"
            onClick={() => setShowMenu((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowMenu((v) => !v);
            }}
            aria-label="User menu"
          >
            {user?.avatar ? (
              <img
                src={`https://realtime-location-app.onrender.com/uploads/${user.avatar}`}
                alt="User Avatar"
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <FaUser className="text-blue-600 w-5 h-5" />
            )}
          </div>

          {showMenu && user && (
           <div className="absolute top-12 right-0 w-40 bg-white rounded-md shadow-lg border border-blue-100 py-2 z-50">
    <div className="px-4 py-1 text-gray-600 text-xs font-semibold border-b">
      {user.name}
    </div>
    <button
      onClick={() => handleNav("/settings")}
      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm"
    >
      Settings
    </button>
    <button
      onClick={onLogout}
      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm"
    >
      Logout
    </button>
  </div>
          )}

          {!user && (
            <button
              onClick={onAuthClick}
              className="hidden md:inline-block bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition shadow focus:outline-none"
            >
              Sign In
            </button>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 ml-2 hover:text-blue-600 transition focus:outline-none"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 py-4 space-y-3 text-sm font-medium bg-white/95 border-t border-blue-100 shadow backdrop-blur-sm">
          <button onClick={() => handleNav("/")} className="block w-full text-left hover:text-blue-600 transition">
            Home
          </button>
          <button onClick={() => handleNav("/map")} className="block w-full text-left hover:text-blue-600 transition">
            Map
          </button>
          {user && (
            <button onClick={() => { onJoinGroup(); setIsOpen(false); }} className="block w-full text-left hover:text-blue-600 transition">
              Join Group
            </button>
          )}
          {!user && (
            <button
              onClick={() => { onAuthClick(); setIsOpen(false); }}
              className="w-full bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
