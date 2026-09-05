// The live model's input transcription is useful telemetry, but it is not an
// audit-grade record for callers who switch languages mid-sentence. This
// adapter makes the ASR source explicit and keeps provider output verbatim.
import { createSign } from "node:crypto"
import { readFile } from "node:fs/promises"
import speech from "@google-cloud/speech"

const LANGUAGE_CONFIG = {
  en:{ primary:"en-IN", alternatives:["te-IN", "hi-IN", "ta-IN"] },
  te:{ primary:"te-IN", alternatives:["en-IN", "hi-IN", "ta-IN"] },
  hi:{ primary:"hi-IN", alternatives:["en-IN", "te-IN", "ta-IN"] },
  ta:{ primary:"ta-IN", alternatives:["en-IN", "te-IN", "hi-IN"] },
  kn:{ primary:"kn-IN", alternatives:["en-IN", "te-IN", "hi-IN"] },
  ml:{ primary:"ml-IN", alternatives:["en-IN", "ta-IN", "hi-IN"] },
  mr:{ primary:"mr-IN", alternatives:["en-IN", "hi-IN", "te-IN"] },
  gu:{ primary:"gu-IN", alternatives:["en-IN", "hi-IN", "mr-IN"] },
  bn:{ primary:"bn-IN", alternatives:["en-IN", "hi-IN", "as-IN"] },
  as:{ primary:"as-IN", alternatives:["en-IN", "bn-IN", "hi-IN"] },
  pa:{ primary:"pa-IN", alternatives:["en-IN", "hi-IN", "ur-IN"] },
  ur:{ primary:"ur-IN", alternatives:["en-IN", "hi-IN", "pa-IN"] },
  es:{ primary:"es-ES", alternatives:["en-IN", "fr-FR", "hi-IN"] },
  fr:{ primary:"fr-FR", alternatives:["en-IN", "es-ES", "hi-IN"] }
}

export function sttLanguageConfig(language="en") {
  return LANGUAGE_CONFIG[String(language).toLowerCase()] || LANGUAGE_CONFIG.en
}

function recognitionResult(body, fallbackLanguage) {
  const alternatives = (body?.results || []).map(result => result?.alternatives?.[0]).filter(Boolean)
  const text = alternatives.map(alternative => alternative.transcript).filter(Boolean).join(" ").trim()
  if (!text) return null
  const confidences = alternatives.map(alternative => Number(alternative.confidence)).filter(Number.isFinite)
  return {
    text,
    confidence:confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : null,
    languageCode:body?.languageCode || fallbackLanguage,
    provider:"google-cloud-stt"
  }
}

const TOKEN_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token"

const base64Url = value => Buffer.from(value).toString("base64url")

