# Human audio review gate

Before enabling this behavior beyond local testing, a human reviewer must
listen to replayed incomplete-turn calls in Telugu, Hindi, Tamil, and English.
For each replay record: whether the caller was cut off, pause before the cue,
duplicate wording, naturalness of the cue, and whether the broader fallback
arrived only after one incomplete retry. This is a required manual gate; an
automated transcript test cannot mark it passed.
