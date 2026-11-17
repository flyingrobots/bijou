import './require-docker.mjs';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = 'C:\\work\\source';
const { command, fullPush } = JSON.parse(readFileSync(`${root}\\.seal\\request.json`, 'utf8'));
const argv = command[0] === 'npm'
  ? [process.execPath, 'C:\\node\\node_modules\\npm\\bin\\npm-cli.js', ...command.slice(1)]
  : command;
const env = {
  PATH: `${root}\\node_modules\\.bin;${process.env.PATH ?? ''}`,
  SystemRoot: process.env.SystemRoot, SystemDrive: process.env.SystemDrive,
  WINDIR: process.env.WINDIR, ComSpec: process.env.ComSpec, PATHEXT: process.env.PATHEXT,
  HOME: 'C:\\home', USERPROFILE: 'C:\\home', TEMP: 'C:\\temp', TMP: 'C:\\temp',
  GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: 'NUL',
  npm_config_cache: 'C:\\home\\npm-cache', npm_config_offline: 'true', CI: 'true',
  ...(fullPush === true ? { BIJOU_FULL_PUSH: '1' } : {}),
};
const result = spawnSync(argv[0], argv.slice(1), {
  cwd: root, env, input: readFileSync(`${root}\\.seal\\stdin`), stdio: ['pipe', 'inherit', 'inherit'],
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
