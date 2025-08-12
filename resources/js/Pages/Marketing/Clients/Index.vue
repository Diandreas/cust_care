<template>
  <AppLayout title="Clients Marketing">
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
          Gestion des Clients
        </h2>
        <Link :href="route('marketing.clients.create')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Nouveau Client
        </Link>
      </div>
    </template>

    <div class="py-12">
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <!-- Filtres et Recherche -->
        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
              <input v-model="filters.search" type="text" placeholder="Nom, email, téléphone..." class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select v-model="filters.status" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="opted_out">Désabonné</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <select v-model="filters.tags" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="">Tous</option>
                <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
              </select>
            </div>
            <div class="flex items-end">
              <button @click="applyFilters" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Filtrer
              </button>
            </div>
          </div>
        </div>

        <!-- Actions en Masse -->
        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-4 mb-6" v-if="selectedClients.length > 0">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ selectedClients.length }} client(s) sélectionné(s)</span>
            <div class="space-x-2">
              <button @click="bulkAction('send_message')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                Envoyer Message
              </button>
              <button @click="bulkAction('add_tags')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                Ajouter Tags
              </button>
              <button @click="bulkAction('export')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                Exporter
              </button>
            </div>
          </div>
        </div>

        <!-- Tableau des Clients -->
        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" @change="toggleSelectAll" :checked="selectAll" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernier Contact</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="client in clients.data" :key="client.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" :value="client.id" v-model="selectedClients" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span class="text-sm font-medium text-gray-700">{{ client.name.charAt(0).toUpperCase() }}</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ client.name }}</div>
                        <div class="text-sm text-gray-500">ID: {{ client.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ client.email }}</div>
                    <div class="text-sm text-gray-500">{{ client.phone }}</div>
                    <div v-if="client.birthday" class="text-xs text-gray-400">
                      🎂 {{ formatDate(client.birthday) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(client.status)">
                      {{ getStatusLabel(client.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="tag in client.tags" :key="tag" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ tag }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ client.last_contact_at ? formatDate(client.last_contact_at) : 'Jamais' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <Link :href="route('marketing.clients.show', client.id)" class="text-blue-600 hover:text-blue-900">
                        Voir
                      </Link>
                      <Link :href="route('marketing.clients.edit', client.id)" class="text-indigo-600 hover:text-indigo-900">
                        Modifier
                      </Link>
                      <button @click="sendMessage(client)" class="text-green-600 hover:text-green-900">
                        Message
                      </button>
                      <button @click="deleteClient(client)" class="text-red-600 hover:text-red-900">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 flex justify-between sm:hidden">
                <Link v-if="clients.prev_page_url" :href="clients.prev_page_url" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Précédent
                </Link>
                <Link v-if="clients.next_page_url" :href="clients.next_page_url" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Suivant
                </Link>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    Affichage de <span class="font-medium">{{ clients.from }}</span> à <span class="font-medium">{{ clients.to }}</span> sur <span class="font-medium">{{ clients.total }}</span> résultats
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Link v-for="link in clients.links" :key="link.label" :href="link.url" v-html="link.label" class="relative inline-flex items-center px-4 py-2 border text-sm font-medium" :class="getPaginationClass(link)">
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'Envoi de Message -->
    <div v-if="showMessageModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Envoyer un Message</h3>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <div class="text-sm text-gray-900">{{ selectedClient?.name }}</div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea v-model="messageContent" rows="4" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Tapez votre message..."></textarea>
          </div>
          <div class="mb-4">
            <label class="flex items-center">
              <input v-model="useAI" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
              <span class="ml-2 text-sm text-gray-700">Utiliser l'IA pour personnaliser</span>
            </label>
          </div>
          <div class="flex justify-end space-x-2">
            <button @click="closeMessageModal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
              Annuler
            </button>
            <button @click="sendMessageToClient" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'

const props = defineProps({
  clients: {
    type: Object,
    required: true
  },
  filters: {
    type: Object,
    default: () => ({})
  }
})

const selectedClients = ref([])
const showMessageModal = ref(false)
const selectedClient = ref(null)
const messageContent = ref('')
const useAI = ref(false)

const filters = ref({
  search: '',
  status: '',
  tags: ''
})

const availableTags = computed(() => {
  const tags = new Set()
  props.clients.data.forEach(client => {
    if (client.tags) {
      client.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags)
})

const selectAll = computed(() => {
  return selectedClients.value.length === props.clients.data.length
})

const applyFilters = () => {
  router.get(route('marketing.clients.index'), filters.value, {
    preserveState: true,
    preserveScroll: true
  })
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedClients.value = []
  } else {
    selectedClients.value = props.clients.data.map(client => client.id)
  }
}

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    opted_out: 'bg-red-100 text-red-800'
  }
  return classes[status] || classes.inactive
}

const getStatusLabel = (status) => {
  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    opted_out: 'Désabonné'
  }
  return labels[status] || status
}

const getPaginationClass = (link) => {
  if (link.active) {
    return 'z-10 bg-blue-50 border-blue-500 text-blue-600'
  }
  if (link.url === null) {
    return 'bg-white border-gray-300 text-gray-500 cursor-not-allowed'
  }
  return 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const sendMessage = (client) => {
  selectedClient.value = client
  showMessageModal.value = true
}

const closeMessageModal = () => {
  showMessageModal.value = false
  selectedClient.value = null
  messageContent.value = ''
  useAI.value = false
}

const sendMessageToClient = () => {
  if (!messageContent.value.trim()) return

  router.post(route('marketing.clients.send-message', selectedClient.value.id), {
    message: messageContent.value,
    use_ai: useAI.value
  }, {
    onSuccess: () => {
      closeMessageModal()
    }
  })
}

const bulkAction = (action) => {
  if (selectedClients.value.length === 0) return

  switch (action) {
    case 'send_message':
      // Implémenter l'envoi en masse
      break
    case 'add_tags':
      // Implémenter l'ajout de tags
      break
    case 'export':
      // Implémenter l'export
      break
  }
}

const deleteClient = (client) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.name} ?`)) {
    router.delete(route('marketing.clients.destroy', client.id))
  }
}

onMounted(() => {
  // Initialiser les filtres depuis les props
  if (props.filters) {
    filters.value = { ...props.filters }
  }
})
</script>