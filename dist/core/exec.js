import { execFile } from "node:child_process";
export function run(cmd, args, opts = {}) {
    const acceptExitCodes = opts.acceptExitCodes ?? [0];
    return new Promise((resolve, reject) => {
        execFile(cmd, args, { cwd: opts.cwd, maxBuffer: 1024 * 1024 * 64 }, (error, stdout, stderr) => {
            const code = error && typeof error.code === "number"
                ? error.code
                : error
                    ? 1
                    : 0;
            if (!error || acceptExitCodes.includes(code)) {
                resolve({ stdout, stderr, code });
                return;
            }
            reject(new Error(`${cmd} ${args.join(" ")} exited ${code}: ${stderr || error.message}`));
        });
    });
}
//# sourceMappingURL=exec.js.map