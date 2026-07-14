# Axon MC Accounts - Offline Accounting

Axon MC Accounts is a complete accounting dashboard that runs entirely in the browser. It needs no server, database, package installation, or internet connection.

## Start

Open [index.html](index.html) directly in a modern browser.

The first launch creates the local administrator account:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `adhikariankit45@gmail.com` | `1234567890` |

Administrators can add, edit, and delete income and expense records, and import/export the complete JSON backup. New users can register from the login page; they can view, search, and filter records but cannot change them.

## Storage

All accounts, roles, transactions, and theme preference are saved in the browser's `localStorage`. Export a JSON backup before clearing browser data or moving to another device. Importing a backup replaces all current local Axon MC Accounts data.

Because this is a client-only application, credentials are demonstration credentials stored locally in the browser, not secure server-side accounts. Do not use sensitive real-world passwords or financial data in a shared browser profile.
