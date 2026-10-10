// Candidate processes receive runtime paths and locale settings, never host credentials.
const allowed = new Set(['path', 'systemroot', 'windir', 'comspec', 'pathext', 'temp', 'tmp', 'tmpdir', 'lang', 'lc_all', 'tz', 'home', 'userprofile']);

export function runtimeEnvironment(source = process.env) {
  return Object.fromEntries(Object.entries(source).filter(([name, value]) => allowed.has(name.toLowerCase()) && typeof value === 'string'));
}
