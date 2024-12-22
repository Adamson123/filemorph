import fs from "fs";
import path from "path";
import getAndAssignOptions from "../utils/getAndAssignOptions.js";

const commandOptions = new Set(["--dir", "--d", "--pattern", "--p"]);
const rename = () => {
  const options: DynamicObj = {};
  getAndAssignOptions(commandOptions, options);
  console.log(options);
  const testDiretory = "./junk-folder";
  const directory = options["--dir"] || options["--d"] || testDiretory;
  const pattern = options["--pattern"] || options["--p"];

  fs.readdirSync(directory).forEach((content, index) => {
    console.log(content);
    const oldPath = path.join(testDiretory, content);
    const newPath = path.join(
      testDiretory,
      pattern.replace(/{index}/g, index.toString())
    );
    fs.renameSync(oldPath, newPath);

    // console.log(path.basename(oldPath), "------->", path.basename(newPath));
  });
};

export default rename;
