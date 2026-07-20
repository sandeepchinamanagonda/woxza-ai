export function createContextualDemoState() {
  return {
    status:"idle",
    business:"",
    currentProcess:"",
    primaryPain:"",
    scale:"",
    topic:"",
    callerGoal:""
  }
}

export function beginContextualDemo(state, { business, currentProcess, primaryPain, scale, topic, callerGoal }) {
  if (!String(business || "").trim()) return { ok:false, error:"business context is required" }
  state.status = "collecting"
  state.business = String(business).trim()
  state.currentProcess = String(currentProcess || "").trim()
  state.primaryPain = String(primaryPain || "").trim()
  state.scale = String(scale || "").trim()
  state.topic = String(topic || "customer inquiry").trim()
  state.callerGoal = String(callerGoal || "").trim()
  return { ok:true, details:{ ...state } }
}

export function completeContextualDemo(state) {
  if (state.status !== "responding") return { ok:false, error:"the simulated customer answer has not been delivered" }
  state.status = "completed"
  return { ok:true, details:{ ...state } }
}

export function prepareContextualDemoResponse(state, { customerRequest, details, simulatedResult }) {
  if (state.status !== "collecting") return { ok:false, error:"no contextual demo is collecting customer details" }
  if (!String(customerRequest || "").trim() || !String(details || "").trim()) return { ok:false, error:"customer request and details are required" }
  state.status = "responding"
  state.customerRequest = String(customerRequest).trim()
  state.details = String(details).trim()
  state.simulatedResult = String(simulatedResult || "").trim()
  return { ok:true, details:{ ...state } }
}
