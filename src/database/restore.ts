import { exec } from "child_process";
import dotenv from "dotenv";
import path from "path";
import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";

dotenv.config();

const uri = process.env.NEW_DB_URI!;
const backupRoot = path.join(process.cwd(), process.env.BACKUP_PATH || "public/backup");

// 1. Ensure backup root exists
if (!fs.existsSync(backupRoot)) {
  console.error(chalk.red(`❌ Backup folder not found at: ${backupRoot}`));
  process.exit(1);
}

// 2. Read available backup folders
const availableBackups = fs
  .readdirSync(backupRoot, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

if (availableBackups.length === 0) {
  console.log(chalk.red("⚠️ No backup folders found to restore."));
  process.exit(1);
}

// 3. Prompt user to select a folder
inquirer
  .prompt([
    {
      type: "list",
      name: "selectedFolder",
      message: "📂 Select a backup folder to restore:",
      choices: availableBackups,
    },
  ])
  .then((answers) => {
    const selectedBackupPath = path.join(backupRoot, answers.selectedFolder);

    console.log(chalk.yellow("♻️ Starting restore from:"), selectedBackupPath);

    const command = `mongorestore --uri="${uri}" "${selectedBackupPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red("❌ Restore failed:"), error.message);
        return;
      }
      console.log(chalk.green("✅ Restore completed!"));
      console.log(chalk.gray(stdout || stderr));
    });
  })
  .catch((err) => {
    console.error(chalk.red("🛑 Restore aborted due to error:"), err);
  });
