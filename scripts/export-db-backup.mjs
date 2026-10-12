import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is unavailable");

const parsed = new URL(databaseUrl);
const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
if (!database) throw new Error("Database name is missing from DATABASE_URL");

const workdir = mkdtempSync(join(tmpdir(), "birthday-bistro-db-"));
const configPath = join(workdir, "client.cnf");
const outputPath = "/home/ubuntu/final-delivery/database-backup.sql";
const temporaryOutputPath = `${outputPath}.tmp`;
const config = [
  "[client]",
  `host=${parsed.hostname}`,
  `port=${parsed.port || "3306"}`,
  `user=${decodeURIComponent(parsed.username)}`,
  `password=${decodeURIComponent(parsed.password)}`,
  "ssl-mode=REQUIRED",
].join("\n");

try {
  writeFileSync(configPath, `${config}\n`, { mode: 0o600 });
  chmodSync(configPath, 0o600);
  execFileSync("mysqldump", [
    `--defaults-extra-file=${configPath}`,
    "--skip-lock-tables",
    "--routines",
    "--events",
    "--no-tablespaces",
    "--skip-comments",
    "--result-file", temporaryOutputPath,
    database,
  ], { stdio: "inherit" });
  renameSync(temporaryOutputPath, outputPath);
} finally {
  rmSync(temporaryOutputPath, { force: true });
  rmSync(workdir, { recursive: true, force: true });
}
