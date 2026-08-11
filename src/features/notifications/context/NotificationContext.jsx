import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const showNotification = ({ type = "success", message }) => {
    setNotification({ type, message });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {notification && (
        <div className="fixed right-5 top-5 z-50">
          <div
            className={`rounded-lg px-5 py-3 text-white shadow-lg ${
              notification.type === "success"
                ? "bg-green-600"
                : "bg-red-600"
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

function useNotification() {
  return useContext(NotificationContext);
}

export { NotificationProvider, useNotification };