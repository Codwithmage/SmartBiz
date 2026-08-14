import { createContext, useContext } from "react";

// 1. Context Object
export const NotificationContext = createContext(null);

// 2. Custom Hook
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}