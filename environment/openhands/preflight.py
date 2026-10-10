"""Validate SDK/tool setup offline; never run a model conversation."""
import json
from importlib.metadata import version

from pydantic import SecretStr
from openhands.sdk import LLM, Agent, Conversation, Tool
from openhands.tools.file_editor import FileEditorTool
from openhands.tools.terminal import TerminalTool


llm = LLM(
    model="openai/gpt-5",
    api_key=SecretStr("offline-preflight-placeholder"),
    reasoning_effort="medium",
    log_completions=False,
)
agent = Agent(
    llm=llm,
    tools=[Tool(name=TerminalTool.name), Tool(name=FileEditorTool.name)],
)
conversation = Conversation(
    agent=agent,
    workspace="/workspace",
    max_iteration_per_run=1,
    visualizer=None,
)
# Sending a message only queues input. Deliberately never call conversation.run().
conversation.send_message("Offline setup check. No model call is permitted.")
status = conversation.state.execution_status.value
assert llm.metrics.accumulated_cost == 0
conversation.close()
print(json.dumps({
    "status": "setup-validated-no-model-call",
    "sdk": version("openhands-sdk"),
    "tools": version("openhands-tools"),
    "reasoningEffort": "medium",
    "conversationStatus": status,
    "modelAttempts": 0,
    "providerRequests": 0,
}))
