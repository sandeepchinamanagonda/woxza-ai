<template>
  <section id="approach" class="benefits-section landing-section relative w-full overflow-hidden bg-[#06142a] px-4 text-white sm:px-6 md:px-10">
    <div class="background-grid absolute inset-0 pointer-events-none"></div>

    <div class="relative mx-auto w-full max-w-[1400px]">
      <div class="mx-auto mb-12 max-w-3xl text-center sm:mb-24">
        <p class="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-blue-300 sm:text-xs">
          Transformation, delivered
        </p>
        <h2
          class="display-heading font-sans text-center text-3xl font-bold text-white sm:text-4xl md:text-5xl"
          style="letter-spacing: -0.04em"
        >
          What changes when Woxza gets to work
        </h2>
        <p class="mx-auto mt-5 max-w-2xl text-sm font-light leading-relaxed text-white/60 sm:text-base">
          Three everyday workflows, transformed from loose conversations into clear action.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <article class="relative h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#081a34] p-6 sm:h-[460px] sm:p-8">
          <div class="absolute top-1/2 -left-[420px] h-[460px] w-[460px] -translate-y-1/2 rounded-full bg-[#2563eb] opacity-50 blur-3xl"></div>
          <div class="relative z-10 flex h-full flex-col">
            <div class="mb-5 flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-300">
                <PhoneCall class="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span class="text-[10px] font-medium uppercase tracking-[0.18em] text-blue-300">Front desk</span>
            </div>
            <h3 class="text-xl font-light leading-tight text-white sm:text-2xl">
              Every call ends with<br />
              a confirmed action
            </h3>

            <p class="mt-12 max-w-[290px] text-[13px] font-light leading-relaxed text-white/70 sm:mt-20 sm:text-[14px]">
              Woxza answers, understands the request, checks live availability, and leaves the team with a complete next step—not another note to decode.
            </p>

            <div class="mt-auto flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <strong class="block text-2xl font-light text-white">6 min</strong>
                <span class="mt-1 block text-[10px] uppercase tracking-[0.12em] text-white/45">admin removed per call</span>
              </div>
              <span class="rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-[10px] text-blue-200">24/7 coverage</span>
            </div>
          </div>
        </article>

        <article class="relative h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#081a34] p-6 sm:h-[460px] sm:p-8">
          <div class="absolute -bottom-36 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2563eb] opacity-40 blur-3xl"></div>
          <div class="relative z-10 flex h-full flex-col">
            <div class="mb-5 flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-300">
                <Workflow class="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span class="text-[10px] font-medium uppercase tracking-[0.18em] text-blue-300">Operations</span>
            </div>
            <h3 class="text-xl font-light leading-tight text-white sm:text-2xl">
              Clear ownership for<br />
              every request
            </h3>

            <p class="mt-12 max-w-[305px] text-[13px] font-light leading-relaxed text-white/70 sm:mt-20 sm:text-[14px]">
              Woxza captures the request, fills in what's missing, assigns the right team, and keeps the record current as it moves.
            </p>

            <div class="mt-auto flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <strong class="block text-2xl font-light text-white">11 min</strong>
                <span class="mt-1 block text-[10px] uppercase tracking-[0.12em] text-white/45">handling time removed</span>
              </div>
              <div class="text-right">
                <strong class="block text-sm font-light text-blue-200">1 owner</strong>
                <span class="mt-1 block text-[9px] uppercase tracking-[0.1em] text-white/35">live status</span>
              </div>
            </div>
          </div>
        </article>

        <article class="relative h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#081a34] p-6 sm:h-[460px] sm:p-8">
          <div class="absolute -right-28 -top-28 h-56 w-56 rounded-full bg-[#2563eb] opacity-50 blur-3xl"></div>
          <div class="relative z-10 flex h-full flex-col">
            <div class="mb-5 flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-300">
                <TrendingUp class="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span class="text-[10px] font-medium uppercase tracking-[0.18em] text-blue-300">Revenue</span>
            </div>
            <h3 class="text-xl font-light leading-tight text-white sm:text-2xl">
              Follow up while<br />
              the customer's intent is fresh
            </h3>

            <p class="mt-12 max-w-[305px] text-[13px] font-light leading-relaxed text-white/70 sm:mt-20 sm:text-[14px]">
              The reason, timing, and urgency behind every conversation reach sales, while the CRM is updated at the same time.
            </p>

            <div class="mt-auto flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <strong class="block text-2xl font-light text-white">2.4×</strong>
                <span class="mt-1 block text-[10px] uppercase tracking-[0.12em] text-white/45">faster response</span>
              </div>
              <div class="text-right">
                <strong class="block text-sm font-light text-blue-200">3 signals</strong>
                <span class="mt-1 block text-[9px] uppercase tracking-[0.1em] text-white/35">intent captured</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-8 sm:mt-10">
        <p class="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-blue-300/80">
          Operational impact
        </p>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
          <article class="impact-card">
            <span class="impact-icon">
              <Clock3 aria-hidden="true" />
            </span>
            <strong>70%</strong>
            <p>Less manual follow-up</p>
          </article>

          <article class="impact-card">
            <span class="impact-icon">
              <PhoneCall aria-hidden="true" />
            </span>
            <strong>24/7</strong>
            <p>Calls keep moving</p>
          </article>

          <article class="impact-card">
            <span class="impact-icon">
              <TrendingUp aria-hidden="true" />
            </span>
            <strong>2–5×</strong>
            <p>Faster request resolution</p>
          </article>

          <article class="impact-card impact-card-featured">
            <span class="impact-icon">
              <ListTodo aria-hidden="true" />
            </span>
            <strong>0</strong>
            <p>Dropped requests</p>
          </article>
        </div>
      </div>

      <p class="mt-5 text-center text-[9px] font-light tracking-wide text-white/30">
        Illustrative workflow targets. Actual results vary by call type, volume, and system setup.
      </p>
    </div>
  </section>
