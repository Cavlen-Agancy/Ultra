import { getGrantedVipCategorySlugs } from '../../utils/vip-access'

export default defineEventHandler(async (event) => {
  const categories = await getGrantedVipCategorySlugs(event)
  return { categories }
})