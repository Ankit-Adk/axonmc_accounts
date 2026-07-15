# Axon MC Accounts - Offline Accounting

Axon MC Accounts is an admin-only accounting dashboard that runs entirely in the browser. It needs no server, database, package installation, or internet connection.

## Start

Open [index.html](index.html) directly in a modern browser.

Open [index.html](index.html) directly in a modern browser. The app opens directly to the admin dashboard. Use **Manage records** to add, edit, or delete income and expense records, and to import or export a JSON backup.

## Storage

Transactions and theme preference are saved in the browser's `localStorage`. Export a JSON backup before clearing browser data or moving to another device. Importing a backup replaces all current accounting records.

## Discord backups

In **Manage records**, paste a Discord channel webhook URL and select **Save webhook**. Every record create, edit, delete, and backup restore then sends the latest JSON backup to that channel. The webhook URL is stored only in that browser's local storage; treat it like a password and do not share it.
