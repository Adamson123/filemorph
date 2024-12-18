import chalk from "chalk";

const timestampLogger = (fn: () => any) => {
  return () => {
    const start = performance.now();
    fn();
    const end = performance.now();
    const timeInSeconds = ((end - start) / 1000).toFixed(2);
    console.log(chalk.green(`Operation completed in ${timeInSeconds}s`));
  };
};
export default timestampLogger;