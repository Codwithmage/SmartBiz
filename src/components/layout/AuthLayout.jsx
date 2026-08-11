function AuthLayout({
  title = "Smart Biz",
  subtitle = "",
  children,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-blue-600">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-gray-600">
              {subtitle}
            </p>
          )}

        </div>

        {children}

      </div>

    </div>
  );
}

export default AuthLayout;