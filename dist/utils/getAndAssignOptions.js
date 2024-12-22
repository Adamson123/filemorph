const getAndAssignOptions = (commandOptions, options, canBeUndefined) => {
    const processArgv = process.argv;
    processArgv.forEach((option, index) => {
        if (commandOptions.has(option)) {
            const nextField = processArgv[index + 1];
            if (!commandOptions.has(nextField) || canBeUndefined?.has(option)) {
                options[option] = nextField;
                //As far as --recursion or --r is included among the options with or without a value, go recursive mode!!!
                if (canBeUndefined?.has(option))
                    options[option] = "true";
            }
        }
    });
};
export default getAndAssignOptions;
