import { defineStore } from 'pinia'
import { fetchOrders, fetchOrderById } from '@/api/orders'
import type { Order } from '@/types/order'
import { createResourceCollection } from './resourceCollection'

export const useOrdersStore = defineStore('orders', () => {
  const res = createResourceCollection<Order>({
    idOf: (o) => o.orderId,
    fetchAll: fetchOrders,
    fetchById: fetchOrderById,
  })

  return {
    orders: res.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    detailsHydrated: res.detailsHydrated,
    orderMap: res.map,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadOrderDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
  }
})
