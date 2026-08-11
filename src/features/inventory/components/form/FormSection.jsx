function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-gray-800">
          {title}
        </h2>


        {description && (
          <p className="mt-2 text-sm text-gray-500">
            {description}
          </p>
        )}

      </div>


      <div className="space-y-5">
        {children}
      </div>

    </section>
  );
}

export default FormSection;