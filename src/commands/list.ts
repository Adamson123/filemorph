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

let append = false;
const outputContentToFile = (contents: string, directory: string) => {
  fs.writeFileSync(
    directory,
    `
    ${stripAnsi(contents)} 
   
    `,
    { flag: append ? "a" : "w" }
  );
  append = true;
};

/**
 * Filters out files specified by the user
 */
const filterContents = (
  extensionString: string,
  contents: string[],
  exclude: Set<string>,
  directory: string
) => {
  const extensions = extensionString
    ? new Set(extensionString.split(","))
    : new Set([]);

  return contents.filter((content) => {
    try {
      const dirPath = path.resolve(directory, content);
      const isDirectory = fs.lstatSync(dirPath).isDirectory();
      if (
        (!isDirectory && !extensions.has(path.extname(content))) ||
        (isDirectory && !exclude.has(path.basename(content)))
      ) {
        return true;
      }
    } catch (error) {
      throw new Error(
        (error as Error).message + " Error occurred when filtering contents"
      );
    }
  });
};

const logContents = (directory: string, contents: string[], outDir: string) => {
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
          coloredContentName = chalk.blueBright.bold(
            `[${index + 1}] 📁 ${contentName}`
          );
        } else {
          coloredContentName = chalk.magenta.yellow(
            `[${index + 1}] 📄 ${contentName}`
          );
        }
        //chalk.green(`[${index}]`) + " " +
        table.push([coloredContentName]);
      } catch (error) {
        throw new Error(
          (error as Error).message + " Error occurred when logging contents"
        );
      }
    });
    const tableToString = table.toString();
    console.log(tableToString);
    outDir && outputContentToFile(tableToString, outDir);
    return tableToString;
  } else {
    table.push([chalk.yellow("⚠ No contents were found")]);
    const tableToString = table.toString();
    console.log(tableToString);
    outDir && outputContentToFile(tableToString, outDir);
    return tableToString;
  }
};

const logContentCount = (fileCount: number, folderCount: number) => {
  console.log(`
${fileCount} ${chalk.magenta.yellow("📄 Files")} 
${folderCount} ${chalk.blueBright.bold("📁 Folders")}
  `);
};

const countContents = (
  contents: string[],
  fileCount: number,
  folderCount: number,
  directory: string,
  exclude: Set<string>
) => {
  contents.forEach((content) => {
    try {
      const subDirectory = path.join(directory, content);
      const stat = fs.lstatSync(subDirectory);
      if (stat.isDirectory() && !exclude.has(content)) {
        folderCount++;
      } else {
        if (!stat.isDirectory()) fileCount++;
      }
    } catch (error) {
      throw new Error(
        (error as Error).message + " Error occurred when searching for contents"
      );
    }
  });
  return { fileCount, folderCount };
};

const recursivelySearchContents = (
  contents: string[],
  directory: string,
  exclude: Set<string>,
  filter: string,
  outDir: string,
  acc: string[]
) => {
  contents = filterContents(filter, contents as string[], exclude, directory);
  logContents(directory, contents, outDir);
  contents.forEach((content) => {
    try {
      const subDirectory = path.join(directory, content);
      //acc.push(subDirectory);
      const stat = fs.lstatSync(subDirectory);
      if (stat.isDirectory() && !exclude.has(content)) {
        acc.push("folder");
        const contents = fs.readdirSync(subDirectory);
        recursivelySearchContents(
          contents,
          subDirectory,
          exclude,
          filter,
          outDir,
          acc
        );
      } else {
        acc.push("file");
      }
    } catch (error) {
      throw new Error(
        (error as Error).message + " Error occurred when searching for contents"
      );
    }
  });
  return acc;
};

const list = async () => {
  const options: {
    [key: string]: string;
  } = {};

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
    let exclude: string | Set<string> = options["--exclude"];
    exclude = exclude ? new Set(exclude.split(",")) : new Set([]);
    const outDir = options["--outDir"] || options["--o"];

    if (!directory) {
      throw { error: "Please specify the directory" };
    }

    let contents = fs.readdirSync(directory);
    append = false;
    if (recursive) {
      const result = recursivelySearchContents(
        contents,
        directory,
        exclude,
        filter,
        outDir,
        []
      );

      const filesCountResult = result.filter((content) => content === "file");

      logContentCount(
        filesCountResult.length,
        result.length - filesCountResult.length
      );
    } else {
      contents = filterContents(
        filter,
        contents as string[],
        exclude,
        directory
      );
      logContents(directory, contents, outDir);
      const countResult = countContents(contents, 0, 0, directory, exclude);
      logContentCount(countResult.fileCount, countResult.folderCount);
    }
  } catch (error) {
    console.log(chalk.red((error as Error).message));
  }
};

export default timestampLogger(list);