export function createServiceAccountJwt(credentials, now=Date.now) {
  const issuedAt = Math.floor(now() / 1000)
  const header = base64Url(JSON.stringify({ alg:"RS256", typ:"JWT" }))
  const claims = base64Url(JSON.stringify({
    iss:credentials.client_email,
    scope:TOKEN_SCOPE,
    aud:TOKEN_AUDIENCE,
    iat:issuedAt,
    exp:issuedAt + 3600
  }))
  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${claims}`)
  signer.end()
  return `${header}.${claims}.${signer.sign(credentials.private_key).toString("base64url")}`
}

export function createGoogleCloudSttTranscriber({
  apiKey=process.env.GOOGLE_STT_API_KEY,
  credentialsPath=process.env.GOOGLE_APPLICATION_CREDENTIALS,
  fetchImpl=globalThis.fetch,
  readFileImpl=readFile,
  now=Date.now
}={}) {
  if (!apiKey && !credentialsPath) return null
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required for Google Cloud STT")
  let token
  let credentialsPromise

  const getCredentials = async () => {
    credentialsPromise ||= readFileImpl(credentialsPath, "utf8").then(JSON.parse)
    const credentials = await credentialsPromise
    if (!credentials?.client_email || !credentials?.private_key) throw new Error("Google application credentials must be a service-account JSON key")
    return credentials
  }
  const getAccessToken = async () => {
    if (apiKey) return null
    if (token?.expiresAt > now() + 60_000) return token.value
    const credentials = await getCredentials()
    const response = await fetchImpl(TOKEN_AUDIENCE, {
      method:"POST",
      headers:{ "content-type":"application/x-www-form-urlencoded" },
      body:new URLSearchParams({ grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer", assertion:createServiceAccountJwt(credentials, now) }).toString()
    })
    if (!response.ok) throw new Error(`Google OAuth token request failed (${response.status}): ${(await response.text()).slice(0, 400)}`)
    const body = await response.json()
    if (!body.access_token) throw new Error("Google OAuth token response did not include an access token")
    token = { value:body.access_token, expiresAt:now() + Math.max(60, Number(body.expires_in) || 3600) * 1000 }
    return token.value
  }

  return {
    provider:"google-cloud-stt",
    async transcribePcm16(audio, { language="en", signal }={}) {
      if (!audio?.length) return null
      const config = sttLanguageConfig(language)
      const accessToken = await getAccessToken()
      const endpoint = apiKey
        ? `https://speech.googleapis.com/v1/speech:recognize?key=${encodeURIComponent(apiKey)}`
        : "https://speech.googleapis.com/v1/speech:recognize"
      const response = await fetchImpl(endpoint, {
        method:"POST",
        headers:{ "content-type":"application/json", ...(accessToken ? { authorization:`Bearer ${accessToken}` } : {}) },
        signal,
        body:JSON.stringify({
          config:{
            encoding:"LINEAR16",
            sampleRateHertz:16_000,
            languageCode:config.primary,
            alternativeLanguageCodes:config.alternatives,
            enableAutomaticPunctuation:true,
            model:"latest_short"
          },
          audio:{ content:Buffer.from(audio).toString("base64") }
        })
      })
      if (!response.ok) throw new Error(`Google Cloud STT failed (${response.status}): ${(await response.text()).slice(0, 400)}`)
      return recognitionResult(await response.json(), config.primary)
    }
  }
}

export function createAuthoritativeTranscriberFromEnv(options={}) {
  return createGoogleCloudSttTranscriber(options)
}

