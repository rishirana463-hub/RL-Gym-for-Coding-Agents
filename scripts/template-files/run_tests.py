#!/usr/bin/env python3
"""Official-template entry point for the existing black-box behavioral checks."""
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tomllib

from reward import make_reward


def absolute_env(name):
    value = os.environ.get(name, "")
    if not value or not Path(value).is_absolute():
        raise ValueError(f"{name} must be an explicit absolute path")
    return Path(value).resolve()


def verify_integrity(task, manifest):
    for name, expected in manifest["files"].items():
        relative = Path(name)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError("Unsafe exported file path")
        target = task / relative
        if not target.is_file() or target.is_symlink():
            raise ValueError(f"Missing or symlinked exported source: {name}")
        if hashlib.sha256(target.read_bytes()).hexdigest() != expected:
            raise ValueError(f"Exported source changed: {name}")


def execution_mode(task):
    if os.environ.get("STOCKROOM_TRUSTED_LOCAL") == "1":
        return "trusted-local"
    private = Path("/opt/private")
    if os.name != "posix" or os.geteuid() != 0 or not task.is_relative_to(private):
        raise ValueError("Untrusted verification requires the root verifier image and /opt/private/task mount")
    stat = private.stat()
    if stat.st_uid != 0 or stat.st_mode & 0o077:
        raise ValueError("Private task parent must be root-owned and inaccessible to candidate UID 10001")
    return "docker-isolated"


def runtime_env(source, isolated):
    allowed = {"path", "systemroot", "windir", "comspec", "pathext", "temp", "tmp",
               "tmpdir", "lang", "lc_all", "tz", "home", "userprofile"}
    env = {key: value for key, value in source.items() if key.lower() in allowed}
    if isolated:
        env["STOCKROOM_ISOLATE_CANDIDATE"] = "1"
    return env


def run_node(command, task, log, timeout, isolated):
    env = runtime_env(os.environ, isolated)
    with log.open("w", encoding="utf-8") as output:
        process = subprocess.Popen(command, cwd=task, env=env, stdout=output,
                                   stderr=subprocess.STDOUT, start_new_session=os.name == "posix")
        try:
            return process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            if os.name == "posix":
                os.killpg(process.pid, signal.SIGKILL)
            else:
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            process.wait()
            raise RuntimeError("Verifier timeout; no completed numeric score") from None


def main():
    try:
        task, workspace, out = (absolute_env(name) for name in ("TASK_DIR", "WORKSPACE", "OUT_DIR"))
        if out == workspace or out.is_relative_to(workspace) or out == task or out.is_relative_to(task):
            raise ValueError("OUT_DIR must be separate from task and candidate source")
        out.mkdir(parents=True, exist_ok=True)
        if any((out / name).exists() for name in ("reward.json", "legacy-score.json", "verifier.log")):
            raise ValueError("Refusing to overwrite verification records; use a fresh OUT_DIR")
    except (ValueError, OSError) as error:
        print(f"[verifier] configuration error: {error}", file=sys.stderr)
        return 2

    try:
        if not workspace.is_dir() or workspace.is_symlink():
            raise ValueError("Candidate workspace is missing or symlinked")
        config = tomllib.loads((task / "task.toml").read_text(encoding="utf-8"))
        metadata = config["metadata"]
        manifest_bytes = (task / "template-manifest.json").read_bytes()
        manifest = json.loads(manifest_bytes)
        verify_integrity(task, manifest)
        execution = execution_mode(task)
        scoring = json.loads((task / "verifier/scoring.yml").read_text(encoding="utf-8"))
        # Verify host runtime networking independently of candidate behavior.
        probe = subprocess.run(["node", "--input-type=module", "-e",
                                "import net from 'node:net'; const s=net.createServer(); "
                                "s.on('error',e=>{console.error(e);process.exitCode=1}); "
                                "s.listen(0,'127.0.0.1',()=>s.close());"],
                               env=runtime_env(os.environ, False), capture_output=True, timeout=10)
        (out / "runtime-preflight.log").write_bytes(probe.stdout + probe.stderr)
        if probe.returncode:
            raise RuntimeError("Host Node runtime cannot bind loopback; no candidate score")
        command = ["node", str(task / "verifier/implementation/evaluation/score.mjs"),
                   "--solution", str(workspace), "--out", str(out / "legacy-score.json")]
        status = run_node(command, task, out / "verifier.log", config["verifier"]["timeout_sec"],
                          execution == "docker-isolated")
        if status != 0:
            raise RuntimeError(f"Verifier execution exited {status}; no completed numeric score")
        report = json.loads((out / "legacy-score.json").read_text(encoding="utf-8"))
        reward = make_reward(report, scoring, metadata, hashlib.sha256(manifest_bytes).hexdigest(),
                             manifest["packaged_verifier_hash"], execution)
    except Exception as error:
        reward = {"schema_version": 1, "task": "stockroom", "task_version": 1,
                  "status": "infrastructure_error", "score": None, "max_score": 100,
                  "tests": [], "error": str(error)}
        with (out / "verifier.log").open("a", encoding="utf-8") as log:
            log.write(f"\nINFRASTRUCTURE_ERROR: {error}\n")
        (out / "reward.json").write_text(json.dumps(reward, indent=2) + "\n", encoding="utf-8")
        print(f"[verifier] infrastructure error: {error}", file=sys.stderr)
        return 2
    (out / "reward.json").write_text(json.dumps(reward, indent=2) + "\n", encoding="utf-8")
    print(f"[verifier] score={reward['score']}/100 ({execution})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
