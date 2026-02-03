import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Datenschutz from "../pages/Datenschutz";
import "../index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Datenschutz />
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>
);
