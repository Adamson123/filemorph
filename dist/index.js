#!/usr/bin/env node
import list from "./commands/list.js";
const [command] = process.argv.slice(2);
switch (command) {
    case "list":
        list();
        break;
    default:
        console.log("Please enter command");
        break;
}
