import test from "node:test"
import assert from "node:assert/strict"
import { agentFirstGreeting } from "../src/demo/call-start-messages.js"

test("agent-first greeting uses reviewed localized copy", () => {
  assert.equal(agentFirstGreeting("en"), "Hello, I’m Woxza’s AI assistant. Thanks for trying our demo. What business do you run?")
  assert.equal(agentFirstGreeting("te"), "హాయ్, నేను Woxza యొక్క AI అసిస్టెంట్‌ని. మా డెమో ట్రై చేసినందుకు థాంక్స్. మీరు ఏ బిజినెస్ నడుపుతున్నారు?")
  assert.equal(agentFirstGreeting("ta"), "ஹாய், நான் Woxza-வோட AI அசிஸ்டன்ட். எங்க டெமோவை ட்ரை பண்ணதுக்கு நன்றி. நீங்க என்ன பிசினஸ் நடத்துறீங்க?")
})

test("agent-first greeting retains English as the fallback until Spanish copy is reviewed", () => {
  assert.equal(agentFirstGreeting("es"), agentFirstGreeting("en"))
})
