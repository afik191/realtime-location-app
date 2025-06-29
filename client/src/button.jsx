export default function BeautifulButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
        w-full
        bg-primary
        text-blue-300
        font-semibold
        py-3
        rounded-md
        shadow-md
        hover:bg-primaryLight
        hover:shadow-lg
        transition
        duration-300
        ease-in-out
        focus:outline-none
        focus:ring-4
        focus:ring-primaryLight/50
        active:scale-95
      "
    >
      {children}
    </button>
  );
}
