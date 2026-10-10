"""Read a bounded credential over stdin, outside the launch environment."""
import json


def read_api_key(stream):
    try:
        line = stream.readline(65_538)
    finally:
        stream.close()
    if len(line) > 65_537 or not line.endswith(b"\n"):
        raise ValueError("Missing or oversized credential input")
    key = json.loads(line)
    if not isinstance(key, str) or not key:
        raise ValueError("Credential input must be a nonempty JSON string")
    return key
