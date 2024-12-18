import fs from "fs";
import path from "path";
import chalk from "chalk";
import CliTable3 from "cli-table3";
import stripAnsi from "strip-ansi";
import timestampLogger from "../../utils/timestampLogger.js";
//TODO : only a directory can be specified for --outDir
//TODO : use promise all for filterContents
//TODO : filterContents should be the only check if content is directory
//TODO : fileCount and folderCount should be global
//TODO : Cross check no recur mode
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
const filterContents = async (extensionToFilterString, contents, directoryToExclude, directory) => {
    const extensionsToFilter = extensionToFilterString
        ? new Set(extensionToFilterString.split(","))
        : new Set([]);
    const contentsPromise = contents.map((content) => {
        try {
            const contentPath = path.resolve(directory, content);
            return fs.promises.lstat(contentPath);
        }
        catch (error) {
            throw new Error(error.message + " Error occurred when filtering contents");
        }
    });
    const resolvedContentsPromise = await Promise.all(contentsPromise);
    return contents
        .map((content, index) => {
        try {
            const contentPath = path.resolve(directory, content);
            const isDirectory = resolvedContentsPromise[index].isDirectory(); //fs.lstatSync(contentPath).isDirectory();
            if (!isDirectory && !extensionsToFilter.has(path.extname(content))) {
                fileCount++;
                return { contentPath, type: "file" };
            }
            else if (isDirectory &&
                !directoryToExclude.has(path.basename(content))) {
                folderCount++;
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
const logContentCount = (fileCount, folderCount) => {
    console.log(`
${fileCount} ${chalk.magenta.yellow("📄 Files")} 
${folderCount} ${chalk.blueBright.bold("📁 Folders")}
  `);
};
const recursivelySearchContents = async (contents, directory, exclude, filter, outDir) => {
    contents = (await filterContents(filter, contents, exclude, directory));
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
const list = async () => {
    const options = {};
    const processArgv = process.argv;
    processArgv.forEach((option, index) => {
        if (validOptions.has(option)) {
            const fieldValue = processArgv[index + 1];
            if (!validOptions.has(fieldValue)) {
                options[option] = processArgv[index + 1];
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
            outDir && fs.writeFileSync(outDir, logAcc);
            logAcc = "";
            logContentCount(fileCount, folderCount);
        }
        else {
            const result = (await filterContents(filter, contents, exclude, directory));
            logContents(directory, result);
            outDir && fs.writeFileSync(outDir, logAcc);
            logAcc = "";
            logContentCount(fileCount, folderCount);
        }
        fileCount = 0;
        folderCount = 0;
    }
    catch (error) {
        console.log(chalk.red(error.message));
    }
};
export default timestampLogger(list);
