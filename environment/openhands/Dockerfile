FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 AS node
FROM python:3.12.13-slim-bookworm@sha256:4766d8b510c428e595d74b9cc5bbb2fae8e26316fffb4adc89908d79aacd58a2
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/ /usr/local/lib/node_modules/
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && apt-get update \
    && apt-get install -y --no-install-recommends bash git ripgrep tmux ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /opt/harness/requirements.txt
RUN pip install --no-cache-dir -r /opt/harness/requirements.txt
COPY run.py /opt/harness/run.py
RUN useradd --create-home --uid 1000 agent && mkdir -p /workspace && chown agent:agent /workspace
USER agent
WORKDIR /workspace
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["python", "/opt/harness/run.py"]
