// main.jsx — Application entry point
// ====================================
// This file mounts the React app into the DOM.
// The <Dashboard /> page is the entire single-page application.

import React from "react";
import ReactDOM from "react-dom/client";
import Dashboard from "./pages/Dashboard.jsx";
import "./styles/main.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
