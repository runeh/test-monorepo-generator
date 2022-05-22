const { mkdir, writeFileSync, mkdirSync } = require("fs");
const { existsSync } = require("fs");
const { join, resolve } = require("path");

const pkgName = process.env.npm_package_name;
const task = process.env.npm_lifecycle_event;
const rawDuration = Number(process.argv[2]);
const duration = isNaN(rawDuration) ? 0 : rawDuration;

const dirPath = resolve(__dirname, "packages", pkgName, "dist");
const logPath = join(dirPath, `${task}-log.txt`);

console.log(task, pkgName, "starting");

if (task === "build") {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath);
  }
  writeFileSync(logPath, `Built ${pkgName}`, "utf-8");
}

setTimeout(() => {
  console.log("done");
}, duration);

console.log(task, pkgName, "end");
