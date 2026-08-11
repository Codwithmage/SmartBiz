function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg bg-white p-6 shadow ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;