// Durable call memory is append-only. Do not persist partial STT, model text,
// or TTS phrases here: a reconnect may safely rebuild context from only the
// exchanges a caller actually received.
export function createConversationTurnStore({ db }={}) {
  const completeTurn = async ({
    turnId, demoCallId, turnSequence, callerText, agentText, language,
    languagePolicy={}, conversationProfile={}, conversationObjective="focused_discovery", conversationIntent={}, callerTranscriptTurnId=null, agentTranscriptTurnId=null
  }) => {
    if (!db?.connect || !turnId || !demoCallId || !callerText || !agentText) return null
    const client = await db.connect()
    try {
      await client.query("BEGIN")
      const inserted = await client.query(
        `INSERT INTO call_conversation_turns
          (turn_id,demo_call_id,turn_sequence,caller_text,agent_text,language,language_policy,conversation_profile,conversation_objective,conversation_intent,caller_transcript_turn_id,agent_transcript_turn_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10::jsonb,$11,$12)
         ON CONFLICT (turn_id) DO NOTHING
         RETURNING *`,
        [turnId,demoCallId,turnSequence,String(callerText),String(agentText),language,JSON.stringify(languagePolicy || {}),JSON.stringify(conversationProfile || {}),conversationObjective,JSON.stringify(conversationIntent || {}),callerTranscriptTurnId,agentTranscriptTurnId]
      )
      if (inserted.rows?.[0]) { await client.query("COMMIT"); return inserted.rows[0] }
      const existing = await client.query("SELECT * FROM call_conversation_turns WHERE turn_id=$1", [turnId])
      await client.query("COMMIT")
      return existing.rows?.[0] || null
    } catch (error) {
      try { await client.query("ROLLBACK") } catch {}
      throw error
    } finally { client.release() }
  }

  const loadLatestCompletedTurns = async ({ demoCallId, limit=16 }={}) => {
    if (!db?.query || !demoCallId) return []
    const size = Math.max(1, Math.min(200, Number(limit) || 16))
    const result = await db.query(
      `SELECT turn_sequence,caller_text,agent_text,language,language_policy,conversation_profile,conversation_objective,conversation_intent,completed_at
       FROM call_conversation_turns WHERE demo_call_id=$1
       ORDER BY turn_sequence DESC LIMIT $2`, [demoCallId,size]
    )
    return [...(result.rows || [])].reverse()
  }

  return { completeTurn, loadLatestCompletedTurns }
}
