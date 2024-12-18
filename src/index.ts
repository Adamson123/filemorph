#!/usr/bin/env node

import list from "./commands/list/list.js";
const [command] = process.argv.slice(2);
switch (command) {
  case "list":
    await list();
    break;
  default:
    console.log("Please enter command");
    break;
}
