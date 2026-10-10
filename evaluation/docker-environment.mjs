// Docker is a trusted host client. Preserve its connection, TLS, proxy and SSH
// configuration while keeping model credentials out of child process metadata.
export function dockerEnvironment(source = process.env) {
  return Object.fromEntries(Object.entries(source).filter(([name]) => !['llm_api_key', 'llm_base_url'].includes(name.toLowerCase())));
}
