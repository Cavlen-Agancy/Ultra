<script setup lang="ts">
import { Pause, Play } from 'lucide-vue-next'

const { locale } = useI18n()

interface Statement {
  heading: string
  sentence?: string
}

const props = withDefaults(defineProps<{
  statements: Statement[]
}>(), {
  statements: () => [],
})

const active = ref(0)
const paused = ref(false)
const AUTOPLAY_MS = 6000

let timer: ReturnType<typeof setInterval> | null = null

const statement = computed(() => props.statements[active.value] || null)

function goTo(index: number) {
  if (index < 0 || index >= props.statements.length) return
  active.value = index
}

function next() {
  if (props.statements.length <= 1) return
  active.value = (active.value + 1) % props.statements.length
}

function toggle() {
  paused.value = !paused.value
}

function resetAutoplay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (props.statements.length > 1 && !paused.value) {
    timer = setInterval(next, AUTOPLAY_MS)
  }
}

onMounted(() => {
  resetAutoplay()
})

watch(() => [props.statements.length, paused.value], () => {
  resetAutoplay()
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="ultra-grid-section">
    <div class="container-editorial py-16 sm:py-20">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="statement" :key="active">
          <h2
            class="font-display uppercase text-brand-red leading-[0.95] tracking-[0.04em]"
            style="font-size: clamp(40px, 6.5vw, 88px); line-height: 0.95;"
          >
            {{ statement.heading }}
          </h2>
          <p
            v-if="statement.sentence"
            class="mt-4 max-w-3xl text-lg font-semibold leading-8 text-black sm:text-2xl sm:leading-9"
          >
            {{ statement.sentence }}
          </p>
        </div>
      </Transition>

      <div class="mt-8 flex items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-black/25 bg-white/70 text-black transition-colors hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
          :aria-label="locale === 'ar' ? (paused ? 'تشغيل' : 'إيقاف مؤقت') : (paused ? 'Play' : 'Pause')"
          @click="toggle"
        >
          <Play v-if="paused" class="h-4 w-4" aria-hidden="true" />
          <Pause v-else class="h-4 w-4" aria-hidden="true" />
        </button>

        <div class="flex items-center gap-2">
          <button
            v-for="(item, index) in props.statements"
            :key="index"
            type="button"
            class="h-1.5 border-0 bg-black/25 transition-all"
            :class="index === active ? 'w-8 bg-brand-red' : 'w-1.5 hover:bg-black/45'"
            :aria-label="locale === 'ar' ? `اذهب إلى العبارة ${index + 1}` : `Go to statement ${index + 1}`"
            :aria-current="index === active ? 'true' : undefined"
            @click="goTo(index)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
