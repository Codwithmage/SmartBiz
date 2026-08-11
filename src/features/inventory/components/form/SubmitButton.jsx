function SubmitButton({
  loading = false,
  children = "Save",
  loadingText = "Saving...",
  disabled = false,
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`
        flex w-full items-center justify-center
        rounded-lg px-6 py-3
        font-semibold text-white
        transition

        ${
          loading || disabled
            ? "cursor-not-allowed bg-gray-400"
            : "bg-blue-600 hover:bg-blue-700"
        }
      `}
    >
      {loading && (
        <svg
          className="mr-2 h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />

          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}

      {loading ? loadingText : children}
    </button>
  );
}

export default SubmitButton;