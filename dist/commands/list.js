import fs from "fs";
import path from "path";
import chalk from "chalk";
import CliTable3 from "cli-table3";
import stripAnsi from "strip-ansi";
import { Queue } from "../utils/queue.js";
import splitSafely from "../utils/splitSafely.js";
import { FilemorphError } from "../utils/errorHandler.js";
import { listOptions } from "../options/index.js";
import { logContentCount, logError } from "../utils/logger.js";
//TODO : Improve error message
// Variables to track log data
let tableLogAcc = "";
let fileCount = 0;
let folderCount = 0;
/**
 * Filter and exclude contents from a directory.
 */
const getContentsStat = async (contents, directory) => {
    try {
        const contentsStatPromise = contents.map((content) => fs.promises.lstat(path.resolve(directory, content)));
        const resolvedContentsStatPromise = await Promise.all(contentsStatPromise);
        return contents
            .map((content, index) => {
            const isDirectory = resolvedContentsStatPromise[index].isDirectory();
            if (isDirectory) {
                return {
                    path: path.resolve(directory, content),
                    type: "folder",
                    name: path.basename(content),
                    contents: [],
                };
            }
            else {
                return {
                    path: path.resolve(directory, content),
                    type: "file",
                    name: path.basename(content),
                };
            }
        })
            .filter(Boolean);
    }
    catch (error) {
        throw new FilemorphError(`Error occurred while getting files stat: ${error.message}`);
    }
};
const filterAndExcludeContents = async (params) => {
    const { excludeFiles, includeFiles, excludeFolders, includeFolders, contents, directory, } = params;
    try {
        const contentsStat = await getContentsStat(contents, directory);
        return contentsStat
            .map((content) => {
            if (content.type === "folder" &&
                !excludeFolders.has(path.basename(content.path)) &&
                (!includeFolders.size ||
                    includeFolders.has(path.basename(content.path)))) {
                folderCount++;
                return content;
            }
            else if (content.type === "file" &&
                !excludeFiles.has(path.extname(content.path)) &&
                (!includeFiles.size || includeFiles.has(path.extname(content.path)))) {
                fileCount++;
                return content;
            }
            return null;
        })
            .filter(Boolean);
    }
    catch (error) {
        throw new FilemorphError(`Failed to filter and exclude contents: ${error.message}`);
    }
};
/**
 * Log directory contents in a table format.
 */
const logContents = (directory, contents) => {
    const table = new CliTable3({
        head: [chalk.bold.blue(directory)],
        style: { head: ["name"] },
    });
    if (contents.length) {
        contents.forEach((content, index) => {
            const contentName = path.basename(content.path);
            const coloredContentName = content.type === "folder"
                ? chalk.blueBright.bold(`[${index + 1}] 📁 ${contentName}`)
                : chalk.yellow(`[${index + 1}] 📄 ${contentName}`);
            table.push([coloredContentName]);
        });
    }
    else {
        table.push([chalk.yellow("⚠ No contents were found")]);
    }
    const tableToString = table.toString();
    console.log(tableToString);
    tableLogAcc += `\n${stripAnsi(tableToString)}\n`;
};
/**
 * Output logs to a file.
 */
