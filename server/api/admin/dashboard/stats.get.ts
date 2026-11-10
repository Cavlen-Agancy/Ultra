export default defineEventHandler(async (event) => {
  // Any authenticated admin user can view the dashboard stats
  const user = await requireAuth(event)
  const canViewFinancials = user.isSuper || user.permissions.includes('dashboard.financials.view')

  const [
    totalOrders,
    pendingOrders,
    totalProducts,
    totalCategories,
    revenueAggregate,
    recentOrdersRaw,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'Pending' } }),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.aggregate({
      where: {
        status: { notIn: ['Cancelled', 'Rejected', 'Failed'] },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerGovernorat: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, stock: true, minStock: true },
    }),
  ])

  const lowStockCount = lowStockProducts.filter(p => p.stock <= p.minStock).length

  const recentOrders = recentOrdersRaw.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerGovernorat: o.customerGovernorat,
    status: o.status,
    totalAmount: canViewFinancials ? Number(o.totalAmount || 0) : null,
    createdAt: o.createdAt,
    itemCount: o._count.items,
  }))

  return {
    stats: {
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCategories,
      totalRevenue: canViewFinancials ? Number(revenueAggregate._sum.totalAmount || 0) : null,
      lowStockCount,
    },
    recentOrders,
  }
})
