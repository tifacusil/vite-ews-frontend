<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <!-- Logo + título -->
      <div class="flex items-center gap-3 mb-8 justify-center">
        <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" fill="#1e3a5f" stroke="#3B82F6" stroke-width="1.5"/>
          <path d="M8 20 L14 8 L20 20" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" fill="none"/>
          <circle cx="14" cy="20" r="2" fill="#F97316"/>
        </svg>
        <div>
          <div class="font-bold text-gray-100 text-lg tracking-wide">EWS</div>
          <div class="text-gray-500 text-xs">Early Warning System · Bai et al. (2020)</div>
        </div>
      </div>

      <!-- Card de login -->
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
        <h1 class="text-gray-100 font-semibold text-base">Iniciar sesión</h1>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Usuario</label>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="usuario"
              class="bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-100
                     focus:outline-none focus:border-blue-500 transition-colors"
              :class="errorMsg ? 'border-red-500/70' : 'border-gray-700'"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Contraseña</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-100
                     focus:outline-none focus:border-blue-500 transition-colors"
              :class="errorMsg ? 'border-red-500/70' : 'border-gray-700'"
            />
          </div>

          <!-- Mensaje de error -->
          <Transition name="err-fade">
            <div
              v-if="errorMsg"
              class="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
            >
              {{ errorMsg }}
            </div>
          </Transition>

          <button
            type="submit"
            :disabled="loading"
            class="mt-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Autenticando…
            </span>
            <span v-else>Iniciar sesión</span>
          </button>
        </form>
      </div>

      <!-- Usuarios de prueba — solo en desarrollo -->
      <div v-if="isDev" class="mt-4 bg-gray-900/40 border border-gray-800/60 rounded-lg p-3 text-xs text-gray-500">
        <p class="font-semibold text-gray-400 mb-1.5 text-xs tracking-wide">Usuarios de prueba</p>
        <ul class="flex flex-col gap-0.5 font-mono">
          <li
            v-for="u in DEV_USERS"
            :key="u.username"
            class="cursor-pointer hover:text-gray-300 transition-colors py-0.5"
            @click="prefill(u)"
          >
            {{ u.username }} / {{ u.password }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const auth = useAuthStore()
const projectStore = useProjectStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const isDev = import.meta.env.DEV

const DEV_USERS = [
  { username: 'admin',               password: 'password123' },
  { username: 'operador_shangtan',   password: 'password123' },
  { username: 'operador_lingzhan',   password: 'password123' }
]

/** Si ya hay token válido, saltar directo al dashboard. */
onMounted(() => {
  if (auth.isAuthenticated) router.replace('/')
})

/** Prefill rápido desde la lista de prueba (dev). */
function prefill(u: { username: string; password: string }) {
  username.value = u.username
  password.value = u.password
}

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMsg.value = 'Completa usuario y contraseña.'
    return
  }
  errorMsg.value = ''
  loading.value = true

  try {
    await auth.login(username.value, password.value)

    // Cargar proyectos y alertas del usuario recién autenticado
    if (auth.user) {
      await Promise.allSettled([
        projectStore.loadProjects(auth.user.userId),
        projectStore.loadAlerts()
      ])
    }

    router.push('/')
  } catch (err) {
    const e = err as { response?: { status?: number } }
    if (e?.response?.status === 401) {
      errorMsg.value = 'Usuario o contraseña incorrectos.'
    } else {
      errorMsg.value = 'Error de conexión. Intenta de nuevo.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.err-fade-enter-active, .err-fade-leave-active { transition: opacity 0.2s ease; }
.err-fade-enter-from, .err-fade-leave-to { opacity: 0; }
</style>
