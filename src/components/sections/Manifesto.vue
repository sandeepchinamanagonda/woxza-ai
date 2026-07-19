<template>
  <section id="about" class="manifesto landing-section">
    <div class="glow"></div>

    <div class="container-custom">
      <aside class="manifesto-label">
        <span>OUR MANIFESTO</span>
        <p>Built for the people who answer the calls and the people waiting on the other end.</p>
      </aside>

      <article class="manifesto-story">
        <span class="section-tag">WHY WE BUILT WOXZA</span>

        <h2 class="display-heading">No one should have to choose which customer gets heard.</h2>

        <div class="story-copy">
          <p>
            There was one desk, one phone, and one person trying to be everywhere at once.
          </p>

          <p>
            Every ring asked for something: an appointment, an answer, or a little
            reassurance. When the day got busy, someone had to wait. Sometimes, that
            person never called back.
          </p>

          <p>
            Woxza gives a business room to breathe. It welcomes the customer a
            thousand kilometres away with the same patience as the person next door,
            listening, helping, and following through even when the team is already
            giving everything they have.
          </p>

          <p>
            The people behind the business get something back too: time to solve the
            hard problem, sit with a customer who needs more than a quick answer, and
            do the work only they can do.
          </p>

          <p class="closing-line">
            Being there for everyone once felt impossible. Now, it can simply be how
            the business runs.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.manifesto {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 84% 28%, rgba(20, 38, 77, .1), transparent 30%),
    linear-gradient(128deg, #ffffff 0%, #fafbfc 48%, #f0f3f7 100%);
}

.glow {
  position: absolute;
  width: 780px;
  height: 780px;
  right: -280px;
  top: -260px;
  border-radius: 50%;
  background: conic-gradient(from 210deg, rgba(20, 38, 77, .02), rgba(20, 38, 77, .16), rgba(20, 38, 77, .04));
  filter: blur(70px);
  pointer-events: none;
}

.container-custom {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: clamp(290px, 24vw, 340px) minmax(0, 1fr);
  gap: clamp(54px, 6.5vw, 104px);
  align-items: start;
}

.manifesto-label {
  position: sticky;
  top: 150px;
  padding-top: 14px;
}

.manifesto-label span {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #14264d;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .28em;
}

.manifesto-label span::before {
  content: "";
  width: 52px;
  height: 2px;
  background: #2563eb;
}

.manifesto-label p {
  max-width: 285px;
  margin: 32px 0 0 66px;
  color: #6f7d95;
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.62;
  letter-spacing: -.012em;
}

.manifesto-story {
  position: relative;
  max-width: 980px;
  padding: clamp(54px, 6vw, 84px);
  overflow: hidden;
  border: 1px solid rgba(20, 38, 77, .1);
  border-radius: 36px;
  background: rgba(255, 255, 255, .82);
  box-shadow: 0 40px 100px rgba(20, 38, 77, .1);
  backdrop-filter: blur(18px);
}

.manifesto-story::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: linear-gradient(90deg, #2563eb, rgba(37, 99, 235, .15), transparent 72%);
}

.section-tag {
  display: inline-flex;
  padding: 9px 15px;
  border: 1px solid rgba(20, 38, 77, .12);
  border-radius: 999px;
  color: #14264d;
  background: rgba(20, 38, 77, .045);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .2em;
  margin-bottom: 34px;
}

.manifesto-story h2 {
  max-width: 860px;
  margin: 0 0 54px;
  color: #11152b;
  font-size: clamp(36px, 3.6vw, 54px);
  font-weight: 750;
  line-height: .98;
  letter-spacing: -.055em;
  text-wrap: balance;
}

.story-copy {
  max-width: 780px;
  padding-left: 32px;
  border-left: 2px solid rgba(37, 99, 235, .3);
}

.story-copy p {
  margin: 0 0 28px;
  color: #58657b;
  font-size: 17px;
  line-height: 1.85;
  text-wrap: pretty;
}

.story-copy p:first-child {
  color: #14264d;
  font-size: 19px;
  font-weight: 650;
  line-height: 1.65;
}

.story-copy .closing-line {
  margin-bottom: 0;
  color: #14264d;
  font-weight: 650;
}

@media (max-width: 1100px) {
  .container-custom { grid-template-columns: 1fr; gap: 46px; }
  .manifesto-label { position: static; }
  .manifesto-label p { max-width: 360px; }
}

@media (max-width: 768px) {
  .container-custom { width: 92%; }
  .manifesto-label p { margin-left: 0; }
  .manifesto-story { padding: 38px 30px; border-radius: 26px; }
  .manifesto-story h2 { margin-bottom: 38px; font-size: 38px; }
  .story-copy { padding-left: 22px; }
  .story-copy p { font-size: 16px; line-height: 1.8; }
  .story-copy p:first-child { font-size: 19px; }
}

@media (max-width: 480px) {
  .manifesto-story { padding: 32px 24px; }
  .manifesto-story h2 { font-size: 32px; }
  .story-copy { padding-left: 18px; }
}
</style>
