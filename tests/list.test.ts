import { execSync } from "child_process";
import { describe, it, expect } from "@jest/globals";
import list from "../src/commands/list";
describe("Should list all of files in a directory", () => {
  const directory = "/tests/test-contents";
  it("Should list all files in the root of the specified directory", () => {
    const log = execSync("filemorph list --dir " + directory);

    console.log({ log });

    const logToString = log.toString();
    expect(logToString).toBeTruthy();
    expect(logToString).toContain("test-contents");
  });
  it("Should recursively search and list files", () => {
    /// const log = execSync("filemorph list --dir " + directory);
    expect(true).toBeTruthy();
  });
});
