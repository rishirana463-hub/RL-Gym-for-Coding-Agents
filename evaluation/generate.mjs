import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { root, args, write, sourceHash, files } from './util.mjs';
import { createOutput, parseEvent } from './output.mjs';

const options = args();
const docker = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { encoding: 'utf8' });
if (options.prepare) {
  const directory = path.join(root, '.runs/starter-preview');
  fs.mkdirSync(directory, { recursive: true });
  fs.cpSync(path.join(root, 'task/public'), directory, { recursive: true });
  fs.copyFileSync(path.join(root, 'task/instruction.md'), path.join(directory, 'instruction.md'));
  write('evaluation/proof-of-work/generation-preflight.json', {
    generatedAt: new Date().toISOString(), status: 'prepared-only', modelAttempts: 0,
    dockerAvailable: !docker.error && docker.status === 0, apiKeyConfigured: Boolean(process.env.LLM_API_KEY),
    sdkVersion: '1.54.0', reasoningEffort: 'medium', publicSourceHash: sourceHash(directory),
    privateAssetsExposed: false,
    nextCommand: 'npm run generate -- --run model-a --model <provider/model> --frontier-confirmed'
  });
  console.log('Starter preview prepared. No model was run and no model score was recorded.');
  process.exit(0);
}
if (!options.run || !/^model-[a-z0-9-]+$/.test(options.run) || typeof options.model !== 'string') throw new Error('Use --run model-a --model <provider/model> (or --prepare)');
if (docker.error || docker.status !== 0) throw new Error('Docker Desktop with Linux containers is required. No model attempt started.');
if (!process.env.LLM_API_KEY) throw new Error('Set LLM_API_KEY in the local environment. No model attempt started.');
const maxIterations = Number(options.iterations ?? 100), seconds = Number(options.seconds ?? 1800);
if (!Number.isInteger(maxIterations) || maxIterations < 1 || !Number.isInteger(seconds) || seconds < 1) throw new Error('iterations and seconds must be positive integers');
const build = spawnSync('docker', ['build', '-t', 'stockroom-openhands:1.54.0', path.join(root, 'environment/openhands')], { stdio: 'inherit' });
if (build.status !== 0) throw new Error('OpenHands image build failed. No model attempt started.');
const destination = path.join(root, 'evaluation/proof-of-work', options.run);
// An attempt folder is exclusive: an interrupted run may not be silently retried.
fs.mkdirSync(destination);
const workspace = path.join(root, '.runs', options.run, 'workspace');
if (fs.existsSync(workspace)) throw new Error('Workspace already exists; use a distinct disclosed run ID');
fs.mkdirSync(workspace, { recursive: true });
fs.cpSync(path.join(root, 'task/public'), workspace, { recursive: true });
fs.copyFileSync(path.join(root, 'task/instruction.md'), path.join(workspace, 'instruction.md'));
if (process.platform !== 'win32') {
  // The generated workspace is the only writable host bind mount.
  const grant = dir => { fs.chmodSync(dir, 0o777); for (const x of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, x.name); if (x.isDirectory()) grant(f); else fs.chmodSync(f, 0o666); } }; grant(workspace);
}
const name = `stockroom-${options.run}-${Date.now()}`;
const metadata = {
  schemaVersion: 1, runId: options.run, model: options.model, attempt: 1, status: 'running',
  frontierAttestation: options['frontier-confirmed'] === true, reasoningEffort: 'medium',
  sdkVersion: '1.54.0', maxIterations, wallTimeSeconds: seconds,
  startedAt: new Date().toISOString(), workspace: path.relative(root, workspace).replaceAll('\\', '/'),
  startingSourceHash: sourceHash(workspace), instructionHash: sourceHash(path.join(root, 'task')),
  imageId: spawnSync('docker', ['image', 'inspect', '--format', '{{.Id}}', 'stockroom-openhands:1.54.0'], { encoding: 'utf8' }).stdout.trim(),
  privateAssetsExposed: false
};
const metadataPath = path.join(destination, 'run.json'); write(metadataPath, metadata);
const log = fs.openSync(path.join(destination, 'openhands.log'), 'w');
const secret = process.env.LLM_API_KEY;
let timedOut = false, finishedEvent = false;
const stdout = createOutput({ secret, onText: text => fs.writeSync(log, text), onLine: line => {
  if (parseEvent(line)?.event === 'harness_finished') finishedEvent = true;
} });
const stderr = createOutput({ secret, onText: text => fs.writeSync(log, text) });
const child = spawn('docker', ['run', '--rm', '--name', name, '--init', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--memory', '4g', '--cpus', '2', '--pids-limit', '256', '--env', 'LLM_API_KEY', '--env', 'LLM_BASE_URL', '--env', `LLM_MODEL=${options.model}`, '--env', `GYM_MAX_ITERATIONS=${maxIterations}`, '--mount', `type=bind,source=${workspace},target=/workspace`, 'stockroom-openhands:1.54.0'], { stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.on('data', data => stdout.write(data));
child.stderr.on('data', data => stderr.write(data));
const timer = setTimeout(() => { timedOut = true; spawnSync('docker', ['kill', name], { stdio: 'ignore' }); }, seconds * 1000);
const exitCode = await new Promise(resolve => { child.once('close', code => resolve(code ?? -1)); child.once('error', error => stderr.write(String(error))); });
clearTimeout(timer); stdout.end(); stderr.end(); fs.closeSync(log);
metadata.status = timedOut ? 'timed_out' : exitCode === 0 && finishedEvent ? 'completed' : 'harness_error';
metadata.exitCode = exitCode; metadata.finishedAt = new Date().toISOString(); metadata.solutionHash = sourceHash(workspace);
const snapshot = path.join(destination, 'solution');
for (const filename of files(workspace)) {
  const target = path.join(snapshot, path.relative(workspace, filename));
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(filename, target);
}
metadata.solutionDirectory = path.relative(root, snapshot).replaceAll('\\', '/');
write(metadataPath, metadata);
console.log(`Run ${options.run}: ${metadata.status}. Score the saved workspace separately; no retry was attempted.`);
if (metadata.status !== 'completed') process.exitCode = 1;
