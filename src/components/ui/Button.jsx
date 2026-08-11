function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  ...props
}) {
  const baseStyle =
    "rounded-lg px-4 py-2 font-medium transition-colors duration-200 focus:outline-none";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",

    secondary:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100",

    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        ${baseStyle}
        ${variants[variant]}
        ${disabled ? "cursor-not-allowed opacity-60" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;