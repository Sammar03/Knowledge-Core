"""Self-check for follow-up query rewriting. Run: python test_rewrite.py"""
from app.generate import _rewrite_query

# No history → standalone question is returned unchanged (no API call made).
assert _rewrite_query("What is the leave policy?", []) == "What is the leave policy?"
assert _rewrite_query("", []) == ""

print("ok")
