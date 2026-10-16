#!/usr/bin/env python3
"""Scratch-only self-check of the exported task, with preserved measured output."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import tempfile
import tomllib

ROOT = Path(__file__).resolve().parents[1]
TASK = ROOT / "greenfield"


def command(args, cwd, log, env=None):
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open("a", encoding="utf-8") as output:
        output.write("COMMAND " + json.dumps([str(arg) for arg in args]) + "\n")
        output.flush()
        result = subprocess.run([str(arg) for arg in args], cwd=cwd, env=env,
                                stdout=output, stderr=subprocess.STDOUT, timeout=900)
    if result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}); see {log}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--docker", action="store_true")
    parser.add_argument("--out", required=True)
    parser.add_argument("--reference-only", action="store_true")
    options = parser.parse_args()
    output = Path(options.out).resolve()
    if output.exists():
        raise RuntimeError("Use a fresh result directory; existing evidence is never overwritten")
    if not output.is_relative_to(ROOT) or output == ROOT:
        raise RuntimeError("Self-check output must be a separate directory inside this workspace")
    output.mkdir(parents=True)
    scratch_root = ROOT / ".runs"
    scratch_root.mkdir(exist_ok=True)
    scratch = Path(tempfile.mkdtemp(prefix="template-self-check-", dir=scratch_root))
    task = scratch / "task"
    shutil.copytree(TASK, task, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    manifest_bytes = (task / "template-manifest.json").read_bytes()
    (output / "template-manifest.json").write_bytes(manifest_bytes)
    metadata = tomllib.loads((task / "task.toml").read_text())["metadata"]
    config = tomllib.loads((task / "app/config.toml").read_text())
    scoring = json.loads((task / "verifier/scoring.yml").read_text())
    target_weights = {item["id"]: item["points"] for item in scoring["checks"]}
    git_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    provenance = {"task": metadata["id"], "task_version": metadata["version"],
                  "started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  "source_commit": git_sha, "execution": "docker-isolated" if options.docker else "trusted-local",
                  "template_manifest_sha256": hashlib.sha256(manifest_bytes).hexdigest(),
                  "model_attempts": 0, "scratch_copy": True,
                  "node": subprocess.check_output(["node", "--version"], text=True).strip(),
                  "python": os.sys.version, "workflow_run_id": os.environ.get("GITHUB_RUN_ID"),
                  "workflow_url": (f"https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
                                   if os.environ.get("GITHUB_RUN_ID") else None), "runs": []}
    (output / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
    if options.docker:
        command(["docker", "version"], ROOT, output / "docker-version.log")
        command(["docker", "images", "--no-trunc"], ROOT, output / "images-before.log")
        for dockerfile, image in [("Dockerfile", "stockroom-template-task:1"),
                                  ("verifier.Dockerfile", "stockroom-template-verifier:1")]:
            command(["docker", "build", "--pull", "-f", task / "environment" / dockerfile,
                     "-t", image, task / "environment"], ROOT, output / f"build-{dockerfile}.log")

    def grade(name, source="reference-solution", patch=None, probe=False):
        workspace = scratch / name.replace("/", "-")
        shutil.copytree(task / source, workspace)
        records = output / name
        records.mkdir(parents=True)
        if patch:
            command(["git", "init", "--quiet"], workspace, records / "setup.log")
            command(["git", "apply", patch], workspace, records / "setup.log")
        if probe:
            server = workspace / "server.mjs"
            server.write_text("import * as privateProbe from 'node:fs';\n"
                              "if (process.getuid() !== 10001) throw new Error('Candidate UID was not dropped');\n"
                              "let denied = false; try { privateProbe.readFileSync('/opt/private/task/verifier/scoring.yml'); } "
                              "catch (e) { denied = e.code === 'EACCES'; }\n"
                              "if (!denied) throw new Error('Private verifier readable by candidate');\n"
                              + server.read_text(), encoding="utf-8")
        setup = config["setup"]["commands"] + [f"node --check {file.name}" for file in workspace.glob("*.mjs")]
        if options.docker:
            mounts = ["--mount", f"type=bind,source={workspace},target=/work/candidate,readonly"]
            command(["docker", "run", "--rm", "--network", "none", "--cap-drop", "ALL",
                     "--security-opt", "no-new-privileges", *mounts, "stockroom-template-task:1",
                     "sh", "-c", " && ".join(setup)], ROOT, records / "setup.log")
            command(["docker", "run", "--rm", "--network", "none", "--cap-drop", "ALL",
                     "--cap-add", "SETUID", "--cap-add", "SETGID", "--cap-add", "KILL",
                     "--cap-add", "DAC_OVERRIDE", "--security-opt", "no-new-privileges",
                     "--memory", "1g", "--cpus", "2", "--pids-limit", "256", *mounts,
                     "--mount", f"type=bind,source={task},target=/opt/private/task,readonly",
                     "--mount", f"type=bind,source={records},target=/logs/verifier",
                     "-e", "WORKSPACE=/work/candidate", "-e", "TASK_DIR=/opt/private/task",
                     "-e", "OUT_DIR=/logs/verifier", "stockroom-template-verifier:1",
                     "python3", "verifier/tests/run_tests.py"], ROOT, records / "command.log")
        else:
            for setup_command in setup:
                command(shlex.split(setup_command), workspace, records / "setup.log")
            env = dict(os.environ, STOCKROOM_TRUSTED_LOCAL="1", TASK_DIR=str(task),
                       WORKSPACE=str(workspace), OUT_DIR=str(records))
            command([os.environ.get("PYTHON", os.sys.executable), task / "verifier/tests/run_tests.py"],
                    task, records / "command.log", env)
        result = json.loads((records / "reward.json").read_text())
        if result["status"] != "completed":
            raise RuntimeError(f"{name}: incomplete verification cannot count")
        provenance["runs"].append({"name": name, "score": result["score"],
                                  "failed": [test["id"] for test in result["tests"] if test["status"] == "failed"],
                                  "solution_hash": result["provenance"]["solution_hash"]})
        (output / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
        print(f"{name}: {result['score']}/100", flush=True)
        return result

    first = grade("reference/1")
    second = grade("reference/2")
    if first["score"] != 100 or second["score"] != 100 or first["tests"] != second["tests"]:
        raise RuntimeError("Reference must score 100 twice with identical outcomes")
    starter = grade("starter/1", source="app")
    if starter["score"] != 0:
        raise RuntimeError("The intentionally incomplete starter must score zero")
    if options.docker and grade("privacy-probe/1", probe=True)["score"] != 100:
        raise RuntimeError("Candidate UID/private-file isolation probe failed")
    comparisons = []
    if not options.reference_only:
        control = grade("mutants/control/1")
        if control["score"] != 100:
            raise RuntimeError("Mutation control must pass fully")
        descriptions = (task / "verifier/mutants/README.md").read_text()
        for patch in sorted((task / "verifier/mutants").glob("*.patch")):
            result = grade(f"mutants/{patch.stem}/1", patch=patch)
            row = next(line for line in descriptions.splitlines() if line.startswith(f"| {patch.stem}.patch |"))
            checks = [item.strip() for item in row.split("|")[3].split(",")]
            expected_loss = sum(target_weights[check] for check in checks)
            loss = 100 - result["score"]
            comparisons.append({"mutant": patch.stem, "score": result["score"], "detected": loss > 0,
                                "declared_target_checks": checks, "declared_target_points": expected_loss,
                                "actual_loss": loss, "within_two_points": abs(loss - expected_loss) <= 2})
        if len(comparisons) != 18 or not all(item["detected"] for item in comparisons):
            raise RuntimeError("Every exported mutation must be detected")
    summary = {"reference_scores": [first["score"], second["score"]], "starter_score": starter["score"],
               "model_attempts": 0, "mutants": comparisons,
               "mutant_count_matches_template": False,
               "mutant_weight_mismatches": [item["mutant"] for item in comparisons if not item["within_two_points"]]}
    (output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    provenance["finished_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    (output / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
    print("Saved actual self-check results. Count/weight review and real model evidence may still be missing.")


if __name__ == "__main__":
    main()
