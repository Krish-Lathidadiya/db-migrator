import { exec } from "child_process";
import dotenv from "dotenv";
import path from "path";
import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";

dotenv.config();

const uri = process.env.OLD_DB_URI!;
const backupRoot = path.join(process.cwd(), process.env.BACKUP_PATH || "public/backup");

if (!fs.existsSync(backupRoot)) {
    fs.mkdirSync(backupRoot, { recursive: true });
    console.log(chalk.gray(`📁 Created backup root at: ${backupRoot}`));
}

async function promptForUniqueFolder(): Promise<string> {
    while (true) {
        const { label } = await inquirer.prompt([
            {
                type: "input",
                name: "label",
                message: "📛 Enter a name for this backup (e.g., 'before-migration'):",
                default: "backup",
            },
        ]);

        const trimmedLabel = label.trim().replace(/\s+/g, "-").toLowerCase();
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .replace("T", "_")
            .split("Z")[0];

        const folderName = `${trimmedLabel}-${timestamp}`;
        const fullPath = path.join(backupRoot, folderName);

        if (fs.existsSync(fullPath)) {
            console.log(chalk.red(`❌ A backup with name "${folderName}" already exists.`));
            const { tryAgain } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "tryAgain",
                    message: "🔁 Do you want to enter a different name?",
                    default: true,
                },
            ]);
            if (!tryAgain) {
                throw new Error("Backup canceled by user.");
            }
        } else {
            return folderName;
        }
    }
}

async function runBackup() {
    try {
        const folderName = await promptForUniqueFolder();
        const backupPath = path.join(backupRoot, folderName);

        console.log(chalk.blue("📦 Starting backup to:"), backupPath);

        const command = `mongodump --uri="${uri}" --out="${backupPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(chalk.red("❌ Backup failed:"), error.message);
                return;
            }
            console.log(chalk.green("✅ Backup completed at:"), backupPath);
            console.log(chalk.gray(stdout || stderr));
        });
    } catch (err: any) {
        console.log(chalk.red("🚫 Backup aborted:"), err.message);
    }
}

runBackup();
