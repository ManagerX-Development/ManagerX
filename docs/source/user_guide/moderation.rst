=======================
🛡️ Moderation
=======================

ManagerX provides a suite of advanced moderation tools designed to keep your community safe with minimal manual effort.

1. Anti-Spam System
===================

Our intelligent anti-spam system monitors messages in real-time to detect and prevent disruptive behavior.

- **Fast Message Detection:** Detects users sending too many messages in a short interval.
- **Link Filter:** Blocks unauthorized links and protects against phishing.
- **Caps Filter:** Automatically warns or deletes messages with excessive uppercase letters.
- **Mention Spam:** Prevents users from mass-tagging members or roles.

**Configuration:**
Enabled/Disabled via the **Dashboard -> Anti-Spam** tab.

2. Warning System
=================

ManagerX uses a tiered warning system to handle rule-breakers fairly.

- ``/warn <user> <reason>`` - Issue a formal warning.
- ``/warnings <user>`` - View a user's warning history.
- ``/clearwarn <user>`` - Remove warnings.

**Auto-Mod Actions:**
You can configure "Warn Thresholds" in the Dashboard. For example:
- **3 Warnings:** 1-hour Timeout.
- **5 Warnings:** Temporary Ban (24h).
- **10 Warnings:** Permanent Ban.

3. Triage Tools (Kicks & Bans)
==============================

Classic moderation commands with a focus on speed and logging:

- ``/ban <user> [reason] [delete_messages_days]``
- ``/kick <user> [reason]``
- ``/timeout <user> <duration> [reason]``
- ``/unban <user_id>``

4. Audit Logging
================

The logging system tracks every significant event on your server to ensure accountability.

**Monitored Events:**
- Message edits and deletions.
- Member joins and leaves.
- Role changes.
- Voice channel activity.
- Moderation actions (Warns, Bans, etc.).

**How to Setup Logs:**
1. Create a private channel for logs.
2. Go to **Dashboard -> Logging**.
3. Select your channel and choose which events to track.
