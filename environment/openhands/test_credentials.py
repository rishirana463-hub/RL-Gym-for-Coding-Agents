import io
import json
import unittest
from credentials import read_api_key


class CredentialInputTests(unittest.TestCase):
    def test_reads_json_string_and_closes_input(self):
        stream = io.BytesIO((json.dumps("test-with-unicode-\u03b1-and-\n-newline") + "\n").encode())
        self.assertEqual(read_api_key(stream), "test-with-unicode-\u03b1-and-\n-newline")
        self.assertTrue(stream.closed)

    def test_rejects_missing_oversized_or_nonstring_input(self):
        for value in [b"", b'"unfinished"', b"{}\n", b'""\n', b'"' + b"a" * 65_536 + b'"\n']:
            stream = io.BytesIO(value)
            with self.assertRaises((ValueError, json.JSONDecodeError)):
                read_api_key(stream)
            self.assertTrue(stream.closed)


if __name__ == "__main__":
    unittest.main()
