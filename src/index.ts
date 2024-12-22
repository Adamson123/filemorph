#!/usr/bin/env node

import list from "./commands/list.js";
import rename from "./commands/rename.js";

const [command] = process.argv.slice(2);
switch (command) {
  case "list":
    await list();
    break;
  case "rename":
    rename();
    break;
  default:
    console.log("Please enter command");
    break;
}
