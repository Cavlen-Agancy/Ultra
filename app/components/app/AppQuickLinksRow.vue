<script setup lang="ts">
interface QuickLink {
  label: string
  href: string
  image?: string | null
  badge?: string
}

withDefaults(defineProps<{
  items: QuickLink[]
}>(), {
  items: () => [],
})
</script>

<template>
  <div class="container-editorial">
    <div class="flex gap-3 overflow-x-auto pb-1 no-scrollbar sm:gap-4">
      <NuxtLink
        v-for="(item, index) in items"
        :key="`${item.href}-${index}`"
        :to="item.href"
        class="group flex w-[140px] shrink-0 snap-start flex-col items-center text-center sm:w-[165px]"
      >
        <div class="relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-[#F7F7F7]">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.label"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
            loading="lazy"
          />
          <!-- Intentional brand fallback when no real image exists yet. -->
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-white bg-[var(--ultra-grid-pattern)] [background-size:30px_30px]"
            aria-hidden="true"
          >
            <span class="font-display text-[34px] leading-none text-black/12 transition-transform duration-500 group-hover:scale-110">U</span>
          </div>

          <span
            v-if="item.badge"
            class="absolute end-1.5 top-1.5 bg-brand-red px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white"
          >
            {{ item.badge }}
          </span>
        </div>

        <p class="mt-2.5 line-clamp-2 text-[14px] font-medium leading-6 text-black transition-colors group-hover:text-brand-red">
          {{ item.label }}
        </p>
      </NuxtLink>
    </div>
  </div>
</template>
