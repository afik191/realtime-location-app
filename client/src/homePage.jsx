import { MapPinned } from "lucide-react";
import location_pin from './assets/location_pin.svg';
import { useNavigate } from "react-router-dom";

export default function HomePage({ user }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (user) {
      navigate("/map");
    } else {
      navigate("/auth");
    }
  };

  return (
    <main className="flex-grow bg-white">
      <section
        id="HeroSection"
        className="py-20 md:py-32 bg-blue-50 min-h-screen flex flex-col justify-center"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            {/* Text Section */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-6 leading-tight">
                Welcome to{" "}
                <span className="text-blue-500">RealTime Location 📍</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                Track and share your location in real time with friends and
                family. Perfect for coordination, safety, and fun!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-center sm:justify-start justify-center">
                <button
                  className="w-full sm:w-auto bg-blue-600 text-white inline-flex items-center justify-center gap-2 text-base font-medium h-12 px-6 rounded-md shadow-md hover:bg-blue-700 transition"
                  onClick={handleClick}
                >
                  <MapPinned className="w-5 h-5" />
                  {user ? "Go to Map" : "Start Tracking"}
                </button>
              </div>
            </div>

            {/* Illustration */}
            <div className="flex justify-center">
              <img
                src={location_pin}
                alt="Real-time map illustration"
                className="max-w-xs md:max-w-sm lg:max-w-md drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
