FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8
RUN apt-get update && apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 agent \
    && mkdir -p /work/candidate /logs/verifier /opt/private \
    && chown agent:agent /work/candidate /logs/verifier \
    && chmod 700 /opt/private
USER agent
WORKDIR /work/candidate
CMD ["sleep", "infinity"]
