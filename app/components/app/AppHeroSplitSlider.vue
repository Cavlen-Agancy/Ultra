<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface HeroPanel {
  src?: string | null
  alt?: string
  focus?: string
}

const props = withDefaults(defineProps<{
  media: Array<string | null>
  headingLines: string[]
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
}>(), {
  media: () => [],
  headingLines: () => ['Ultra Store'],
  subtitle: '',
  ctaLabel: '',
  ctaHref: '/products',
})

const PANEL_COUNT = 4
const SLIDE_COUNT = 3
const AUTOPLAY_MS = 6000

const { locale } = useI18n()
const localePath = useLocalePath()

const activeIndex = ref(0)
const paused = ref(false)
const prefersReducedMotion = ref(false)

const normalizedMedia = computed(() => props.media.filter(Boolean) as string[])
const canNavigate = computed(() => normalizedMedia.value.length > 1)

const slides = computed(() => {
  if (!normalizedMedia.value.length) {
    return [Array.from({ length: PANEL_COUNT }, () => ({ src: null, alt: '', focus: '' }))]
  }

  const result: HeroPanel[][] = []
  for (let i = 0; i < SLIDE_COUNT; i++) {
    const panels: HeroPanel[] = []
    for (let panelIndex = 0; panelIndex < PANEL_COUNT; panelIndex++) {
      const source = normalizedMedia.value[(i + panelIndex) % normalizedMedia.value.length]
      panels.push({
        src: source,
        alt: '',
        // Different real image crops keep the layout alive without inventing media.
        focus: i === 0 ? '50% 50%' : i === 1 ? '50% 35%' : '50% 75%',
      })
    }
    result.push(panels)
  }
  return result
})

const safeIndex = computed(() => {
  if (!slides.value.length) return 0
  return activeIndex.value % slides.value.length
})

let autoplayTimer: ReturnType<typeof setInterval> | null = null

function nextSlide() {
  if (!canNavigate.value) return
  activeIndex.value = (safeIndex.value + 1) % slides.value.length
}

function prevSlide() {
  if (!canNavigate.value) return
  activeIndex.value = (safeIndex.value - 1 + slides.value.length) % slides.value.length
}

function goToSlide(index: number) {
  if (index < 0 || index >= slides.value.length) return
  activeIndex.value = index
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function startAutoplay() {
  stopAutoplay()
  if (!canNavigate.value) return
  autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS)
}

function pauseAutoplay() {
  paused.value = true
}

function resumeAutoplay() {
  paused.value = false
}

function resetAutoplay() {
  stopAutoplay()
  if (!canNavigate.value) return
  if (!prefersReducedMotion.value && !paused.value) startAutoplay()
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    prefersReducedMotion.value = true
  }
  resetAutoplay()
})

onBeforeUnmount(stopAutoplay)
</script>

<template>
  <section
    class="group relative isolate h-[60svh] overflow-hidden bg-black md:h-[75svh]"
    role="region"
    aria-roledescription="carousel"
    aria-label="Ultra Store hero"
    @mouseenter="pauseAutoplay"
    @mouseleave="resumeAutoplay"
    @focusin="pauseAutoplay"
    @focusout="resumeAutoplay"
    @keydown.left.prevent="prevSlide"
    @keydown.right.prevent="nextSlide"
  >
    <div class="relative grid h-full w-full grid-cols-2 md:grid-cols-4">
      <div
        v-for="(panel, index) in slides[safeIndex] || []"
        :key="index"
        class="relative overflow-hidden bg-ink-soft"
        :class="index < 2 ? '' : 'hidden md:block'"
      >
        <img
          v-if="panel.src"
          :src="panel.src"
          :alt="panel.alt || ''"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-104"
          :style="panel.focus ? { objectPosition: panel.focus } : undefined"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-10"
      style="background-image: linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.35) 45%, transparent 85%);"
    />

    <div class="container-editorial absolute inset-x-0 bottom-0 z-20 flex h-full items-end pb-10 sm:pb-14">
      <div class="max-w-4xl">
        <h1
          class="font-display uppercase text-white leading-[0.96] tracking-[0.02em]"
          style="font-size: clamp(40px, 7vw, 96px); line-height: 0.96;"
        >
          <span v-for="line in props.headingLines" :key="line" class="block">{{ line }}</span>
        </h1>
        <p
          v-if="props.subtitle"
          class="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7"
        >
          {{ props.subtitle }}
        </p>

        <div v-if="props.ctaLabel" class="mt-7 flex flex-wrap items-center gap-3">
          <NuxtLink :to="localePath(props.ctaHref || '/products')" class="btn-primary">
            {{ props.ctaLabel }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <template v-if="canNavigate">
      <button
        type="button"
        class="ultra-carousel-control absolute start-3 top-1/2 z-30 -translate-y-1/2 border-none bg-transparent text-white/80 transition-colors hover:text-white"
        :aria-label="locale === 'ar' ? 'الشريحة السابقة' : 'Previous slide'"
        @click="prevSlide"
      >
        <ChevronLeft class="h-7 w-7 rtl:rotate-180" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="ultra-carousel-control absolute end-3 top-1/2 z-30 -translate-y-1/2 border-none bg-transparent text-white/80 transition-colors hover:text-white"
        :aria-label="locale === 'ar' ? 'الشريحة التالية' : 'Next slide'"
        @click="nextSlide"
      >
        <ChevronRight class="h-7 w-7 rtl:rotate-180" aria-hidden="true" />
      </button>

      <div class="absolute bottom-6 left-1/2 z-30 flex w-fit -translate-x-1/2 items-center gap-2">
        <button
          v-for="(slide, index) in slides"
          :key="index"
          type="button"
          class="h-1.5 border-0 bg-white/55 transition-all"
          :class="index === safeIndex ? 'w-8' : 'w-1.5 hover:bg-white/80'"
          :aria-label="locale === 'ar' ? `اذهب إلى الشريحة ${index + 1}` : `Go to slide ${index + 1}`"
          :aria-current="index === safeIndex ? 'true' : undefined"
          @click="goToSlide(index)"
        />
      </div>
    </template>

    <div class="sr-only" aria-live="polite">
      <template v-if="slides.length > 1">
        {{ locale === 'ar' ? `الشريحة ${safeIndex + 1} من ${slides.length}` : `Slide ${safeIndex + 1} of ${slides.length}` }}
      </template>
      <template v-else>Hero</template>
    </div>
  </section>
</template>
