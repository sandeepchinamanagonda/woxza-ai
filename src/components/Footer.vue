<template>
<footer class="footer">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="footer-card">

<div class="top">

<div class="brand">

<h2>Woxza</h2>

<p>
Building voice AI that answers calls, books appointments,
updates systems and keeps every customer conversation moving
</p>

<div class="contact-card">

<div class="contact-heading">
<span>LET'S TALK</span>
<strong>Start a conversation with Woxza</strong>
</div>

<a href="tel:+918125869888">
<span class="contact-icon"><Phone /></span>
<span><small>Call us</small><b>081258 69888</b></span>
</a>

<a
href="https://mail.google.com/mail/?view=cm&fs=1&to=nagarjunainnovations@gmail.com"
target="_blank"
rel="noopener noreferrer"
>
<span class="contact-icon"><Mail /></span>
<span><small>Email us</small><b>nagarjunainnovations@gmail.com</b></span>
</a>

</div>

</div>

<div class="links">

<div>

<h4>Company</h4>

<a href="#about">About</a>
<a href="#services">Services</a>
<a href="#programs">Programs</a>

</div>

<div>

<h4>Resources</h4>

<a href="#faq">FAQ</a>
<a href="#contact">Waitlist</a>
<a href="#">Insights</a>

</div>

<div>

<h4>Legal</h4>

<button type="button" class="footer-link" @click="legalView = 'privacy'">Privacy</button>
<button type="button" class="footer-link" @click="legalView = 'terms'">Terms</button>

</div>

<div>

<h4>Connect</h4>

<a
href="https://www.linkedin.com/in/woxza-india-940ba4422/"
target="_blank"
rel="noopener noreferrer"
aria-label="Open Woxza India on LinkedIn"
>LinkedIn</a>
<a
href="https://www.instagram.com/woxza.india/"
target="_blank"
rel="noopener noreferrer"
aria-label="Open Woxza India on Instagram"
>Instagram</a>
<a
href="https://mail.google.com/mail/?view=cm&fs=1&to=nagarjunainnovations@gmail.com"
target="_blank"
rel="noopener noreferrer"
>Email us</a>

</div>

</div>

</div>

<div class="divider"></div>

<div class="bottom">

<p>© 2026 Woxza, all rights reserved</p>

<p>Voice AI Platform • Waitlist Access • Customer Automation</p>

</div>

</div>

</div>

</footer>

<Teleport to="body">
<div v-if="legalView" class="legal-overlay" role="presentation" @click.self="legalView = null">
<section class="legal-modal" role="dialog" aria-modal="true" :aria-labelledby="`${legalView}-title`">
<button class="legal-close" type="button" aria-label="Close legal information" @click="legalView = null">
<X />
</button>

<template v-if="legalView === 'privacy'">
<span class="legal-kicker">WOXZA LEGAL</span>
<h2 id="privacy-title">Privacy Policy</h2>
<p class="legal-updated">Last updated: 17 July 2026</p>

<div class="legal-copy">
<p>This policy explains how Woxza collects and uses information when you visit our website, join our waitlist, request a demo, or contact us.</p>

<h3>Information we collect</h3>
<p>We may collect the details you choose to provide, such as your name, email address, phone number, company information, role, and responses submitted through our forms. We may also receive basic technical information such as browser type, device type, pages visited, and approximate location.</p>

<h3>How we use it</h3>
<p>We use this information to respond to enquiries, manage waitlist and demo requests, improve our website and services, prevent misuse, and send relevant product updates where permitted. We do not sell your personal information.</p>

<h3>Sharing and retention</h3>
<p>Information may be shared with trusted service providers that help us operate the website and communicate with you, or where required by law. We retain information only for as long as reasonably necessary for these purposes.</p>

<h3>Your choices</h3>
<p>You may ask to access, correct, or delete the personal information you have provided, or opt out of marketing messages, by contacting us.</p>

<h3>Contact</h3>
<p>Email <a href="mailto:nagarjunainnovations@gmail.com">nagarjunainnovations@gmail.com</a> or call <a href="tel:+918125869888">081258 69888</a> with privacy questions or requests.</p>
</div>
</template>

<template v-else>
<span class="legal-kicker">WOXZA LEGAL</span>
<h2 id="terms-title">Terms of Use</h2>
<p class="legal-updated">Last updated: 17 July 2026</p>

<div class="legal-copy">
<p>These terms apply when you access or use the Woxza website. By using this website, you agree to these terms.</p>

<h3>Website use</h3>
<p>You may use this website only for lawful purposes. You must not attempt to disrupt the website, gain unauthorised access, introduce harmful code, scrape protected content, or misuse any forms or communication channels.</p>

<h3>Product information</h3>
<p>Material on this website is provided for general information. Product descriptions, availability, features, integrations, and launch timelines may change as Woxza develops. Joining the waitlist does not guarantee access on a particular date.</p>

<h3>Intellectual property</h3>
<p>The Woxza name, branding, website design, text, graphics, and other original content are owned by Woxza or used with permission. They may not be copied or commercially reused without written consent.</p>

<h3>Third-party services</h3>
<p>The website may link to third-party platforms. Their availability, content, security, and privacy practices are controlled by those providers and are subject to their own terms.</p>

<h3>Liability and changes</h3>
<p>The website is provided on an “as available” basis. To the extent permitted by law, Woxza is not responsible for indirect loss arising from use of the website. We may update these terms and will publish the revised date here.</p>

<h3>Contact</h3>
<p>For questions about these terms, email <a href="mailto:nagarjunainnovations@gmail.com">nagarjunainnovations@gmail.com</a>.</p>
</div>
</template>
</section>
</div>
</Teleport>
</template>

