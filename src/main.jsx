import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import router from "./app/router";
import "./index.css";

import AppProviders from "./providers/AppProviders";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppProviders>
    <RouterProvider router={router} />
    <Analytics />
  </AppProviders>
);