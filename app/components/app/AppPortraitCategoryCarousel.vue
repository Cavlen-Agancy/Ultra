<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

interface CategoryItem {
  id?: string | number
  slug: string
  nameAr?: string | null
  nameEn?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
  coverImagePath?: string | null
}

const { locale } = useI18n()
const localePath = useLocalePath()

const props = withDefaults(defineProps<{
  items: CategoryItem[]
  title?: string
  subtitle?: string
}>(), {
  items: () => [],
  title: '',
  subtitle: '',
})

const scrollerRef = ref<HTMLElement | null>(null)
const displayedItems = computed(() => props.items.slice(0, 4))

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

const titleStyles = [
  'font-heading text-[28px] font-bold italic leading-[1.03] tracking-[0.05em] text-white',
  'font-heading text-[28px] font-bold leading-[1.03] tracking-[0.22em] text-white',
  'font-heading text-[28px] font-semibold leading-[1.03] tracking-[0.08em] text-white',
  'font-heading text-[28px] font-semibold italic leading-[1.03] tracking-[0.03em] text-white',
]
</script>

<template>
  <div class="relative">
    <div class="container-editorial relative">
      <div
        v-if="props.title || props.subtitle"
        class="mb-8 max-w-2xl"
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

      <div v-if="displayedItems.length" class="relative">
        <div ref="scrollerRef" class="flex gap-4 overflow-x-auto pb-2 no-scrollbar sm:gap-4">
          <NuxtLink
            v-for="(item, index) in displayedItems"
            :key="item.slug"
            :to="localePath(`/products/${item.slug}`)"
            class="group relative block w-[70vw] shrink-0 snap-start sm:w-[45%] lg:w-[23%]"
          >
            <div class="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-ink-soft">
              <img
                v-if="item.coverImagePath"
                :src="item.coverImagePath"
                :alt="(locale === 'ar' ? item.nameAr : item.nameEn) || ''"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
                loading="lazy"
              />
              <!-- Dark grid-panel fallback keeps imageless categories looking intentional. -->
              <div
                v-else
                class="absolute inset-0 bg-[var(--ultra-grid-pattern)] [background-size:30px_30px] opacity-40"
                aria-hidden="true"
              />
              <div class="text-over-photo absolute inset-0" />

              <div class="absolute inset-x-4 bottom-4">
                <h3 :class="titleStyles[index] || titleStyles[0]">
                  {{ locale === 'ar' ? item.nameAr : item.nameEn }}
                </h3>
                <p class="mt-2 text-[13px] font-medium leading-5 text-white/70">
                  {{ (locale === 'ar' ? item.descriptionAr : item.descriptionEn) || '' }}
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="pointer-events-none absolute end-0 top-0 h-full w-24">
          <div class="pointer-events-auto flex h-full items-center justify-end bg-gradient-to-l from-[#FDF8F7] via-white/90 to-transparent pe-2">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center border-none bg-transparent text-black/45 transition-colors hover:text-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
              :aria-label="locale === 'ar' ? 'الفئة التالية' : 'Scroll categories'"
              @click="scrollNext"
            >
              <ChevronRight
                class="h-6 w-6 rtl:rotate-180"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