<script setup>
import { ref } from "vue"
import { Mail, Phone, X } from "lucide-vue-next"

const legalView = ref(null)
</script>

<style scoped>

.footer{
position:relative;
padding:140px 0 50px;
background:var(--woxza-blue);
overflow:hidden;
}

.grid-bg{
position:absolute;
inset:0;
background-image:
linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
background-size:46px 46px;
background-position:0 23px,23px 0;
opacity:.45;
animation:none;
}

.glow{
display:none;
}

.glow-left{
width:520px;
height:520px;
left:-180px;
top:-180px;
background:rgba(var(--woxza-accent-rgb),.16);
}

.glow-right{
width:620px;
height:620px;
right:-260px;
bottom:-220px;
background:rgba(var(--woxza-accent-rgb),.08);
}

.footer-card{
position:relative;
z-index:2;
padding:70px;
border-radius:34px;
background:var(--woxza-blue-2);
border:1px solid rgba(255,255,255,.08);
}

.top{
display:grid;
grid-template-columns:1.3fr 1fr;
gap:80px;
}

.brand h2{
font-size:56px;
font-weight:800;
letter-spacing:.04em;
color:white;
margin-bottom:24px;
}

.brand p{
max-width:460px;
font-size:17px;
line-height:1.9;
color:#94a3b8;
}

.contact-card{
max-width:500px;
margin-top:34px;
padding:22px;
border:1px solid rgba(147,197,253,.16);
border-radius:20px;
background:rgba(255,255,255,.035);
}

.contact-heading{
margin-bottom:18px;
}

.contact-heading span{
display:block;
margin-bottom:6px;
color:#60a5fa;
font-size:9px;
font-weight:800;
letter-spacing:.22em;
}

.contact-heading strong{
color:#fff;
font-size:16px;
font-weight:650;
}

.contact-card>a{
display:grid;
grid-template-columns:40px minmax(0,1fr);
gap:12px;
align-items:center;
padding:12px 0;
text-decoration:none;
border-top:1px solid rgba(255,255,255,.07);
}

.contact-icon{
display:grid;
width:38px;
height:38px;
place-items:center;
border-radius:12px;
color:#93c5fd;
background:rgba(59,130,246,.12);
}

.contact-icon svg{
width:17px;
height:17px;
}

.contact-card>a>span:last-child{
min-width:0;
}

.contact-card small,
.contact-card b{
display:block;
}

.contact-card small{
margin-bottom:3px;
color:#64748b;
font-size:9px;
font-weight:700;
letter-spacing:.12em;
text-transform:uppercase;
}

.contact-card b{
color:#dbeafe;
font-size:13px;
font-weight:600;
overflow-wrap:anywhere;
transition:color .25s ease;
}

.contact-card>a:hover b{
color:#fff;
}

.links{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:40px;
}

.links h4{
font-size:12px;
letter-spacing:.22em;
font-weight:700;
color:#dbeafe;
margin-bottom:20px;
}

.links a,
.footer-link{
display:block;
margin-bottom:14px;
padding:0;
border:0;
background:none;
font:inherit;
text-align:left;
text-decoration:none;
color:#94a3b8;
overflow-wrap:anywhere;
cursor:pointer;
transition:.3s;
}

.links a:hover,
.footer-link:hover{
color:white;
padding-left:6px;
}

.divider{
height:1px;
margin:60px 0 26px;
background:rgba(255,255,255,.08);
}

.bottom{
display:flex;
justify-content:space-between;
align-items:center;
font-size:14px;
color:#64748b;
}

.legal-overlay{
position:fixed;
z-index:1000;
inset:0;
display:grid;
place-items:center;
padding:20px;
background:rgba(2,8,23,.78);
backdrop-filter:blur(10px);
}

.legal-modal{
position:relative;
width:min(760px,100%);
max-height:min(84vh,820px);
overflow-y:auto;
padding:48px;
border:1px solid rgba(96,165,250,.24);
border-radius:24px;
background:#f8fafc;
box-shadow:0 30px 90px rgba(0,0,0,.4);
color:#0b1f3a;
}

.legal-close{
position:absolute;
top:18px;
right:18px;
display:grid;
width:40px;
height:40px;
place-items:center;
border:1px solid #dbe6f4;
border-radius:50%;
background:#fff;
color:#0b1f3a;
cursor:pointer;
}

.legal-close svg{
width:18px;
height:18px;
}

.legal-kicker{
display:block;
margin-bottom:10px;
color:#2563eb;
font-size:10px;
font-weight:800;
letter-spacing:.2em;
}

.legal-modal h2{
margin:0;
font-size:36px;
letter-spacing:-.04em;
}

.legal-updated{
margin:8px 0 30px;
color:#64748b;
font-size:13px;
}

.legal-copy{
display:grid;
gap:12px;
}

.legal-copy h3{
margin:14px 0 0;
font-size:16px;
}

.legal-copy p{
margin:0;
color:#475569;
font-size:14px;
line-height:1.75;
}

.legal-copy a{
color:#1d4ed8;
font-weight:650;
}
@media(max-width:900px){

.footer{
padding:100px 0 40px;
}

.footer-card{
padding:40px 24px;
}

.top{
grid-template-columns:1fr;
gap:50px;
}

.links{
grid-template-columns:repeat(2,1fr);
}

.bottom{
flex-direction:column;
gap:14px;
text-align:center;
}

.brand h2{
font-size:42px;
}

}

@media(max-width:600px){

.links{
grid-template-columns:1fr;
}

.brand h2{
font-size:34px;
}

.brand p{
font-size:15px;
}

.legal-modal{
padding:38px 22px 28px;
border-radius:20px;
}

.legal-modal h2{
font-size:29px;
}

}

</style>
