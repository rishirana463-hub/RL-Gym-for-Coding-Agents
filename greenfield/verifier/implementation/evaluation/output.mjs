import { StringDecoder } from 'node:string_decoder';

export function parseEvent(line) {
  try {
    const value = JSON.parse(line);
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value.event === 'string') return value;
  } catch {}
}

// Keep diagnostics and incomplete event lines bounded while streaming full logs.
export function createOutput({ onText = () => {}, onLine, secret = '', tailLimit = 2000, lineLimit = 65_536 } = {}) {
  if (!Number.isInteger(tailLimit) || tailLimit < 0 || !Number.isInteger(lineLimit) || lineLimit < 1) throw new RangeError('Invalid output limits');
  if (typeof secret !== 'string') throw new TypeError('Output secret must be a string');
  const decoder = new StringDecoder('utf8');
  let tail = '', line = '', dropping = false, carry = '', ended = false;

  function emit(text) {
    if (!text) return;
    tail = tailLimit ? (tail + text).slice(-tailLimit) : '';
    onText(text);
  }

  function redact(text, final = false) {
    if (!secret) { emit(text); return; }
    carry += text;
    let index;
    while ((index = carry.indexOf(secret)) !== -1) {
      emit(carry.slice(0, index) + '[REDACTED]');
      carry = carry.slice(index + secret.length);
    }
    // Retain enough text to recognize a key split across arbitrary chunks.
    const length = final ? carry.length : Math.max(0, carry.length - secret.length + 1);
    emit(carry.slice(0, length));
    carry = carry.slice(length);
  }

  function lines(text) {
    if (!onLine) return;
    let start = 0;
    for (;;) {
      const newline = text.indexOf('\n', start);
      const segment = text.slice(start, newline === -1 ? undefined : newline);
      if (!dropping) {
        if (line.length + segment.length <= lineLimit) line += segment;
        else { line = ''; dropping = true; }
      }
      if (newline === -1) return;
      if (!dropping) onLine(line);
      line = ''; dropping = false; start = newline + 1;
    }
  }

  function accept(text) { lines(text); redact(text); }
  return {
    write(chunk) {
      if (ended) throw new Error('Output stream already ended');
      accept(decoder.write(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
    },
    end() {
      if (ended) return;
      ended = true;
      accept(decoder.end());
      if (onLine && line && !dropping) onLine(line);
      line = ''; dropping = false;
      redact('', true);
    },
    get tail() { return tail; },
    get bufferedLength() { return line.length + carry.length; }
  };
}
