<script setup lang="ts">
import { ChevronRight, Play } from 'lucide-vue-next'

interface VideoCard {
  id?: string | number
  src?: string | null
  poster?: string | null
  title?: string
  caption?: string
  href?: string
}

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  items: VideoCard[]
}>(), {
  title: '',
  subtitle: '',
  items: () => [],
})

const hasItems = computed(() => props.items.length > 0)
const { locale } = useI18n()

const scrollerRef = ref<HTMLElement | null>(null)

// RTL containers advance toward the visual left (negative scrollLeft step).
function scrollNext() {
  const scroller = scrollerRef.value
  if (!scroller) return
  const direction = locale.value === 'ar' ? -1 : 1
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  scroller.scrollBy({
    left: direction * scroller.clientWidth * 0.8,
    behavior: reduced ? 'auto' : 'smooth',
  })
}
</script>

<template>
  <section v-if="hasItems" class="bg-surface-gray">
    <div class="container-editorial py-14 sm:py-20">
      <div
        v-if="props.title || props.subtitle"
        class="max-w-2xl"
      >
        <h2
          v-if="props.title"
          class="font-heading text-2xl font-bold tracking-tight text-black sm:text-[36px] sm:leading-[1.05]"
        >
          {{ props.title }}
        </h2>
        <p
          v-if="props.subtitle"
          class="mt-3 text-sm leading-6 text-[#5A5A5A] sm:text-base sm:leading-7"
        >
          {{ props.subtitle }}
        </p>
      </div>

      <div class="relative mt-8">
        <div ref="scrollerRef" class="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <article
            v-for="(item, index) in props.items"
            :key="`${item.id ?? 'video'}-${index}`"
            class="group relative w-[70vw] shrink-0 overflow-hidden rounded-lg sm:w-[46%] lg:w-[23%]"
          >
            <div class="relative aspect-[3/4] w-full overflow-hidden bg-black">
              <img
                v-if="item.poster"
                :src="item.poster"
                :alt="item.title || ''"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
                loading="lazy"
              />
              <div v-else class="h-full w-full bg-ink-soft" />

              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

              <span
                v-if="item.href"
                class="absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <span class="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white">
                  <Play class="h-5 w-5 fill-current" />
                </span>
              </span>

              <div v-if="item.caption" class="absolute bottom-4 inset-x-4 text-white text-[18px] font-semibold">
                {{ item.caption }}
              </div>
            </div>
          </article>
        </div>

        <div class="pointer-events-none absolute end-0 top-0 h-full w-24 hidden items-center justify-end lg:flex">
          <span class="pointer-events-auto">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center border-none bg-transparent text-black/45 transition-colors hover:text-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
              :aria-label="locale === 'ar' ? 'المقطع التالي' : 'Scroll videos'"
              @click="scrollNext"
            >
              <ChevronRight class="h-6 w-6 rtl:rotate-180" aria-hidden="true" />
            </button>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
