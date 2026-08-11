import { ref } from 'vue'

const hoveredRoute = ref<string | null>(null)

export function useSidebarHover() {
  function setHovered(route: string | null) {
    hoveredRoute.value = route
  }
  return { hoveredRoute, setHovered }
}
