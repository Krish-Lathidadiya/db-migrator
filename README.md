# 🛠️ MongoDB Migrator CLI

A simple Node.js CLI tool to **backup** and **restore** MongoDB databases using `mongodump` and `mongorestore`, with a clean interactive interface.

---

## 🎯 Purpose

This project was created to:
- Easily export collections or full databases from one MongoDB instance.
- Allow restoring backed-up data to a new MongoDB database.
- Interactively choose which database to back up or restore.
- Save backups in a structured folder (`public/backup/`).
- Be developer-friendly with colored logs and clear prompts.

---

## ⚙️ Features

- 🌐 Supports any MongoDB URI (including username/password).
- ✅ Select database interactively from CLI.
- 💾 Backs up database into a local `public/backup/` directory.
- 🔁 Restores the selected backup to a new database with `_restored` suffix.
- 🎨 Beautiful CLI UX using `chalk` and `inquirer`.

---

## 🔧 Technologies / Packages Used

| Package     | Purpose                                                                 |
|-------------|-------------------------------------------------------------------------|
| `dotenv`    | To load MongoDB URIs securely from `.env` file                          |
| `inquirer`  | For prompting user input and actions via interactive CLI                |
| `chalk`     | For styling and coloring console outputs to improve readability         |
| `child_process` | To run system-level `mongodump` and `mongorestore` commands         |
| `fs`        | File system access to check/create backup folders                       |

---


