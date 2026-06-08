import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/findings' },

  // Overview
  { path: '/findings', name: 'Findings', component: () => import('@/views/FindingsView.vue') },

  // Landscape
  { path: '/models', name: 'Models', component: () => import('@/views/Tmp.vue') },
  { path: '/nodes', name: 'Nodes', component: () => import('@/views/Tmp.vue') },
  { path: '/graph', name: 'Graph', component: () => import('@/views/NodeGraphView.vue') },
  { path: '/sensors', name: 'Sensors', component: () => import('@/views/Tmp.vue') },
  { path: '/filters', name: 'Filters', component: () => import('@/views/Tmp.vue') },
  { path: '/injectors', name: 'Injectors', component: () => import('@/views/Tmp.vue') },

  // Context P0
  { path: '/contexts', name: 'Contexts', component: () => import('@/views/ContextsView.vue') },

  // Structure P1
  { path: '/systems', name: 'Systems', component: () => import('@/views/SystemsView.vue') },
  { path: '/components', name: 'Components', component: () => import('@/views/Tmp.vue') },
  { path: '/apis', name: 'APIs', component: () => import('@/views/Tmp.vue') },

  // Identity P2
  { path: '/identities', name: 'Identities', component: () => import('@/views/Tmp.vue') },
  { path: '/orgunits', name: 'OrgUnits', component: () => import('@/views/Tmp.vue') },
  { path: '/groups', name: 'Groups', component: () => import('@/views/Tmp.vue') },
  { path: '/permissions', name: 'Permissions', component: () => import('@/views/Tmp.vue') },

  // Capabilities P3
  { path: '/features', name: 'Features', component: () => import('@/views/Tmp.vue') },
  { path: '/orders', name: 'Orders', component: () => import('@/views/Tmp.vue') },

  // Observability P6
  { path: '/metrics', name: 'Metrics', component: () => import('@/views/Tmp.vue') },

  // Capacity P7
  { path: '/capacities', name: 'Capacities', component: () => import('@/views/Tmp.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
