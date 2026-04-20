==========================
🏗️ System Architecture
==========================

ManagerX is built with a modern, decoupled architecture to ensure scalability and ease of development.

1. High-Level Overview
======================

The system consists of three main components:

- **Discord Bot (The Core):** Written in Python using `py-cord`. It handles all interactions with Discord servers, manages the local/MariaDB database, and executes commands.
- **REST API (The Bridge):** A FastAPI server integrated directly into the bot process. It provides live data (Uptime, Stats, Guild settings) to the web dashboard.
- **Web Dashboard (The Interface):** A React-based Single Page Application (SPA) that communicates with the API to provide a visual configuration interface.

2. Component Breakdown
======================

Bot Core
--------
- **Cogs (Plugins):** Features are modularly organized in ``src/bot/cogs``. This allows for easy hot-reloading and independent development of features.
- **Database Layer:** Supports both SQLite (for local dev) and MariaDB (for production).
- **EzCord:** A framework wrapper that simplifies UI components (Embeds, Buttons) and provides automatic logging.

API (FastAPI)
-------------
- **Real-time Data:** Uses the bot's internal loop to fetch live shard status and server metrics.
- **Authentication:** Uses Discord OAuth2 to verify user identity and permissions.

Frontend (React)
----------------
- **Framework:** Vite for fast builds and HMR.
- **Styling:** Tailwind CSS with a "Glassmorphism" design system.
- **Components:** Radix UI for accessible primitives and Framer Motion for smooth animations.

3. Execution Flow
=================

1. **User Action:** A user clicks "Save" on the Dashboard.
2. **Frontend:** Sends a POST request to the API with the new configuration.
3. **API:** Validates the authentication token and role permissions.
4. **Bot:** Updates the internal database and applies changes (e.g., updating a welcome message or clearing the warning list).
5. **Discord:** The next time a member joins, the bot retrieves the updated data from the database and executes the new logic.
