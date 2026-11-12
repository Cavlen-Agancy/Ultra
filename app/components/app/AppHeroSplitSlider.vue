<script setup lang="ts">
interface HeroSlideMedia {
  desktop?: string | null
  mobile?: string | null
}

const props = withDefaults(defineProps<{
  slides: HeroSlideMedia[]
  headingLines: string[]
  subtitle?: string
  warranty?: string
  ctaLabel?: string
  ctaHref?: string
}>(), {
  slides: () => [],
  headingLines: () => ['Ultra Store'],
  subtitle: '',
  warranty: '',
  ctaLabel: '',
  ctaHref: '/products',
})

const AUTOPLAY_MS = 6000
const SWIPE_THRESHOLD_PX = 40

const { locale } = useI18n()
const localePath = useLocalePath()

const activeIndex = ref(0)
const isHovered = ref(false)
const hasFocus = ref(false)
const prefersReducedMotion = ref(false)
const touchStart = ref<{ x: number, y: number } | null>(null)

// Each configured slide is its own slide; no empty or duplicated slides.
const slideItems = computed<HeroSlideMedia[]>(() => {
  const normalized = props.slides
    .map(slide => ({
      desktop: slide?.desktop || null,
      mobile: slide?.mobile || null,
    }))
    .filter(slide => slide.desktop || slide.mobile)
  return normalized.length ? normalized : [{ desktop: null, mobile: null }]
})
const canNavigate = computed(() => slideItems.value.length > 1)
const paused = computed(() => isHovered.value || hasFocus.value || prefersReducedMotion.value)
const safeIndex = computed(() => activeIndex.value % slideItems.value.length)
const isRtl = computed(() => locale.value === 'ar')

let autoplayTimer: ReturnType<typeof setInterval> | null = null
let motionQuery: MediaQueryList | null = null

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function restartAutoplay() {
  stopAutoplay()
  if (!canNavigate.value || paused.value) return
  autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS)
}

function nextSlide() {
  if (!canNavigate.value) return
  activeIndex.value = (safeIndex.value + 1) % slideItems.value.length
  restartAutoplay()
}

function prevSlide() {
  if (!canNavigate.value) return
  activeIndex.value = (safeIndex.value - 1 + slideItems.value.length) % slideItems.value.length
  restartAutoplay()
}

function goToSlide(index: number) {
  if (index < 0 || index >= slideItems.value.length) return
  activeIndex.value = index
  restartAutoplay()
}

function onTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1) {
    touchStart.value = null
    return
  }
  const touch = event.touches[0]!
  touchStart.value = { x: touch.clientX, y: touch.clientY }
}

function onTouchEnd(event: TouchEvent) {
  const start = touchStart.value
  touchStart.value = null
  if (!start || !canNavigate.value) return

  const touch = event.changedTouches[0]
  if (!touch) return

  const dx = touch.clientX - start.x
  const dy = touch.clientY - start.y

  // Vertical intent belongs to the page, not the slideshow.
  if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dy) > Math.abs(dx)) return

  // RTL slides advance with a rightward swipe, LTR with a leftward swipe.
  const goNext = isRtl.value ? dx > 0 : dx < 0
  if (goNext) nextSlide()
  else prevSlide()
}

function onTouchCancel() {
  touchStart.value = null
}

function pauseForHover() {
  isHovered.value = true
  restartAutoplay()
}

function resumeAfterHover() {
  isHovered.value = false
  restartAutoplay()
}

function pauseForFocus() {
  hasFocus.value = true
  restartAutoplay()
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && (event.currentTarget as HTMLElement).contains(next)) return
  hasFocus.value = false
  restartAutoplay()
}

function onMotionChange(event: MediaQueryListEvent) {
  prefersReducedMotion.value = event.matches
  restartAutoplay()
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = motionQuery.matches
    motionQuery.addEventListener('change', onMotionChange)
  }
  restartAutoplay()
})

onBeforeUnmount(() => {
  stopAutoplay()
  motionQuery?.removeEventListener('change', onMotionChange)
})
</script>

<template>
  <section
    class="group relative isolate h-[60svh] min-h-[420px] overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white md:h-[75svh]"
    role="region"
    aria-roledescription="carousel"
    :aria-label="locale === 'ar' ? 'عرض شرائح الواجهة' : 'Homepage hero slideshow'"
    :tabindex="canNavigate ? 0 : undefined"
    style="touch-action: pan-y pinch-zoom;"
    @mouseenter="pauseForHover"
    @mouseleave="resumeAfterHover"
    @focusin="pauseForFocus"
    @focusout="onFocusOut"
    @keydown.left.prevent="prevSlide"
    @keydown.right.prevent="nextSlide"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @touchcancel.passive="onTouchCancel"
  >
    <div class="absolute inset-0">
      <div
        v-for="(slide, index) in slideItems"
        :key="`${index}-${slide.desktop || slide.mobile || 'empty'}`"
        class="absolute inset-0 bg-ink-soft transition-opacity duration-700 motion-reduce:transition-none"
        :class="index === safeIndex ? 'opacity-100' : 'opacity-0'"
        :aria-hidden="index === safeIndex ? undefined : 'true'"
      >
        <picture v-if="slide.desktop || slide.mobile">
          <source
            v-if="slide.desktop && slide.mobile"
            media="(min-width: 768px)"
            :srcset="slide.desktop || undefined"
          />
          <img
            :src="slide.mobile || slide.desktop || undefined"
            alt=""
            class="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-10"
      style="background-image: linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.35) 45%, transparent 85%);"
    />

    <div class="container-editorial absolute inset-x-0 bottom-0 z-20 flex h-full items-end pb-14 sm:pb-20">
      <div class="max-w-4xl">
        <h1
          class="font-display uppercase text-white leading-[0.96] tracking-[0.02em]"
          style="font-size: clamp(40px, 7vw, 96px); line-height: 0.96;"
        >
          <span v-for="line in props.headingLines" :key="line" class="block">{{ line }}</span>
        </h1>
        <p
          v-if="props.warranty"
          class="mt-3 max-w-xl text-xs leading-5 text-white/75 sm:text-sm sm:leading-6"
        >
          {{ props.warranty }}
        </p>
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
      <div class="absolute bottom-4 left-1/2 z-30 flex w-fit -translate-x-1/2 items-center gap-0.5 sm:bottom-6">
        <button
          v-for="(slide, index) in slideItems"
          :key="index"
          type="button"
          class="group/indicator flex h-6 w-6 items-center justify-center border-0 bg-transparent p-0"
          :aria-label="locale === 'ar' ? `اذهب إلى الشريحة ${index + 1}` : `Go to slide ${index + 1}`"
          :aria-current="index === safeIndex ? 'true' : undefined"
          @click="goToSlide(index)"
        >
          <span
            class="block h-1.5 bg-white/55 transition-all motion-reduce:transition-none"
            :class="index === safeIndex ? 'w-8 bg-white' : 'w-1.5 group-hover/indicator:bg-white/80'"
          />
        </button>
      </div>
    </template>

    <div class="sr-only" aria-live="polite">
      <template v-if="slideItems.length > 1">
        {{ locale === 'ar' ? `الشريحة ${safeIndex + 1} من ${slideItems.length}` : `Slide ${safeIndex + 1} of ${slideItems.length}` }}
      </template>
      <template v-else>Hero</template>
    </div>
  </section>
</template>
