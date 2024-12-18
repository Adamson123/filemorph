import fs from "fs";
import path from "path";
import chalk from "chalk";
import CliTable3 from "cli-table3";
import stripAnsi from "strip-ansi";
import timestampLogger from "../utils/timestampLogger.js";
//TODO : only a directory can be specified for --outDir
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
let flag = false;
const outputContentToFile = (contents, directory) => {
    fs.writeFileSync(directory, `
    ${stripAnsi(contents)} 
   
    `, flag ? { flag: "a" } : { flush: true });
    flag = true;
};
/**
 * Filters out files specified by the user
 */
const filterContents = (extensionString, contents, exclude, directory) => {
    const extensions = extensionString
        ? new Set(extensionString.split(","))
        : new Set([]);
    return contents.filter((content) => {
        try {
            const dirPath = path.resolve(directory, content);
            const isDirectory = fs.lstatSync(dirPath).isDirectory();
            if ((!isDirectory && !extensions.has(path.extname(content))) ||
                (isDirectory && !exclude.has(path.basename(content)))) {
                return true;
            }
        }
        catch (error) {
            throw new Error(error.message + " Error occurred when filtering contents");
        }
    });
};
const logContents = (directory, contents, outDir) => {
    const table = new CliTable3({
        head: [chalk.bold.blue(directory)],
        style: {
            head: ["name"],
        },
    });
    if (contents.length) {
        contents.forEach((content, index) => {
            try {
                const dirPath = path.join(directory, content);
                const isDirectory = fs.lstatSync(dirPath).isDirectory();
                const contentName = path.basename(content);
                let coloredContentName;
                if (isDirectory) {
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
        outDir && outputContentToFile(tableToString, outDir);
        return tableToString;
    }
    else {
        table.push([chalk.yellow("⚠ No contents were found")]);
        const tableToString = table.toString();
        console.log(tableToString);
        outDir && outputContentToFile(tableToString, outDir);
        return tableToString;
    }
};
const logContentCount = (fileCount, folderCount) => {
    console.log(`
${fileCount} ${chalk.magenta.yellow("📄 Files")} 
${folderCount} ${chalk.blueBright.bold("📁 Folders")}
  `);
};
const countContents = (contents, fileCount, folderCount, directory, exclude) => {
    contents.forEach((content) => {
        try {
            const subDirectory = path.join(directory, content);
            const stat = fs.lstatSync(subDirectory);
            if (stat.isDirectory() && !exclude.has(content)) {
                folderCount++;
            }
            else {
                if (!stat.isDirectory())
                    fileCount++;
            }
        }
        catch (error) {
            throw new Error(error.message + " Error occurred when searching for contents");
        }
    });
    return { fileCount, folderCount };
};
const recursivelySearchContents = (contents, directory, exclude, filter, outDir, acc) => {
    contents = filterContents(filter, contents, exclude, directory);
    logContents(directory, contents, outDir);
    contents.forEach((content) => {
        try {
            const subDirectory = path.join(directory, content);
            //acc.push(subDirectory);
            const stat = fs.lstatSync(subDirectory);
            if (stat.isDirectory() && !exclude.has(content)) {
                acc.push("folder");
                const contents = fs.readdirSync(subDirectory);
                recursivelySearchContents(contents, subDirectory, exclude, filter, outDir, acc);
            }
            else {
                acc.push("file");
            }
        }
        catch (error) {
            throw new Error(error.message + " Error occurred when searching for contents");
        }
    });
    return acc;
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
        flag = false;
        if (recursive) {
            let fileCount = 0;
            let folderCount = 0;
            const result = recursivelySearchContents(contents, directory, exclude, filter, outDir, []);
            const filesCountResult = result.filter((content) => content === "file");
            logContentCount(filesCountResult.length, result.length - filesCountResult.length);
        }
        else {
            contents = filterContents(filter, contents, exclude, directory);
            logContents(directory, contents, outDir);
            const countResult = countContents(contents, 0, 0, directory, exclude);
            logContentCount(countResult.fileCount, countResult.folderCount);
        }
    }
    catch (error) {
        console.log(chalk.red(error.message));
    }
};
export default timestampLogger(list);
