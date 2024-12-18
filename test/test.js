import { execSync } from "child_process";
import fs from "fs";
import stripAnsi from "strip-ansi";

const output = execSync("filemorph list --r true", { encoding: "utf8" });
fs.writeFileSync("output", stripAnsi(output.toString()));

console.log(output);
