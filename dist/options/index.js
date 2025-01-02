import { Command } from "commander";
export const listOptions = () => {
    const program = new Command();
    return (program
        .option("-d, --directory <path>", "Specify the directory to list")
        .option("-r, --recursive [number]", "Specifies how deep to recursively list directories. Default to infinite if the option is used without a value or without a valid number")
        //!new
        .option("-ef, --exclude-files <extensions>", "Specifies files to exclude using extensions (e.g., .txt,.md)(comma-separated)")
        .option("-if, --include-files <extensions>", "Specifies files that should only be included using extensions (e.g., .txt,.md)(comma-separated)")
        .option("-ed, --exclude-folders <folders>", "Specifies folders to exclude (e.g.,node_modules,build)(comma-separated)")
        .option("-id, --include-folders <folders>", "Specifies folders that should only be included (e.g., node_modules,build)(comma-separated)")
        .option("-o, --output-dir <path>", "Output directory for logs")
        .option("-oa, --output-as <format>", "Output format (table, json)", "table")
        .parse(process.argv));
};
export const renameOptions = () => {
    const program = new Command();
    return (program
        .option("-d, --directory <path>", "Specify the directory to list")
        .option("-r, --recursive [number]", "Specifies how deep to recursively list directories. Default to infinite if the option is used without a value or without a valid number")
        //!new
        .option("-ef, --exclude-files <extensions>", "Specifies files to exclude using extensions (e.g., .txt,.md)(comma-separated)")
        .option("-if, --include-files <extensions>", "Specifies files that should only be included using extensions (e.g., .txt,.md)(comma-separated)")
        .option("-ed, --exclude-folders <folders>", "Specifies folders to exclude (e.g.,node_modules,build)(comma-separated)")
        .option("-id, --include-folders <folders>", "Specifies folders that should only be included (e.g., node_modules,build)(comma-separated)")
        .parse(process.argv));
};
