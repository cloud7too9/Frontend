import { promises as fs } from "node:fs";
import path from "node:path";

export class JsonStore<T> {
  constructor(private filePath: string) {}

  async read(): Promise<T> {
    const raw = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(raw) as T;
  }

  async write(data: T): Promise<void> {
    const dir = path.dirname(this.filePath);
    const tmp = path.join(dir, `.${path.basename(this.filePath)}.tmp`);
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, this.filePath);
  }
}
