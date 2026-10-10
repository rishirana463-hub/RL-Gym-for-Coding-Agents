"""One prompt and one OpenHands conversation.run(), inside an isolated container."""
import json
import os
import sys
from pathlib import Path
from importlib.metadata import version
from credentials import read_api_key

key = read_api_key(sys.stdin.buffer)

from pydantic import SecretStr
from openhands.sdk import LLM, Agent, Conversation, Tool
from openhands.tools.file_editor import FileEditorTool
from openhands.tools.terminal import TerminalTool


def event_callback(event):
    # Events are emitted to the host's pipe, never to the candidate workspace.
    print(json.dumps({"event": "trajectory", "data": event.model_dump(mode="json")}), flush=True)


llm = LLM(
    model=os.environ["LLM_MODEL"],
    api_key=SecretStr(key),
    base_url=os.environ.get("LLM_BASE_URL") or None,
    reasoning_effort="medium",
    log_completions=False,
)
del key
agent = Agent(llm=llm, tools=[Tool(name=TerminalTool.name), Tool(name=FileEditorTool.name)])
conversation = Conversation(
    agent=agent,
    workspace="/workspace",
    callbacks=[event_callback],
    max_iteration_per_run=int(os.environ.get("GYM_MAX_ITERATIONS", "100")),
    visualizer=None,
)
prompt = Path("/workspace/instruction.md").read_text()
print(json.dumps({"event": "harness_start", "sdk": version("openhands-sdk"), "reasoning_effort": "medium"}), flush=True)
conversation.send_message(prompt)
conversation.run()
status = conversation.state.execution_status.value
if status in {"error", "waiting_for_confirmation"}:
    raise RuntimeError(f"OpenHands did not complete a usable attempt: {status}")
print(json.dumps({"event": "harness_finished", "execution_status": status, "cost": llm.metrics.accumulated_cost}), flush=True)
