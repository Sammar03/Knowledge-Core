"""Self-check for the reranker id-mapping. Run: python test_rerank.py"""
from app.generate import _select_by_ids
from app.vectorstore import Retrieved


def r(text: str) -> Retrieved:
    return Retrieved(text=text, filename="f", page=1, score=0.5)


c = [r("a"), r("b"), r("c"), r("d")]

# Reorders, dedupes, ignores out-of-range ids.
assert [x.text for x in _select_by_ids([2, 1, 9, 2], c, 5)] == ["b", "a"]
# Single valid id.
assert [x.text for x in _select_by_ids([3], c, 5)] == ["c"]
# Empty -> empty (caller falls back to vector order).
assert _select_by_ids([], c, 5) == []
# Caps at top_k.
assert len(_select_by_ids([1, 2, 3, 4], c, 2)) == 2
# Ignores non-int junk from a sloppy model.
assert [x.text for x in _select_by_ids(["2", 1, None, 3], c, 5)] == ["a", "c"]

print("ok")
