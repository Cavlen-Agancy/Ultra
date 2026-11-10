<script setup lang="ts">
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{ placement: string }>()

const { locale } = useI18n()
const localePath = useLocalePath()

const { data } = await useAsyncData('home-banners', () =>
  $fetch<{ banners: any[] }>('/api/banners'),
)

const slotBanners = computed(() =>
  (data.value?.banners || []).filter(b => b.placement === props.placement),
)

const currentIndex = ref(0)
const current = computed(() => slotBanners.value[currentIndex.value] || null)

watch(slotBanners, (items) => {
  if (currentIndex.value >= items.length) currentIndex.value = 0
})

function titleOf(b: any) {
  return locale.value === 'ar' ? (b.titleAr || b.titleEn) : (b.titleEn || b.titleAr)
}

function descOf(b: any) {
  return locale.value === 'ar' ? (b.descriptionAr || b.descriptionEn) : (b.descriptionEn || b.descriptionAr)
}

function btnOf(b: any) {
  return locale.value === 'ar' ? (b.buttonTextAr || b.buttonTextEn) : (b.buttonTextEn || b.buttonTextAr)
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url)
}

function next() {
  if (slotBanners.value.length <= 1) return
  currentIndex.value = (currentIndex.value + 1) % slotBanners.value.length
}

function prev() {
  if (slotBanners.value.length <= 1) return
  currentIndex.value = (currentIndex.value - 1 + slotBanners.value.length) % slotBanners.value.length
}

function goTo(index: number) {
  currentIndex.value = index
}
</script>

<template>
  <section
    v-if="current"
    class="relative overflow-hidden border-y border-black/10 bg-black text-white"
    :class="Number(current.widthPercent) < 100 ? 'py-8 sm:py-12' : ''"
    :aria-label="titleOf(current)"
  >
    <div :class="Number(current.widthPercent) < 100 ? 'container-editorial' : ''">
      <div
        class="relative overflow-hidden"
        :class="Number(current.widthPercent) < 100 ? 'mx-auto' : ''"
        :style="{ maxWidth: Number(current.widthPercent) < 100 ? `${current.widthPercent}%` : 'none' }"
      >
        <img
          v-if="current.backgroundImagePath"
          :src="current.backgroundImagePath"
          :alt="titleOf(current)"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black/55" aria-hidden="true" />
        <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />

        <Transition
          mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div :key="current.id" class="relative flex min-h-[340px] items-end px-5 py-10 sm:min-h-[420px] sm:px-10 sm:py-14 lg:px-14">
            <div class="max-w-2xl">
              <p class="eyebrow !text-white/55">Ultra</p>
              <h2 class="mt-3 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {{ titleOf(current) }}
              </h2>
              <p v-if="descOf(current)" class="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                {{ descOf(current) }}
              </p>
              <NuxtLink
                v-if="btnOf(current) && current.buttonLinkValue && !isExternal(current.buttonLinkValue)"
                :to="localePath(current.buttonLinkValue)"
                class="btn-primary mt-7"
              >
                {{ btnOf(current) }}
                <ArrowRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </NuxtLink>
              <a
                v-else-if="btnOf(current) && current.buttonLinkValue"
                :href="current.buttonLinkValue"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary mt-7"
              >
                {{ btnOf(current) }}
                <ArrowRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Transition>

        <div v-if="slotBanners.length > 1" class="absolute bottom-4 end-4 flex items-center gap-2 sm:bottom-6 sm:end-8">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center border border-white/30 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            :aria-label="locale === 'ar' ? 'الشريط السابق' : 'Previous banner'"
            @click="prev"
          >
            <ChevronLeft class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center border border-white/30 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            :aria-label="locale === 'ar' ? 'الشريط التالي' : 'Next banner'"
            @click="next"
          >
            <ChevronRight class="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>

        <div v-if="slotBanners.length > 1" class="absolute bottom-5 start-5 flex items-center gap-1.5 sm:bottom-8 sm:start-10 lg:start-14">
          <button
            v-for="(banner, index) in slotBanners"
            :key="banner.id"
            type="button"
            class="h-1.5 transition-all"
            :class="index === currentIndex ? 'w-5 bg-ultra-500' : 'w-1.5 bg-white/45 hover:bg-white'"
            :aria-label="locale === 'ar' ? `عرض الشريط ${index + 1}` : `Show banner ${index + 1}`"
            :aria-current="index === currentIndex ? 'true' : undefined"
            @click="goTo(index)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
