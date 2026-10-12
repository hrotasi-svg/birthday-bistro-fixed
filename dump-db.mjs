// 產生 database-backup.sql（結構＋資料），供本機獨立部署使用
import mysql from "mysql2/promise";
import fs from "fs";
import "dotenv/config";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [tables] = await conn.query("SHOW TABLES");
const tableNames = tables.map((r) => Object.values(r)[0]);
let out = "-- 壽星餐酒館 Birthday Bistro 資料庫備份\n-- 產生時間: " + new Date().toISOString() + "\n\nSET FOREIGN_KEY_CHECKS=0;\nSET NAMES utf8mb4;\n\n";
for (const t of tableNames) {
  const [[{ "Create Table": ddl }]] = await conn.query("SHOW CREATE TABLE `" + t + "`");
  out += "DROP TABLE IF EXISTS `" + t + "`;\n" + ddl + ";\n\n";
  const [rows] = await conn.query("SELECT * FROM `" + t + "`");
  if (rows.length) {
    const cols = Object.keys(rows[0]);
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const values = chunk
        .map((r) => "(" + cols.map((c) => conn.escape(r[c] instanceof Date ? r[c] : r[c])).join(",") + ")")
        .join(",\n");
      out += "INSERT INTO `" + t + "` (`" + cols.join("`,`") + "`) VALUES\n" + values + ";\n";
    }
    out += "\n";
  }
}
out += "SET FOREIGN_KEY_CHECKS=1;\n";
fs.writeFileSync("/home/ubuntu/final-delivery/database-backup.sql", out);
console.log("done", tableNames.length, "tables,", out.length, "bytes");
await conn.end();
