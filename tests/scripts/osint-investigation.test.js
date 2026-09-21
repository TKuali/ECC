/** Exercise the optional OSINT Python helpers from outside the skill directory. */
const assert = require('assert');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const skillRoot = path.resolve(__dirname, '../../skills/osint-investigation');
const candidates = process.platform === 'win32'
  ? ['python', 'python3'] : ['python3', 'python'];
const python = candidates.find(candidate => {
  const result = spawnSync(candidate, [
    '-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)',
  ], { encoding: 'utf8', timeout: 10000 });
  return result.status === 0;
});

if (!python) {
  console.log('SKIPPED: OSINT helpers require optional Python 3.10+');
  console.log('Passed: 0\nFailed: 0');
  process.exit(0);
}

let passed = 0;
let failed = 0;
const cases = [
  ['Python helper regression suite', [
    '-m', 'unittest', 'discover', '-s', path.join(skillRoot, 'tests'), '-v',
  ]],
];

for (const [name, args] of cases) {
  try {
    const result = spawnSync(python, args, {
      cwd: os.tmpdir(),
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1' },
    });
    assert.strictEqual(result.status, 0,
      result.error?.message || `${result.stdout}\n${result.stderr}`);
    console.log(`PASS: ${name}`);
    if (result.stdout) console.log(result.stdout.trim());
    if (result.stderr) console.log(result.stderr.trim());
    passed++;
  } catch (error) {
    console.error(`FAIL: ${name}\n${error.message}`);
    failed++;
  }
}

console.log(`Passed: ${passed}\nFailed: ${failed}`);
process.exitCode = failed ? 1 : 0;
