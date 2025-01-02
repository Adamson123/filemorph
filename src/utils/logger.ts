import chalk from "chalk";
import { FilemorphError } from "./errorHandler.js";

export const logTimestamp = (fn: (param: any) => any) => {
  return async (param: any = null) => {
    const start = performance.now();
    await fn(param);
    const end = performance.now();
    const timeInSeconds = ((end - start) / 1000).toFixed(2);
    console.log(chalk.green(`✓ Operation completed in ${timeInSeconds}s`));
  };
};

export const logContentCount = (fileCount: number, folderCount: number) => {
  console.log(`
    ${fileCount} ${chalk.yellow("📄 Files")} 
    ${folderCount} ${chalk.blueBright.bold("📁 Folders")}
      `);
};

export const logError = (error: unknown): never => {
  if (error instanceof FilemorphError) {
    console.error(chalk.red(`❌ ${error.message}`));
  } else if (error instanceof Error) {
    console.error(chalk.red(`❌ Unexpected error: ${error.message}`));
  } else {
    console.error(chalk.red("❌ An unknown error occurred"));
  }
  process.exit(1);
};
