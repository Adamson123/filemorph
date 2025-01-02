import path from "path";
export class FilemorphError extends Error {
    constructor(message) {
        super(message);
        this.name = "FilemorphError";
    }
}
export const handleContentAccessError = (error, directory) => {
    if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
            throw new FilemorphError(`File or directory not found: ${path.resolve(directory)}`);
        }
        else if (error.message.includes("EACCES")) {
            throw new FilemorphError(`Permission denied to access item in directory: ${directory}`);
        }
    }
};
