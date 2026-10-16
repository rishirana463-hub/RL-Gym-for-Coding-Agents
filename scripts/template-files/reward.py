"""Translate measured complete Stockroom scores; never invent missing results."""
import math


def make_reward(report, scoring, metadata, manifest_hash, expected_verifier_hash, execution):
    specs = scoring["checks"]
    checks = report.get("checks", [])
    expected_ids = {spec["id"] for spec in specs}
    if (not report.get("complete") or report.get("executed") != len(specs)
            or report.get("total") != len(specs) or len(checks) != len(specs)
            or {check.get("id") for check in checks} != expected_ids):
        raise ValueError("Incomplete or mismatched verifier results; no numeric score")
    if report.get("checkHash") != expected_verifier_hash:
        raise ValueError("Verifier fingerprint differs from the exported version")
    results = {check["id"]: check for check in checks}
    if any(type(check.get("passed")) is not bool for check in checks):
        raise ValueError("Every measured check must have a Boolean result")
    measured = sum(spec["points"] for spec in specs if results[spec["id"]]["passed"])
    raw = report.get("score")
    if type(raw) not in (float, int) or not math.isfinite(raw) or not 0 <= raw <= 1:
        raise ValueError("Invalid measured score")
    if abs(raw * 100 - measured) > 1e-8:
        raise ValueError("Measured score does not agree with granular points")
    if report.get("passed") != sum(check["passed"] for check in checks):
        raise ValueError("Measured pass count is inconsistent")
    tests = []
    for spec in specs:
        result = results[spec["id"]]
        test = {"id": spec["id"], "title": spec["title"],
                "score": spec["points"] if result["passed"] else 0,
                "max_score": spec["points"],
                "status": "passed" if result["passed"] else "failed",
                "type": "deterministic"}
        if not result["passed"]:
            test["details"] = result.get("error", "Behavioral assertion failed")
        tests.append(test)
    return {"schema_version": 1, "task": metadata["id"],
            "task_version": metadata["version"], "status": "completed",
            "score": round(raw * 100, 10), "max_score": 100, "tests": tests,
            "execution": execution,
            "provenance": {"template_manifest_sha256": manifest_hash,
                           "verifier_hash": expected_verifier_hash,
                           "solution_hash": report["solutionHash"]}}
