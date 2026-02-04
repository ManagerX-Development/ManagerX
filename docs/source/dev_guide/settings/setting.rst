Settings
========

This section will your help with the settings of ManagerX.

Configuration
-------------

ManagerX can be configured using environment variables or a configuration file. Follow these steps to set up your environment:

1. **Environment Variables**: Create a `.env` file in the root directory of the project.
2. **Define Settings**: Add the required configuration keys as shown below.

Required Settings
~~~~~~~~~~~~~~~~~

.. list-table::
   :widths: 20 60 20
   :header-rows: 1

   * - Setting
     - Description
     - Example
   * - ``TOKEN``
     - The authentication token for the bot.
     - ``your-bot-token``
   * - ``WEATHER_API``
     - The API key for the weather service.
     - ``your-weather-api-key``
   * - ``DISCORD_CLIENT_ID``
     - The client ID for the bot.
     - ``your-client-id``
   * - ``DISCORD_CLIENT_SECRET``
     - The client secret for the bot.
     - ``your-client-secret``
   * - ``DISCORD_REDIRECT_URI``
     - The redirect URI for the bot.
     - ``your-redirect-uri``

Applying Changes
~~~~~~~~~~~~~~~~

After updating your settings, restart the ManagerX service to ensure all changes are loaded correctly.
