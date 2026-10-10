import http from 'node:http';

// Implement the contract in instruction.md. This starter only provides health.
const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  if (req.method === 'GET' && req.url === '/health') {
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.statusCode = 501;
    res.end(JSON.stringify({ ok: false, error: { code: 'NOT_IMPLEMENTED' } }));
  }
});
server.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1', () => {
  console.log(JSON.stringify({ event: 'ready', port: server.address().port }));
});
