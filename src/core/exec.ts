import { execFile } from "node:child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface RunOptions {
  cwd?: string;
  acceptExitCodes?: number[];
}

export function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<ExecResult> {
  const acceptExitCodes = opts.acceptExitCodes ?? [0];
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { cwd: opts.cwd, maxBuffer: 1024 * 1024 * 64 },
      (error, stdout, stderr) => {
        const code = error && typeof (error as NodeJS.ErrnoException & { code?: number }).code === "number"
          ? (error as unknown as { code: number }).code
          : error
            ? 1
            : 0;
        if (!error || acceptExitCodes.includes(code)) {
          resolve({ stdout, stderr, code });
          return;
        }
        reject(new Error(`${cmd} ${args.join(" ")} exited ${code}: ${stderr || error.message}`));
      }
    );
  });
}
