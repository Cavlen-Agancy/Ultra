export default defineEventHandler((event) => {
  const q = getQuery(event)
  if (q.theme === 'light' || q.theme === 'dark') {
    setCookie(event, 'ultra-color-mode', q.theme, { maxAge: 86400, path: '/' })
  }
})
