export interface StorageDriver {
  saveFile(bytes: Buffer, relativePath: string): Promise<string>;
  readFile(relativePath: string): Promise<Buffer>;
}
