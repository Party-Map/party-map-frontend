import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/styles/base.scss";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createKeycloakClient } from "@/auth/keycloak";

import { App } from "./app";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

createRoot(container).render(
    <StrictMode>
        <App authClient={createKeycloakClient()} />
    </StrictMode>,
);
