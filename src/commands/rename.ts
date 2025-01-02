import fs from "fs";
import path from "path";
import { renameOptions } from "../options/index.js";

const rename = () => {
  const options = renameOptions().opts();
  console.log(options);
  const testDiretory = "./junk-folder";
  const directory = options.directory;
  const pattern = options.pattern;

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
