// Transcript rows are part of the call record, not disposable debug output.
// Serialize inserts to retain speaker order and expose flush() so a socket close
// cannot race the final caller or agent turn out of Postgres.
export function createTranscriptWriter({ db, demoCallId, onError=()=>{} }={}) {
  let tail = Promise.resolve()

  const write = (speaker, text) => {
    const value = String(text || "").trim()
    if (!value || !db?.query || !demoCallId) return Promise.resolve(null)
    const operation = tail.then(() => db.query(
      "INSERT INTO call_transcript_turns (demo_call_id,speaker,text) VALUES ($1,$2,$3) RETURNING id,created_at",
      [demoCallId, speaker, value]
    ).then(result => result.rows?.[0] || null))
    // Keep the queue healthy after a single failed write, while still giving
    // the caller a durable error event for the debug timeline.
    tail = operation.catch(error => { onError(error, { speaker, text:value }); return null })
    return tail
  }

  return { write, flush:() => tail }
}