const outputLogToAFile = (outputDir, outputAs, directoryObj) => {
    try {
        if (outputDir) {
            const outputExt = outputAs === "json" ? ".json" : ".md";
            const outputPath = path.resolve(outputDir, `list-log-${Date.now()}${outputExt}`);
            if (outputAs === "json") {
                fs.writeFileSync(outputPath, JSON.stringify(directoryObj, null, 2));
            }
            else {
                fs.writeFileSync(outputPath, tableLogAcc);
            }
            console.log(`Log outputted to ${chalk.magenta.yellow(outputPath)}`);
            tableLogAcc = "";
        }
    }
    catch (error) { }
};
const queue = new Queue();
// Define an async function to iteratively search directory contents
const iterativelySearchContents = async (params) => {
    let { recursive, directory, excludeFiles, includeFiles, excludeFolders, includeFolders, } = params;
    // Create a root directory object
    const rootDir = {
        name: path.basename(directory),
        path: directory,
        type: "folder",
        contents: [],
    };
    queue.enqueue(rootDir); // Add the root directory to the queue
    // Process directories until the queue is empty
    try {
        while (!queue.isEmpty()) {
            const currentDir = queue.dequeue(); // Get the next directory to process
            if (!currentDir)
                continue; // Skip if dequeue returns null (shouldn't happen)
            // Read the contents of the current directory
            const depth = path
                .relative(rootDir.path, currentDir.path)
                .split(path.sep).length;
            //check if the directory we are trying to read from  is in the depth limit
            if (depth > recursive) {
                continue;
            }
            const contents = fs.readdirSync(currentDir.path);
            // Filter and exclude contents based on provided parameters
            const filteredContents = await filterAndExcludeContents({
                excludeFiles,
                excludeFolders,
                includeFiles,
                includeFolders,
                contents,
                directory: currentDir.path,
            });
            // Log the filtered contents of the current directory
            logContents(currentDir.path, filteredContents);
            // Process each item in the filtered contents
            for (const content of filteredContents) {
                if (content.type === "folder") {
                    // If it's a folder, create a new subdirectory object
                    const subDir = {
                        ...content,
                        contents: [],
                    };
                    queue.enqueue(subDir); // Add the subdirectory to the queue for processing
                    currentDir.contents?.push(subDir); // Add subdirectory to current directory's contents
                }
                else {
                    // If it's a file, add it directly to the current directory's contents
                    currentDir.contents?.push(content);
                }
            }
            //  recursive--;
        }
        // Return the root directory object with all processed contents
        return rootDir;
    }
    catch (error) {
        //handleContentAccessError(error, directory);
        throw new FilemorphError(`Error while searching for contents: ${error.message}`);
    }
};
/**
 * Main function to list files and directories.
 */
const list = async (params = null) => {
    const options = listOptions().opts();
    const directory = params?.directory || options.directory || process.cwd();
    let recursive = params?.recursive || options.recursive;
    if (recursive) {
        const canBeConvertedToNum = !isNaN(Number(recursive)) && typeof recursive !== "boolean";
        recursive = canBeConvertedToNum ? Number(recursive) : Infinity;
    }
    //!new
    const excludeFiles = new Set(splitSafely(params?.excludeFiles, options.excludeFiles));
    const includeFiles = new Set(splitSafely(params?.includeFiles, options.includeFiles));
    const excludeFolders = new Set(splitSafely(params?.excludeFolders, options.excludeFolders));
    const includeFolders = new Set(splitSafely(params?.includeFolders, options.includeFolders));
    const outputDir = params?.outputDir || options.outputDir || "";
    const outputAs = params?.outputAs || options.outputAs || "table";
    try {
        let directoryObj;
        if (recursive) {
            directoryObj = (await iterativelySearchContents({
                recursive,
                directory,
                excludeFiles,
                includeFiles,
                excludeFolders,
                includeFolders,
            }));
            logContentCount(fileCount, folderCount);
            outputLogToAFile(outputDir, outputAs, directoryObj);
        }
        else {
            const contents = fs.readdirSync(directory);
            const result = (await filterAndExcludeContents({
                excludeFiles,
                excludeFolders,
                includeFiles,
                includeFolders,
                contents, // as string[],
                directory,
            }));
            logContents(directory, result);
            logContentCount(fileCount, folderCount);
            directoryObj = {
                name: path.basename(directory),
                path: directory,
                type: "folder",
                contents: result,
            };
            outputLogToAFile(outputDir, outputAs, directoryObj);
        }
        fileCount = 0;
        folderCount = 0;
        return { directoryObj };
    }
    catch (error) {
        logError(error);
    }
};
export default list;
