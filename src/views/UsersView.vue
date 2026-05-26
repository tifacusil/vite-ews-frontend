<template>
  <div class="flex flex-col h-screen min-w-[1280px] overflow-hidden">

    <!-- Header (mismo estilo que HomeView) -->
    <header class="flex items-center gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm shrink-0">
      <div class="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" fill="#1e3a5f" stroke="#3B82F6" stroke-width="1.5"/>
          <path d="M8 20 L14 8 L20 20" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" fill="none"/>
          <circle cx="14" cy="20" r="2" fill="#F97316"/>
        </svg>
        <span class="font-bold text-sm tracking-wide text-gray-100">EWS</span>
        <span class="text-gray-500 text-xs">Early Warning System · Bai et al. (2020)</span>
      </div>

      <div class="ml-auto flex items-center gap-3">
        <router-link
          to="/"
          class="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1
                 rounded border border-gray-700 hover:border-gray-500"
        >
          ← Dashboard
        </router-link>
        <button
          @click="auth.logout()"
          class="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1
                 rounded border border-gray-700 hover:border-gray-500"
        >
          Salir
        </button>
      </div>
    </header>

    <!-- Contenido -->
    <main class="flex-1 min-h-0 overflow-y-auto bg-gray-950 p-6">
      <div class="max-w-5xl mx-auto flex flex-col gap-5">

        <!-- Encabezado de sección -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-gray-100 font-semibold text-lg">Gestión de usuarios</h1>
            <p class="text-gray-500 text-xs mt-0.5">Administración de cuentas y suscripciones</p>
          </div>
          <button
            @click="openCreateModal"
            class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs
                   font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span>+</span> Nuevo usuario
          </button>
        </div>

        <!-- Estado de carga / error global -->
        <div v-if="loadingList" class="text-gray-500 text-sm py-8 text-center animate-pulse">
          Cargando usuarios…
        </div>
        <div
          v-else-if="listError"
          class="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
        >
          {{ listError }}
        </div>

        <!-- Tabla de usuarios -->
        <div v-else class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                <th class="text-left px-5 py-3 font-medium">Usuario</th>
                <th class="text-left px-5 py-3 font-medium">Rol</th>
                <th class="text-left px-5 py-3 font-medium">Email</th>
                <th class="text-left px-5 py-3 font-medium">Teléfono</th>
                <th class="text-left px-5 py-3 font-medium">Estado</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.userId"
                class="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors"
              >
                <td class="px-5 py-3 font-mono text-gray-200 text-xs">{{ user.username }}</td>
                <td class="px-5 py-3">
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="roleBadgeClass(user.role)"
                  >{{ user.role }}</span>
                </td>
                <td class="px-5 py-3 text-gray-400 text-xs">{{ user.email || '—' }}</td>
                <td class="px-5 py-3 text-gray-400 text-xs font-mono">{{ user.phone_e164 || '—' }}</td>
                <td class="px-5 py-3">
                  <span
                    class="px-2 py-0.5 rounded-full text-xs"
                    :class="user.status === 'active'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-gray-700 text-gray-400'"
                  >{{ user.status }}</span>
                </td>
                <td class="px-5 py-3 text-right">
                  <button
                    @click="openEditModal(user)"
                    class="text-xs text-blue-400 hover:text-blue-300 transition-colors
                           px-3 py-1 rounded border border-blue-500/30 hover:border-blue-400/50"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- ─── Modal Editar usuario ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="editModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeEditModal"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeEditModal" />

          <div class="relative z-10 bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg
                      flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">

            <!-- Header modal -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 class="text-gray-100 font-semibold text-sm">
                Editar — <span class="font-mono text-blue-400">{{ editModal.user?.username }}</span>
                <span class="text-gray-500 font-normal text-xs ml-2">#{{ editModal.user?.user_id }}</span>
              </h2>
              <button @click="closeEditModal" class="text-gray-500 hover:text-gray-300 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body modal (scrollable) -->
            <div class="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">

              <!-- Campos readonly -->
              <div class="flex gap-3">
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-xs text-gray-400">Usuario (solo lectura)</label>
                  <input
                    :value="editModal.user?.username"
                    disabled
                    class="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm
                           text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-xs text-gray-400">Rol (solo lectura)</label>
                  <input
                    :value="editModal.user?.role"
                    disabled
                    class="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm
                           text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <!-- Campos editables -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">Email</label>
                <input
                  v-model="editModal.email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                         focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">Teléfono (E.164)</label>
                <input
                  v-model="editModal.phone"
                  type="tel"
                  placeholder="+52155512345678"
                  class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                         focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>

              <!-- Error edición -->
              <div
                v-if="editModal.error"
                class="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {{ editModal.error }}
              </div>

              <!-- ─── Suscripciones ─── -->
              <div class="border-t border-gray-800 pt-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Suscripciones
                  </h3>
                  <button
                    @click="editModal.showSubForm = !editModal.showSubForm"
                    class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {{ editModal.showSubForm ? 'Cancelar' : '+ Suscribir a proyecto' }}
                  </button>
                </div>

                <!-- Lista de subs actuales -->
                <div v-if="editModal.loadingSubs" class="text-xs text-gray-500 animate-pulse">
                  Cargando suscripciones…
                </div>
                <div v-else-if="editModal.subscriptions.length === 0" class="text-xs text-gray-500">
                  Sin suscripciones.
                </div>
                <ul v-else class="flex flex-col gap-2">
                  <li
                    v-for="sub in editModal.subscriptions"
                    :key="sub.id"
                    class="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2 text-xs"
                  >
                    <span class="font-mono text-gray-300 font-medium">{{ sub.project_id }}</span>
                    <span
                      class="px-1.5 py-0.5 rounded text-xs font-bold uppercase"
                      :class="alertBadgeClass(sub.min_alert_level)"
                    >{{ sub.min_alert_level }}</span>
                    <span class="ml-auto flex gap-2 text-gray-500">
                      <span v-if="sub.sms_enabled"   title="SMS">📱</span>
                      <span v-if="sub.email_enabled"  title="Email">✉️</span>
                      <span v-if="sub.push_enabled"   title="Push">🔔</span>
                    </span>
                  </li>
                </ul>

                <!-- Formulario nueva suscripción -->
                <Transition name="sub-fade">
                  <div
                    v-if="editModal.showSubForm"
                    class="flex flex-col gap-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3"
                  >
                    <div class="flex gap-3">
                      <div class="flex-1 flex flex-col gap-1.5">
                        <label class="text-xs text-gray-400">Proyecto</label>
                        <select
                          v-model="newSub.projectId"
                          class="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs
                                 text-gray-100 focus:outline-none focus:border-blue-500"
                        >
                          <option value="shangtan">shangtan</option>
                          <option value="lingzhan">lingzhan</option>
                        </select>
                      </div>
                      <div class="flex-1 flex flex-col gap-1.5">
                        <label class="text-xs text-gray-400">Nivel mínimo alerta</label>
                        <select
                          v-model="newSub.minAlertLevel"
                          class="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs
                                 text-gray-100 focus:outline-none focus:border-blue-500"
                        >
                          <option value="blue">blue</option>
                          <option value="orange">orange</option>
                          <option value="red">red</option>
                        </select>
                      </div>
                    </div>
                    <div class="flex gap-4 text-xs text-gray-300">
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" v-model="newSub.smsEnabled"   class="accent-blue-500" />
                        SMS
                      </label>
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" v-model="newSub.pushEnabled"  class="accent-blue-500" />
                        Push
                      </label>
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" v-model="newSub.emailEnabled" class="accent-blue-500" />
                        Email
                      </label>
                    </div>
                    <div
                      v-if="editModal.subError"
                      class="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-2 py-1"
                    >
                      {{ editModal.subError }}
                    </div>
                    <button
                      @click="handleCreateSub"
                      :disabled="editModal.savingSub"
                      class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs
                             font-medium px-3 py-1.5 rounded transition-colors self-start"
                    >
                      {{ editModal.savingSub ? 'Guardando…' : 'Crear suscripción' }}
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Footer modal -->
            <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                @click="closeEditModal"
                class="text-xs text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg
                       border border-gray-700 hover:border-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                @click="handleSaveUser"
                :disabled="editModal.saving"
                class="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white
                       font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {{ editModal.saving ? 'Guardando…' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── Modal Nuevo usuario ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="createModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeCreateModal"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeCreateModal" />

          <div class="relative z-10 bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md
                      shadow-2xl">

            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 class="text-gray-100 font-semibold text-sm">Nuevo usuario</h2>
              <button @click="closeCreateModal" class="text-gray-500 hover:text-gray-300 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-5 py-4 flex flex-col gap-3">
              <div class="flex gap-3">
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-xs text-gray-400">Usuario *</label>
                  <input
                    v-model="createModal.username"
                    type="text"
                    placeholder="nuevo_operador"
                    class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                           focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div class="flex-1 flex flex-col gap-1.5">
                  <label class="text-xs text-gray-400">Rol *</label>
                  <select
                    v-model="createModal.role"
                    class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                           focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="operator">operator</option>
                    <option value="viewer">viewer</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">Email *</label>
                <input
                  v-model="createModal.email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                         focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">Teléfono (E.164, opcional)</label>
                <input
                  v-model="createModal.phone"
                  type="tel"
                  placeholder="+52155512345678"
                  class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                         focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">Contraseña *</label>
                <input
                  v-model="createModal.password"
                  type="password"
                  placeholder="••••••••"
                  class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
                         focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <!-- Error -->
              <div
                v-if="createModal.error"
                class="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {{ createModal.error }}
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                @click="closeCreateModal"
                class="text-xs text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg
                       border border-gray-700 hover:border-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                @click="handleCreateUser"
                :disabled="createModal.saving"
                class="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white
                       font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {{ createModal.saving ? 'Creando…' : 'Crear usuario' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  getUser, updateUser, getSubscriptions, createSubscription, register
} from '@/api/userManagement'
import type { UserProfile, Subscription, AlertLevel, RegisterRequest } from '@/types'

const auth = useAuthStore()

// ─── Lista de usuarios ────────────────────────────────────────────────────────

const users = ref<UserProfile[]>([])
const loadingList = ref(false)
const listError = ref<string | null>(null)

// Carga el propio usuario admin (el único que conocemos con certeza es el autenticado).
// Si la API implementa GET /users en el futuro, reemplazar aquí.
async function loadUsers() {
  loadingList.value = true
  listError.value = null
  try {
    if (!auth.user?.userId) throw new Error('Sin sesión activa')
    const res = await getUser(auth.user.userId)
    users.value = [res.data]
  } catch (err) {
    listError.value = err instanceof Error ? err.message : 'Error al cargar usuarios.'
  } finally {
    loadingList.value = false
  }
}

onMounted(loadUsers)

// ─── Helpers de estilo ────────────────────────────────────────────────────────

function roleBadgeClass(role: string): string {
  return {
    admin:    'bg-blue-500/20 text-blue-400',
    operator: 'bg-green-500/20 text-green-400',
    viewer:   'bg-gray-700 text-gray-400'
  }[role] ?? 'bg-gray-700 text-gray-400'
}

function alertBadgeClass(level: AlertLevel): string {
  return {
    red:    'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
    blue:   'bg-blue-500/20 text-blue-400'
  }[level] ?? 'bg-gray-700 text-gray-400'
}

// ─── Modal Editar ─────────────────────────────────────────────────────────────

const editModal = reactive({
  open: false,
  user: null as UserProfile | null,
  email: '',
  phone: '',
  saving: false,
  error: null as string | null,
  subscriptions: [] as Subscription[],
  loadingSubs: false,
  showSubForm: false,
  savingSub: false,
  subError: null as string | null
})

const newSub = reactive({
  projectId: 'shangtan',
  minAlertLevel: 'blue' as AlertLevel,
  smsEnabled: false,
  pushEnabled: false,
  emailEnabled: false
})

async function openEditModal(user: UserProfile) {
  editModal.user = user
  editModal.email = user.email ?? ''
  editModal.phone = user.phone_e164 ?? ''
  editModal.saving = false
  editModal.error = null
  editModal.showSubForm = false
  editModal.subError = null
  editModal.subscriptions = []
  editModal.open = true

  // Cargar suscripciones (API devuelve snake_case)
  editModal.loadingSubs = true
  try {
    const res = await getSubscriptions(user.user_id)
    editModal.subscriptions = res.data
  } catch {
    editModal.subscriptions = []
  } finally {
    editModal.loadingSubs = false
  }
}

function closeEditModal() {
  editModal.open = false
  editModal.user = null
}

async function handleSaveUser() {
  if (!editModal.user) return
  editModal.saving = true
  editModal.error = null
  try {
    // API espera snake_case
    const updated = await updateUser(editModal.user.user_id, {
      email: editModal.email || undefined,
      phone_e164: editModal.phone || undefined
    })
    const idx = users.value.findIndex(u => u.user_id === editModal.user!.user_id)
    if (idx !== -1) users.value[idx] = updated.data
    closeEditModal()
  } catch (err) {
    editModal.error = err instanceof Error ? err.message : 'Error al guardar.'
  } finally {
    editModal.saving = false
  }
}

async function handleCreateSub() {
  if (!editModal.user) return
  editModal.savingSub = true
  editModal.subError = null
  try {
    // API espera snake_case
    const res = await createSubscription(editModal.user.user_id, {
      project_id: newSub.projectId,
      min_alert_level: newSub.minAlertLevel,
      sms_enabled: newSub.smsEnabled,
      push_enabled: newSub.pushEnabled,
      email_enabled: newSub.emailEnabled
    })
    editModal.subscriptions.push(res.data)
    editModal.showSubForm = false
    // Reset form
    newSub.projectId = 'shangtan'
    newSub.minAlertLevel = 'blue'
    newSub.smsEnabled = false
    newSub.pushEnabled = false
    newSub.emailEnabled = false
  } catch (err) {
    editModal.subError = err instanceof Error ? err.message : 'Error al crear suscripción.'
  } finally {
    editModal.savingSub = false
  }
}

// ─── Modal Crear ──────────────────────────────────────────────────────────────

const createModal = reactive({
  open: false,
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'operator' as RegisterRequest['role'],
  saving: false,
  error: null as string | null
})

function openCreateModal() {
  createModal.open = true
  createModal.username = ''
  createModal.email = ''
  createModal.phone = ''
  createModal.password = ''
  createModal.role = 'operator'
  createModal.saving = false
  createModal.error = null
}

function closeCreateModal() {
  createModal.open = false
}

async function handleCreateUser() {
  if (!createModal.username || !createModal.email || !createModal.password) {
    createModal.error = 'Usuario, email y contraseña son obligatorios.'
    return
  }
  createModal.saving = true
  createModal.error = null
  try {
    const payload: RegisterRequest = {
      username: createModal.username,
      email: createModal.email,
      password: createModal.password,
      role: createModal.role,
      ...(createModal.phone ? { phone_e164: createModal.phone } : {})
    }
    await register(payload)
    closeCreateModal()
    await loadUsers() // Recargar lista
  } catch (err) {
    const e = err as { response?: { data?: { message?: string } } }
    createModal.error = e?.response?.data?.message
      ?? (err instanceof Error ? err.message : 'Error al crear usuario.')
  } finally {
    createModal.saving = false
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.sub-fade-enter-active, .sub-fade-leave-active { transition: all 0.2s ease; }
.sub-fade-enter-from, .sub-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
