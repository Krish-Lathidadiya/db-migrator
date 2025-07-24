import { exec } from "child_process";
import dotenv from "dotenv";
import path from "path";
import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import { URL } from "url";

dotenv.config();

const uri = process.env.NEW_DB_URI!;
const backupRoot = path.join(process.cwd(), process.env.BACKUP_PATH || "public/backup");

// 1. Extract database name from NEW_DB_URI (for default suggestion)
let defaultDatabaseName: string;
try {
  const url = new URL(uri);
  defaultDatabaseName = url.pathname.replace("/", ""); // Extract database name from URI path
  if (!defaultDatabaseName) {
    throw new Error("No database name found in NEW_DB_URI");
  }
} catch (err: any) {
  console.error(chalk.red("❌ Invalid NEW_DB_URI or no database name specified:"), err.message);
  process.exit(1);
}

// 2. Ensure backup root exists
if (!fs.existsSync(backupRoot)) {
  console.error(chalk.red(`❌ Backup folder not found at: ${backupRoot}`));
  process.exit(1);
}

// 3. Read available backup folders
const availableBackups = fs
  .readdirSync(backupRoot, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

if (availableBackups.length === 0) {
  console.log(chalk.red("⚠️ No backup folders found to restore."));
  process.exit(1);
}

// 4. Prompt user to select a backup folder and database subdirectory
async function promptDatabaseSubdirectory(selectedBackupPath: string): Promise<string> {
  const subdirectories = fs
    .readdirSync(selectedBackupPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  if (subdirectories.length === 0) {
    console.error(chalk.red(`❌ No database subdirectories found in backup folder: ${selectedBackupPath}`));
    process.exit(1);
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "databaseName",
      message: `📚 Enter the database subdirectory name to restore (default: ${defaultDatabaseName}):`,
      default: defaultDatabaseName,
      validate: (input) => {
        const databaseBackupPath = path.join(selectedBackupPath, input);
        if (!fs.existsSync(databaseBackupPath)) {
          return `❌ Database subdirectory '${input}' not found in backup folder. Please enter a valid name.`;
        }
        return true;
      },
    },
  ]);

  return answers.databaseName;
}

inquirer
  .prompt([
    {
      type: "list",
      name: "selectedFolder",
      message: "📂 Select a backup folder to restore:",
      choices: availableBackups,
    },
  ])
  .then(async (answers) => {
    const selectedBackupPath = path.join(backupRoot, answers.selectedFolder);

    // 5. Prompt for database subdirectory
    const databaseName = await promptDatabaseSubdirectory(selectedBackupPath);
    const databaseBackupPath = path.join(selectedBackupPath, databaseName);

    console.log(chalk.yellow("♻️ Starting restore from:"), selectedBackupPath);
    console.log(chalk.yellow("📚 Restoring database subdirectory:"), databaseName);

    // 6. Construct mongorestore command with --nsInclude
    const command = `mongorestore --uri="${uri}" --nsInclude="${databaseName}.*" --drop "${databaseBackupPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red("❌ Restore failed:"), error.message);
        console.error(chalk.gray(stderr));
        return;
      }
      console.log(chalk.green("✅ Restore completed!"));
      console.log(chalk.gray(stdout || stderr));
    });
  })
  .catch((err) => {
    console.error(chalk.red("🛑 Restore aborted due to error:"), err);
  });