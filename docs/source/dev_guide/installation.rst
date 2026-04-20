=========================
💻 Installation Guide
=========================

This guide explains how to set up a self-hosted instance of ManagerX.

Prerequisites
=============

- **Python:** 3.11 or higher.
- **Node.js:** v18 or higher (for the frontend).
- **Database:** MariaDB (Recommended) or SQLite.
- **Discord Developer Account:** To create your bot application.

1. Clone the Repository
=======================

.. code-block:: bash

   git clone https://github.com/ManagerX-Development/ManagerX.git
   cd ManagerX

2. Backend Setup
================

1. Create a virtual environment:
   
   .. code-block:: bash

      python -m venv .venv
      source .venv/bin/activate  # Windows: .venv\Scripts\activate

2. Install dependencies:

   .. code-block:: bash

      pip install -r requirements/base.txt

3. Configure environment variables:
   Copy ``config/.env.example`` to ``config/.env`` and fill in your:
   - ``TOKEN`` (Discord Bot Token)
   - ``DB_TYPE`` (mariadb or sqlite)
   - ``DB_HOST``, ``DB_USER``, etc.

3. Frontend Setup
=================

1. Install Node dependencies:

   .. code-block:: bash

      npm install

2. Build the production bundle:

   .. code-block:: bash

      npm run build

4. Starting the Bot
===================

Run the main entry point:

.. code-block:: bash

   python main.py

The bot will start, and the FastAPI webserver for the dashboard will run on the configured port (default: 8000).

---

🚀 Production Deployment
========================

For production, we recommend using:
- **PM2** or **Systemd** to keep the bot process alive.
- **Nginx** or **Traefik** as a reverse proxy for the API and static frontend files.
- **MariaDB** for reliable data storage.
