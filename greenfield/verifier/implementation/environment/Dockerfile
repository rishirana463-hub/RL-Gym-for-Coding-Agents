FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8
ARG SOLUTION=task/public
WORKDIR /workspace
COPY --chown=node:node ${SOLUTION}/ /workspace/
COPY --chown=node:node task/instruction.md /workspace/instruction.md
COPY app-setup/ /opt/app-setup/
RUN chmod +x /opt/app-setup/*.sh && mkdir -p /data && chown node:node /data
ENV HOST=0.0.0.0 PORT=3000 DATA_DIR=/data
USER node
RUN node /opt/app-setup/lifecycle.mjs build /workspace
EXPOSE 3000
CMD ["node", "server.mjs"]
