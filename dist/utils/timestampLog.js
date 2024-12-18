const timestampLogger = (fn) => {
    return () => {
        const start = performance.now();
        fn();
        const end = performance.now();
        const timeInSeconds = ((end - start) / 1000).toFixed(2);
        console.log(`Operation completed in ${timeInSeconds}s`);
    };
};
export default timestampLogger;
