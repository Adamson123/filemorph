interface DynamicObj<T = string> {
  [key: string]: T;
}

export interface CommonCommandOptions {
  directory?: string;
  recursive?: boolean;
  excludeFiles?: string;
  includeFiles?: string;
  excludeFolders?: string;
  includeFolders?: string;
}