</template>

<script setup>
import { Clock3, ListTodo, PhoneCall, TrendingUp, Workflow } from "lucide-vue-next"
</script>

<style scoped>
.benefits-section {
  font-family:var(--font-primary);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

.background-grid {
  background:
    linear-gradient(rgba(147,197,253,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(147,197,253,.035) 1px,transparent 1px),
    radial-gradient(circle at 10% 18%,rgba(37,99,235,.17),transparent 31%),
    radial-gradient(circle at 90% 82%,rgba(59,130,246,.11),transparent 30%);
  background-size:64px 64px,64px 64px,auto,auto;
}

.impact-card {
  min-height: 138px;
  padding: 18px 20px;
  border: 2px solid transparent;
  border-radius: 20px;
  background: #fff;
  box-shadow: none;
  transition: transform .3s ease,border-color .3s ease;
}

.impact-card:hover {
  border-color: rgba(96,165,250,.55);
  transform: translateY(-4px);
}

.impact-card-featured {
  border-color: #5b8cff;
  box-shadow: 0 0 0 1px rgba(91,140,255,.12);
}

.impact-icon {
  display: grid;
  width: 46px;
  height: 46px;
  margin-bottom: 16px;
  place-items: center;
  border-radius: 14px;
  color: #10213d;
  background: rgba(59,130,246,.1);
}

.impact-icon svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.impact-card strong {
  display: block;
  color: #0f2343;
  font-size: clamp(25px,2vw,31px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -.035em;
}

.impact-card p {
  max-width: 180px;
  margin: 8px 0 0;
  color: #667085;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.3;
}

@media(max-width:640px) {
  .impact-card {
    min-height: 132px;
    padding: 16px;
  }

  .impact-icon {
    margin-bottom: 14px;
  }
}

@media(prefers-reduced-motion:reduce) {
  .impact-card {
    transition: none;
  }
}

</style>
