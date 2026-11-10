<script setup lang="ts">
import {
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
  Youtube,
} from 'lucide-vue-next'
import IconWhatsApp from './IconWhatsApp.vue'

const props = withDefaults(defineProps<{
  /** Visual style: footer (dark icon buttons) or card (light tiles). */
  variant?: 'footer' | 'card'
}>(), {
  variant: 'footer',
})

// Shared async-data key so Footer / Contact page / Homepage reuse one request.
const { data: contact } = await useAsyncData('site-contact-social', () =>
  $fetch<any>('/api/settings/contact'),
)

interface SocialLink {
  key: string
  label: string
  href: string
  icon: any
  hover: string
}

const links = computed<SocialLink[]>(() => {
  const c = contact.value
  if (!c) return []
  const out: SocialLink[] = []
  const push = (key: string, label: string, href: string | null | undefined, icon: any, hover: string) => {
    if (href && href.trim()) out.push({ key, label, href: href.trim(), icon, hover })
  }
  push('facebook', 'Facebook', c.socialFacebook, Facebook, 'hover:border-ultra-500 hover:bg-ultra-500 hover:text-white')
  push('instagram', 'Instagram', c.socialInstagram, Instagram, 'hover:border-ultra-500 hover:bg-ultra-500 hover:text-white')
  push('tiktok', 'TikTok', c.socialTiktok, Music2, 'hover:border-ultra-500 hover:bg-ultra-500 hover:text-white')
  push('youtube', 'YouTube', c.socialYoutube, Youtube, 'hover:border-ultra-500 hover:bg-ultra-500 hover:text-white')
  push('linkedin', 'LinkedIn', c.socialLinkedin, Linkedin, 'hover:border-ultra-500 hover:bg-ultra-500 hover:text-white')
  push('x', 'X (Twitter)', c.socialX, Twitter, 'hover:border-ultra-500 hover:bg-ultra-500 hover:text-white')
  // WhatsApp click-to-chat reuses the existing chat number (not a social field).
  const num = toWhatsAppIntl(c.contactWhatsapp || c.contactPhone1 || '')
  if (num) {
    out.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${num}`,
      icon: IconWhatsApp,
      hover: 'hover:border-ultra-500 hover:bg-ultra-500 hover:text-white',
    })
  }
  return out
})
</script>

<template>
  <div v-if="links.length" class="flex items-center gap-2.5" :class="variant === 'card' ? 'flex-wrap' : ''">
    <a
      v-for="l in links"
      :key="l.key"
      :href="l.href"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="l.label"
      :title="l.label"
      class="flex items-center justify-center transition-all active:scale-95"
      :class="[
        variant === 'footer'
          ? 'h-9 w-9 border border-white/15 text-white/55 hover:border-white hover:bg-white hover:text-black'
          : 'h-10 w-10 rounded-xl bg-border/40 text-muted hover:-translate-y-0.5 hover:shadow-sm',
        l.hover,
      ]"
    >
      <component :is="l.icon" class="h-4 w-4" aria-hidden="true" />
    </a>
  </div>
</template>
