import { describe, it, expect } from "vitest";
import list from "../src/commands/list";
import path from "path";
import fs from "fs";

const directory = path.join(process.cwd(), "/tests/test-contents");
describe("Lists contents in a directory", () => {
  it("Should list all contents in the root of the specified directory", async () => {
    const directoryObj = (await list({ directory }))?.directoryObj;

    expect(directoryObj).toBeDefined();
    expect(directoryObj?.contents).toBeDefined();
    expect(directoryObj?.contents).toContainEqual({
      name: "out.txt",
      type: "file",
      path: path.join(directory, "out.txt"),
    });
  });

  it("Should recursively search and list contents", async () => {
    const directoryObj = (await list({ directory, recursive: true }))
      ?.directoryObj;
    expect(
      directoryObj?.contents?.find((content) => content.type === "folder")
    ).toBeDefined();
    expect(
      directoryObj?.contents?.find((content) => content.name === "inner-folder")
        .contents
    ).toContainEqual({
      name: "another.txt",
      type: "file",
      path: path.join(directory, "/inner-folder/another.txt"),
    });
  });
  it("Should output log to a specified directory", async () => {
    await list({
      directory,
      outputDir: "./tests/test-contents",
    });
    const regex = /^list-log-\d+\.md$/;
    const logFile = fs
      .readdirSync(directory)
      .find((content) => regex.test(content));
    expect(logFile).toBeDefined();
    fs.unlinkSync(path.join(directory, logFile as string));
  });

  it("Should output log to a specified directory as json", async () => {
    await list({
      directory,
      outputDir: "./tests/test-contents",
      outputAs: "json",
    });
    const regex = /^list-log-\d+\.json$/;
    const logFile = fs
      .readdirSync(directory)
      .find((content) => regex.test(content));
    expect(logFile).toBeDefined();
    fs.unlinkSync(path.join(directory, logFile as string));
  });
});

describe("Lists contents in a directory base on filter", () => {
  //
  it("Should exclude specified extensions", async () => {
    const directoryObj = (
      await list({ directory, recursive: true, excludeFiles: ".md,.json" })
    )?.directoryObj;

    expect(directoryObj?.contents).not.toContainEqual({
      name: "sleek.md",
      type: "file",
      path: path.join(directory, "sleek.md"),
    });
    expect(directoryObj?.contents).not.toContainEqual({
      name: "testfile.json",
      type: "file",
      path: path.join(directory, "testfile.json"),
    });
    expect(
      directoryObj?.contents?.find((content) => content.name === "inner-folder")
        .contents
    ).not.toContainEqual({
      name: "sleek2.md",
      type: "file",
      path: path.join(directory, "/inner-folder/sleek2.md"),
    });
  });
  //
  it("Should only include specified extensions", async () => {
    const directoryObj = (
      await list({ directory, recursive: true, includeFiles: ".txt,.md" })
    )?.directoryObj;

    expect(directoryObj?.contents).not.toContainEqual({
      name: "sleek.json",
      type: "file",
      path: path.join(directory, "sleek.json"),
    });
    expect(directoryObj?.contents).not.toContainEqual({
      name: "testfile.json",
      type: "file",
      path: path.join(directory, "testfile.json"),
    });
  });

  it("Should exclude specified folders", async () => {
    const directoryObj = (
      await list({ directory, excludeFolders: "inner-folder" })
    )?.directoryObj;
    expect(
      directoryObj?.contents?.find((content) => content.name === "inner-folder")
    ).not.toBeDefined();
  });

  it("Should only include specified folders", async () => {
    const directoryObj = (
      await list({ directory, includeFolders: "another-inner-folder" })
    )?.directoryObj;
    expect(
      directoryObj?.contents?.find((content) => content.name === "inner-folder")
    ).not.toBeDefined();
  });
});
