function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">

      <div className="mb-4 text-3xl">
        {icon}
      </div>

      <h3 className="text-gray-500">
        {title}
      </h3>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}

export default SummaryCard;