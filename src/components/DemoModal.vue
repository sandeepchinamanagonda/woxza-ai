<template>
  <Teleport to="body">

    <transition name="fade">

      <div
        v-if="isOpen"
        class="overlay"
        @click.self="$emit('close')"
      >

        <div class="modal">

          <!-- Header -->

          <div class="modal-header">

            <div>

              <span class="eyebrow">
                BOOK A CONSULTATION
              </span>

              <h2>
                Let's start a conversation.
              </h2>

            </div>

            <button
              class="close"
              @click="$emit('close')"
            >
              ✕
            </button>

          </div>

          <!-- Intro -->

          <p class="intro">
            Tell us a little about your organisation and we'll reach out to
            discuss how AI employees can fit into your business.
          </p>

          <!-- Form -->

          <form
            class="form"
            @submit.prevent="handleSubmit"
          >

            <input
              v-model="form.name"
              placeholder="Full Name"
              required
            >

            <input
              v-model="form.email"
              type="email"
              placeholder="Email Address"
              required
            >

            <input
              v-model="form.company"
              placeholder="Organisation"
              required
            >

            <textarea
              v-model="form.message"
              rows="5"
              placeholder="Tell us about your project..."
            ></textarea>

            <button
              class="btn-primary"
              type="submit"
            >
              Send Enquiry →
            </button>

          </form>

        </div>

      </div>

    </transition>

  </Teleport>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(["close"]);

const form = ref({
  name: "",
  email: "",
  company: "",
  message: ""
});

const handleSubmit = () => {
  alert("Thank you. We'll contact you shortly.");

  form.value = {
    name: "",
    email: "",
    company: "",
    message: ""
  };

  emit("close");
};
</script>

<style scoped>

.overlay{

position:fixed;

inset:0;

background:rgba(25,25,25,.45);

backdrop-filter:blur(10px);

display:flex;

justify-content:center;

align-items:center;

padding:30px;

z-index:1000;

}

.modal{

width:min(720px,100%);

background:#fff;

border-radius:28px;

padding:50px;

box-shadow:0 40px 120px rgba(0,0,0,.12);

}

.modal-header{

display:flex;

justify-content:space-between;

align-items:flex-start;

margin-bottom:20px;

}

.eyebrow{

font-size:12px;

letter-spacing:.28em;

color:#9C8168;

font-family:"IBM Plex Sans";

display:block;

margin-bottom:12px;

}

.modal h2{

font-family:"Source Serif 4",serif;

font-size:42px;

font-weight:500;

line-height:1.1;

}

.intro{

margin-bottom:36px;

max-width:560px;

}

.close{

border:none;

background:none;

font-size:22px;

cursor:pointer;

color:#777;

}

.form{

display:grid;

gap:18px;

}

textarea{

resize:none;

}

.fade-enter-active,
.fade-leave-active{

transition:.3s;

}

.fade-enter-from,
.fade-leave-to{

opacity:0;

transform:translateY(20px);

}

@media(max-width:768px){

.modal{

padding:30px;

border-radius:22px;

}

.modal h2{

font-size:32px;

}

}

</style>