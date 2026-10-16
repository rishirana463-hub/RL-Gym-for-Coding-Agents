"""Adapter regressions: incomplete/invalid scores must never become model zeros."""
import copy
import importlib.util
from pathlib import Path
import os
import sys
import tempfile
import unittest

source = Path(__file__).parent / "template-files/reward.py"
spec = importlib.util.spec_from_file_location("reward", source)
reward = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reward)
sys.modules["reward"] = reward
wrapper_spec = importlib.util.spec_from_file_location("run_tests", source.parent / "run_tests.py")
wrapper = importlib.util.module_from_spec(wrapper_spec)
wrapper_spec.loader.exec_module(wrapper)


class RewardTests(unittest.TestCase):
    def setUp(self):
        self.scoring = {"checks": [{"id": "a", "title": "one", "points": 25},
                                    {"id": "b", "title": "two", "points": 75}]}
        self.report = {"complete": True, "executed": 2, "total": 2, "passed": 1,
                       "checkHash": "verifier", "solutionHash": "candidate", "score": 0.25,
                       "checks": [{"id": "a", "passed": True}, {"id": "b", "passed": False}]}

    def convert(self, report):
        return reward.make_reward(report, self.scoring, {"id": "stockroom", "version": 1},
                                  "manifest", "verifier", "trusted-local")

    def test_partial_credit_preserved(self):
        result = self.convert(self.report)
        self.assertEqual(result["score"], 25)
        self.assertEqual([test["score"] for test in result["tests"]], [25, 0])

    def test_incomplete_or_duplicate_results_rejected(self):
        for mutation in [{"complete": False}, {"executed": 1},
                         {"checks": [{"id": "a", "passed": True}, {"id": "a", "passed": False}]}]:
            report = copy.deepcopy(self.report)
            report.update(mutation)
            with self.assertRaises(ValueError):
                self.convert(report)

    def test_wrong_version_or_invented_score_rejected(self):
        for mutation in [{"checkHash": "stale"}, {"score": 0}, {"score": None},
                         {"score": float("nan")}, {"passed": 2}]:
            report = copy.deepcopy(self.report)
            report.update(mutation)
            with self.assertRaises(ValueError):
                self.convert(report)

    def test_windows_environment_names_preserved_case_insensitively(self):
        result = wrapper.runtime_env({"SYSTEMROOT": "C:/Windows", "Path": "runtime-path",
                                      "LLM_API_KEY": "must-stay-private"}, False)
        self.assertEqual(result, {"SYSTEMROOT": "C:/Windows", "Path": "runtime-path"})

    def test_missing_workspace_has_null_score_and_existing_records_are_preserved(self):
        import json
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as folder:
            directory = Path(folder)
            with patch.dict(os.environ, {"TASK_DIR": str(directory / "task"),
                                         "WORKSPACE": str(directory / "missing"),
                                         "OUT_DIR": str(directory / "out")}, clear=True):
                self.assertEqual(wrapper.main(), 2)
                output = directory / "out/reward.json"
                original = output.read_bytes()
                self.assertIsNone(json.loads(original)["score"])
                self.assertEqual(wrapper.main(), 2)
                self.assertEqual(output.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
