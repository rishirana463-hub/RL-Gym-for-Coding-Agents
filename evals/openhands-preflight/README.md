# Offline OpenHands setup validation

[Actual clean-runner execution](https://github.com/rishirana463-hub/RL-Gym-for-Coding-Agents/actions/runs/38080385852), source `292e7cd9b443ddb04e96087aa7fa1435eb7d7a72`, passed:

- Built the pinned Node/Python/OpenHands image from scratch.
- `pip check` found no broken requirements; `packages.json` records installed versions.
- OpenHands SDK/tools 1.54.0 initialized terminal/file-editor tools and a conversation with medium reasoning.
- Two credential-input tests passed inside the container.

The setup check ran with **network disabled** and never called `conversation.run()`. Its model string and credential are offline placeholders. It made **zero provider requests and zero model attempts**. This validates installation and local SDK setup, not real provider authentication, agent execution or benchmark difficulty. Dependency consistency is not a vulnerability audit; Python dependency security auditing remains unperformed.

Full build/setup/test logs, image inspection and source/run identity are preserved here. `download.json` independently matches the downloaded ZIP SHA-256 to GitHub's artifact digest. The original ZIP remains under ignored `.runs/` locally. Model logs/scores must come from separate real attempts.