// One gRPC stream stays open for the life of a phone call. This avoids a new
// OAuth/recognize request after every 750ms endpoint and lets STT finalize
// while the caller is still speaking.
export function createGoogleCloudStreamingTranscriber({
  credentialsPath=process.env.GOOGLE_APPLICATION_CREDENTIALS,
  clientFactory=() => new speech.SpeechClient()
}={}) {
  if (!credentialsPath) return null
  return {
    provider:"google-cloud-stt-streaming",
    start({ language="en", onError=() => {} }={}) {
      const config = sttLanguageConfig(language)
      const client = clientFactory()
      let active

      const recognitionRequest = {
        config:{
          encoding:"LINEAR16",
          sampleRateHertz:16_000,
          languageCode:config.primary,
          alternativeLanguageCodes:config.alternatives,
          enableAutomaticPunctuation:true,
          model:"latest_short"
        },
        interimResults:true,
        singleUtterance:false
      }

      const resolve = value => {
        if (!active?.resolve) return
        const pending = active
        active = undefined
        clearTimeout(pending.timer)
        pending.resolve(value)
      }
      const normalizedText = value => String(value || "").trim().replace(/\s+/g, " ")
      const appendFinal = (turn, value) => {
        const text = normalizedText(value?.text)
        if (!text) return
        const prior = turn.finals.at(-1)?.text
        // Streaming recognition occasionally repeats its latest final in a
        // later packet. Keep real consecutive segments, but never turn a
        // repeated final into duplicated caller text.
        if (normalizedText(prior) === text) return
        turn.finals.push({ ...value, text })
      }
      const materialize = current => {
        const finals = current.finals.map(item => normalizedText(item.text)).filter(Boolean)
        const latest = normalizedText(current.latest?.text)
        // A late interim can be a full revision of the prior final rather
        // than a new segment. Prefer the fuller revision in that case;
        // otherwise append it as the unfinished tail of the caller turn.
        if (latest) {
          const finalText = finals.join(" ")
          if (!finalText) finals.push(latest)
          else if (latest.includes(finalText)) finals.splice(0, finals.length, latest)
          else if (!finalText.includes(latest)) finals.push(latest)
        }
        const text = finals.join(" ").trim()
        if (!text) return null
        const confidence = current.finals.map(item => item.confidence).filter(value => value !== null).at(-1)
          ?? current.latest?.confidence ?? null
        return {
          text,
          confidence,
          languageCode:config.primary,
          provider:"google-cloud-stt-streaming",
          // The stream was explicitly ended by the carrier endpoint. Even
          // when Cloud STT omits a final flag before close, this is the one
          // complete, bounded turn result we are willing to commit.
          isFinal:Boolean(current.finals.length)
        }
      }
      const end = candidate => {
        if (!candidate?.stream || candidate.ended) return
        candidate.ended = true
        try { candidate.stream.end() } catch {}
      }

      return {
        startTurn(utteranceId) {
          if (active) {
            const prior = active
            end(prior)
            resolve(null)
          }
          const stream = client.streamingRecognize(recognitionRequest)
          const turn = active = { utteranceId, stream, finals:[], latest:null, resolve:null, timer:null, ended:false, failed:false, finalizing:false }
          stream.on("data", data => {
            if (active !== turn) return
            for (const result of data?.results || []) {
              const alternative = result?.alternatives?.[0]
              const text = String(alternative?.transcript || "").trim()
              if (!text) continue
              const candidate = { text, confidence:Number.isFinite(Number(alternative.confidence)) ? Number(alternative.confidence) : null, isFinal:Boolean(result.isFinal) }
              if (result.isFinal) appendFinal(turn, candidate)
              else turn.latest = candidate
            }
          })
          // A carrier endpoint closes the recognition stream. Only this
          // terminal event may commit the aggregate; an early STT final is a
          // segment, never permission to truncate the caller's utterance.
          stream.on("end", () => {
            if (active === turn && turn.finalizing) resolve(materialize(turn))
          })
          stream.on("error", error => {
            if (active !== turn || turn.failed) return
            turn.failed = true
            onError(error)
            resolve(null)
          })
        },
        push(audio) {
          if (audio?.length && active && !active.ended && !active.failed) {
            try { active.stream.write(audio) } catch (error) {
              active.failed = true
              onError(error)
              resolve(null)
            }
          }
        },
        finalizeTurn(utteranceId, { timeoutMs=350 }={}) {
          if (!active || active.utteranceId !== utteranceId) return Promise.resolve(null)
          const current = active
          return new Promise(resolveTurn => {
            current.finalizing = true
            current.resolve = value => resolveTurn(value)
            // Carrier VAD has already supplied trailing silence. Ending this
            // per-utterance gRPC stream tells Google to flush a final result;
            // it must never sit open while the agent is speaking.
            end(current)
            current.timer = setTimeout(() => {
              if (active === current) {
                active = undefined
                resolveTurn(materialize(current))
              }
            }, timeoutMs)
            current.timer.unref?.()
          })
        },
        close() {
          end(active)
          resolve(null)
          client.close?.()
        }
      }
    }
  }
}

export async function transcribeCallerTurn(transcriber, audio, { language, timeoutMs=850 }={}) {
  if (!transcriber || !audio?.length) return null
  const controller = new AbortController()
  let timeout
  try {
    const deadline = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort()
        reject(new Error(`Authoritative STT timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      timeout.unref?.()
    })
    return await Promise.race([transcriber.transcribePcm16(audio, { language, signal:controller.signal }), deadline])
  } finally {
    clearTimeout(timeout)
  }
}
