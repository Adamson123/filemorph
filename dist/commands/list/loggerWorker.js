import { parentPort } from "worker_threads";
parentPort?.on("message", (message /*{ contents, directory, append, logToConsole }*/) => {
    //   try {
    //     fs.writeFileSync(
    //       directory,
    //       `
    //       ${stripAnsi(contents)}
    //       `,
    //       { flag: append ? "a" : "w" }
    //     );
    //     console.log("Written to a file");
    parentPort?.postMessage({ success: true });
    parentPort?.close();
    //   } catch (error) {
    //     parentPort?.postMessage({
    //       success: false,
    //       error: (error as Error).message,
    //     });
    //   }
    console.log("Written to file req from " + message);
});
