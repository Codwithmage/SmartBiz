import Button from "./Button";

function EmptyState({
  title,
  description,
  buttonText,
  onButtonClick,
}) {
  return (
    <div className="rounded-lg border bg-white p-10 text-center">

      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-gray-500">
        {description}
      </p>

      {buttonText && (
        <div className="mt-6">
          <Button onClick={onButtonClick}>
            {buttonText}
          </Button>
        </div>
      )}

    </div>
  );
}

export default EmptyState;