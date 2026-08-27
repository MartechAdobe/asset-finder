import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./styles.css";

import { msalInstance } from "./auth/msalInstance";


async function startApp() {

  await msalInstance.initialize();

  await msalInstance.handleRedirectPromise();

  ReactDOM.createRoot(
    document.getElementById("root")
  ).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}


startApp();