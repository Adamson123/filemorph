import chalk from "chalk";
const timestampLogger = (fn) => {
    return async () => {
        const start = performance.now();
        await fn();
        const end = performance.now();
        const timeInSeconds = ((end - start) / 1000).toFixed(2);
        console.log(chalk.green(`Operation completed in ${timeInSeconds}s`));
    };
};
export default timestampLogger;
