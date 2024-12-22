import fs from "fs";
import path from "path";
import chalk from "chalk";
import CliTable3 from "cli-table3";
import stripAnsi from "strip-ansi";
import timestampLogger from "../../utils/timestampLogger.js";
//TODO : filterAndExcludeContents should be the only check if content is directory
//TODO : Improve error messages
//:
const validOptions = new Set([
    "--dir",
    "--d",
    "--recursive",
    "--r",
    "--filter",
    "--f",
    "--exclude",
    "--outDir",
    "--o",
]);
let logAcc = "";
let fileCount = 0;
let folderCount = 0;
const filterAndExcludeContents = async (extensionToFilterString, contents, directoryToExclude, directory) => {
    const extensionsToFilter = extensionToFilterString
        ? new Set(extensionToFilterString.split(","))
        : new Set([]);
    const contentsStatPromise = contents.map((content) => {
        try {
            const contentPath = path.resolve(directory, content);
            return fs.promises.lstat(contentPath);
        }
        catch (error) {
            throw new Error(error.message + " Error occurred when filtering contents");
        }
    });
    const resolvedContentsStatPromise = await Promise.all(contentsStatPromise);
    return contents
        .map((content, index) => {
        try {
            const isDirectory = resolvedContentsStatPromise[index].isDirectory();
            if (!isDirectory && !extensionsToFilter.has(path.extname(content))) {
                fileCount++;
                const contentPath = path.resolve(directory, content);
                return { contentPath, type: "file" };
            }
            else if (isDirectory &&
                !directoryToExclude.has(path.basename(content))) {
                folderCount++;
                const contentPath = path.resolve(directory, content);
                return { contentPath, type: "folder" };
            }
            else {
                return "";
            }
        }
        catch (error) {
            throw new Error(error.message + " Error occurred when filtering contents");
        }
    })
        .filter(Boolean);
};
/**
 * Logs a directory contents in a table form
 */
const logContents = (directory, contents) => {
    const table = new CliTable3({
        head: [chalk.bold.blue(directory)],
        style: {
            head: ["name"],
        },
    });
    if (contents.length) {
        contents.forEach((content, index) => {
            try {
                const contentName = path.basename(content.contentPath);
                let coloredContentName;
                if (content.type === "folder") {
                    coloredContentName = chalk.blueBright.bold(`[${index + 1}] 📁 ${contentName}`);
                }
                else {
                    coloredContentName = chalk.magenta.yellow(`[${index + 1}] 📄 ${contentName}`);
                }
                //chalk.green(`[${index}]`) + " " +
                table.push([coloredContentName]);
            }
            catch (error) {
                throw new Error(error.message + " Error occurred when logging contents");
            }
        });
        const tableToString = table.toString();
        console.log(tableToString);
        logAcc += `
    ${stripAnsi(tableToString)} `;
        return tableToString;
    }
    else {
        table.push([chalk.yellow("⚠ No contents were found")]);
        const tableToString = table.toString();
        console.log(tableToString);
        logAcc += `
    ${stripAnsi(tableToString)} `;
        return tableToString;
    }
};
/**
 * Logs the amount of files and folders discovered in the directory
 */
const logContentCount = (fileCount, folderCount) => {
    console.log(`
${fileCount} ${chalk.magenta.yellow("📄 Files")} 
${folderCount} ${chalk.blueBright.bold("📁 Folders")}
  `);
};
/**
 * recursively search for contents in directories
 */
const recursivelySearchContents = async (contents, directory, exclude, filter, outDir) => {
    contents = (await filterAndExcludeContents(filter, contents, exclude, directory));
    logContents(directory, contents);
    for (const content of contents) {
        try {
            const subDirectory = path.resolve(directory, content.contentPath);
            if (content.type === "folder") {
                const subContents = fs.readdirSync(subDirectory);
                await recursivelySearchContents(subContents, subDirectory, exclude, filter, outDir);
            }
        }
        catch (error) {
            throw new Error(error.message + " Error occurred when searching for contents");
        }
    }
};
/**
 * Output log to a file in the specified directory
 */
const outputLogToAFile = (outDir) => {
    if (outDir) {
        if (!fs.lstatSync(outDir).isDirectory()) {
            logAcc = "";
            throw new Error("Error please specify a directory as an output path for the log file");
        }
        fs.writeFileSync(`${outDir}/list-log-${new Date().getTime()}.md`, logAcc);
        logAcc = "";
    }
};
/**
 * List files in a dir base on provided options
 */
const list = async () => {
    const options = {};
    const processArgv = process.argv;
    processArgv.forEach((option, index) => {
        if (validOptions.has(option)) {
            const nextField = processArgv[index + 1];
            if (!validOptions.has(nextField) ||
                option === "--recursion" ||
                option === "--r") {
                options[option] = nextField;
                //As far as --recursion or --r is included among the options with or without a value, go recursive mode!!!
                if (option === "--recursion" || option === "--r")
                    options[option] = "true";
            }
        }
    });
    try {
        const directory = options["--dir"] || options["--d"] || process.cwd();
        const recursive = options["--recursive"] || options["--r"];
        const filter = options["--filter"] || options["--f"];
        let exclude = options["--exclude"];
        exclude = exclude ? new Set(exclude.split(",")) : new Set([]);
        const outDir = options["--outDir"] || options["--o"];
        if (!directory) {
            throw { error: "Please specify the directory" };
        }
        let contents = fs.readdirSync(directory);
        if (recursive) {
            await recursivelySearchContents(contents, directory, exclude, filter, outDir);
            logContentCount(fileCount, folderCount);
            outputLogToAFile(outDir);
        }
        else {
            const result = (await filterAndExcludeContents(filter, contents, exclude, directory));
            logContents(directory, result);
            logContentCount(fileCount, folderCount);
            outputLogToAFile(outDir);
        }
        fileCount = 0;
        folderCount = 0;
    }
    catch (error) {
        console.log(chalk.red(error.message));
    }
};
export default timestampLogger(list);
