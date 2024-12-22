import fs from "fs";
import path from "path";
import chalk from "chalk";
import CliTable3 from "cli-table3";
import stripAnsi from "strip-ansi";
import timestampLogger from "../utils/timestampLogger.js";
import getAndAssignOptions from "../utils/getAndAssignOptions.js";

//TODO : Improve error messages
//TODO : And options to specify whether to output as table, folder structure or json
//TODO : Only acc obj if output-as is json

let tableLogAcc = "";
let fileCount = 0;
let folderCount = 0;

interface ContentPathAndType {
  contentPath: string;
  type: string;
}

const filterAndExcludeContents = async (
  extensionToFilterString: string,
  contents: string[],
  directoryToExclude: Set<string>,
  directory: string
) => {
  const extensionsToFilter = extensionToFilterString
    ? new Set(extensionToFilterString.split(","))
    : new Set([]);

  const contentsStatPromise = contents.map((content) => {
    try {
      const contentPath = path.resolve(directory, content);
      return fs.promises.lstat(contentPath);
    } catch (error) {
      throw new Error(
        (error as Error).message + " Error occurred when filtering contents"
      );
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
        } else if (
          isDirectory &&
          !directoryToExclude.has(path.basename(content))
        ) {
          folderCount++;
          const contentPath = path.resolve(directory, content)  ;
          return { contentPath, type: "folder" };
        } else {
          return "";
        }
      } catch (error) {
        throw new Error(
          (error as Error).message + " Error occurred when filtering contents"
        );
      }
    })
    .filter(Boolean);
};

/**
 * Logs a directory contents in a table form
 */
const logContents = (directory: string, contents: ContentPathAndType[]) => {
  const table = new CliTable3({
    head: [chalk.bold.blue(directory)],
    style: {
      head: ["name"],
    },
  });

  if (contents.length) {
    contents.forEach((content, index) => {
      //chalk.green(`[${index}]`) + " " +
      try {
        const contentName = path.basename(content.contentPath);
        let coloredContentName;
        if (content.type === "folder") {
          coloredContentName = chalk.blueBright.bold(
            `[${index + 1}] 📁 ${contentName}`
          );
        } else {
          coloredContentName = chalk.magenta.yellow(
            `[${index + 1}] 📄 ${contentName}`
          );
        }
        table.push([coloredContentName]);
      } catch (error) {
        throw new Error(
          (error as Error).message + " Error occurred when logging contents"
        );
      }
    });
    const tableToString = table.toString();
    console.log(tableToString);
    tableLogAcc += `
    ${stripAnsi(tableToString)} `;
    return tableToString;
  } else {
    table.push([chalk.yellow("⚠ No contents were found")]);
    const tableToString = table.toString();
    console.log(tableToString);
    tableLogAcc += `
    ${stripAnsi(tableToString)} `;
    return tableToString;
  }
};

/**
 * Logs the amount of files and folders discovered in the directory
 */
const logContentCount = (fileCount: number, folderCount: number) => {
  console.log(`
${fileCount} ${chalk.magenta.yellow("📄 Files")} 
${folderCount} ${chalk.blueBright.bold("📁 Folders")}
  `);
};

/**
 * Output log to a file in the specified directory
 */
const outputLogToAFile = (
  outputDir: string,
  outputAs: string,
  directoryObj: object
) => {
  if (outputDir) {
    if (!fs.lstatSync(outputDir).isDirectory()) {
      tableLogAcc = "";
      throw new Error(
        "Error please specify a directory as an output path for the log file"
      );
    }
    const outputExt = outputAs === "json" ? ".json" : ".md";
    const outputPath = `${outputDir}/list-log-${new Date().getTime()}${outputExt}`;
    console.log({ outputPath });

    if (outputAs === "json") {
      fs.writeFileSync(outputPath, JSON.stringify(directoryObj));
    } else {
      fs.writeFileSync(outputPath, tableLogAcc);
    }

    console.log(
      "Log outputed to " + chalk.magenta.yellow(path.resolve(outputPath))
    );
    tableLogAcc = "";
  }
};

/**
 * recursively search for contents in directories
 */
const recursivelySearchContents = async (
  contents: string[] | ContentPathAndType[],
  directory: string,
  exclude: Set<string>,
  filter: string,
  outputDir: string,
  directoryFiles: any[]
) => {
  contents = (await filterAndExcludeContents(
    filter,
    contents as string[],
    exclude,
    directory
  )) as ContentPathAndType[];

  logContents(directory, contents);

  for (const content of contents) {
    try {
      const subDirectory = path.resolve(directory, content.contentPath);
      const { contentPath, type } = content;
      if (content.type === "folder") {
        const subContents = fs.readdirSync(subDirectory);
        const subDirectoryObj = {
          name: path.basename(contentPath),
          path: contentPath.toString(),
          type,
          files: [],
        };
        await recursivelySearchContents(
          subContents,
          subDirectory,
          exclude,
          filter,
          outputDir,
          subDirectoryObj.files
        );
        directoryFiles.push(subDirectoryObj);
      } else {
        console.log({ path: contentPath });

        directoryFiles.push({
          name: path.basename(contentPath),
          path: contentPath.toString(),
          type,
        });
      }
    } catch (error) {
      throw new Error(
        (error as Error).message + " Error occurred when searching for contents"
      );
    }
  }
};

/**
 * List files in a dir base on provided options
 */
const list = async () => {
  const commandOptions = new Set([
    "--dir",
    "-d",
    "--recursive",
    "-r",
    "--filter",
    "-f",
    "--exclude",
    "-e",
    "--output-dir",
    "-o",
    "--output-as",
  ]);

  const options: DynamicObj = {};
  getAndAssignOptions(commandOptions, options, new Set(["--recursion", "--r"]));

  try {
    const directory = options["--dir"] || options["-d"] || process.cwd();
    const recursive = options["--recursive"] || options["-r"];
    const filter = options["--filter"] || options["-f"];
    let exclude: string | Set<string> = options["--exclude"] || options["-e"];
    exclude = exclude ? new Set(exclude.split(",")) : new Set([]);
    const outputDir = options["--output-dir"] || options["-o"];
    const outputAs = options["--output-as"] || "table";

    if (!directory) {
      throw { error: "Please specify the directory" };
    }

    const contents = fs.readdirSync(directory);
    interface DirectoryObj {
      name: string;
      path: string;
      type: string;
      files: any[];
    }
    const directoryObj: DirectoryObj = {
      name: path.basename(directory),
      path: directory.toString(),
      type: "folder",
      files: [],
    };
    if (recursive) {
      await recursivelySearchContents(
        contents,
        directory,
        exclude,
        filter,
        outputDir,
        directoryObj.files
      );

      logContentCount(fileCount, folderCount);
      outputLogToAFile(outputDir, outputAs, directoryObj);
    } else {
      const result = (await filterAndExcludeContents(
        filter,
        contents as string[],
        exclude,
        directory
      )) as ContentPathAndType[];

      logContents(directory, result);
      logContentCount(fileCount, folderCount);

      directoryObj.files = result.map((content) => ({
        name: path.basename(content.contentPath),
        type: content.type,
      }));
      outputLogToAFile(outputDir, outputAs, directoryObj);
    }

    fileCount = 0;
    folderCount = 0;
  } catch (error) {
    console.log(chalk.red((error as Error).message));
  }
};

export default timestampLogger(list);
