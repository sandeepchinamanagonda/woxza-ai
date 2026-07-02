import { onMounted,onUnmounted } from "vue"

export function useCursorGlow(){

let glow

const move=(e)=>{

if(!glow) return

glow.style.left=e.clientX+"px"
glow.style.top=e.clientY+"px"

}

onMounted(()=>{

glow=document.createElement("div")

glow.className="cursor-glow"

document.body.appendChild(glow)

window.addEventListener("mousemove",move)

})

onUnmounted(()=>{

window.removeEventListener("mousemove",move)

glow?.remove()

})

}