import { onMounted } from "vue"

export function useParticles(){

onMounted(()=>{

const hero=document.querySelector(".hero")

if(!hero) return

for(let i=0;i<18;i++){

const p=document.createElement("span")

p.className="particle"

p.style.left=Math.random()*100+"%"

p.style.animationDelay=Math.random()*8+"s"

p.style.animationDuration=8+Math.random()*8+"s"

hero.appendChild(p)

}

})

}