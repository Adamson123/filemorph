#!/usr/bin/env node
import list from "./commands/list.js";
import rename from "./commands/rename.js";
import { logTimestamp } from "./utils/logger.js";
const [command] = process.argv.slice(2);
switch (command) {
    case "list":
        await logTimestamp(list)();
        break;
    case "rename":
        logTimestamp(rename)();
        break;
    default:
        console.log("Please enter command");
        break;
}
