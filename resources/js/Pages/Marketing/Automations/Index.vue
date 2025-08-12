<template>
  <AppLayout title="Automatisations Marketing">
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
          Automatisations Marketing
        </h2>
        <div class="flex space-x-2">
          <button @click="showCreateModal = true" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Nouvelle Automatisation
          </button>
          <button @click="createDefaultRules" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Créer les Règles par Défaut
          </button>
        </div>
      </div>
    </template>

    <div class="py-12">
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <!-- Statistiques des Automatisations -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-500">Total Règles</div>
                <div class="text-2xl font-semibold text-gray-900">{{ stats.totalRules }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-500">Actives</div>
                <div class="text-2xl font-semibold text-gray-900">{{ stats.activeRules }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-500">Exécutées Aujourd'hui</div>
                <div class="text-2xl font-semibold text-gray-900">{{ stats.executedToday }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-500">Taux de Succès</div>
                <div class="text-2xl font-semibold text-gray-900">{{ stats.successRate }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type de Déclencheur</label>
              <select v-model="filters.triggerType" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="">Tous</option>
                <option value="birthday">Anniversaire</option>
                <option value="seasonal">Saisonnier</option>
                <option value="new_client">Nouveau Client</option>
                <option value="inactive_client">Client Inactif</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select v-model="filters.status" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Utilisation IA</label>
              <select v-model="filters.useAI" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="">Tous</option>
                <option value="true">Avec IA</option>
                <option value="false">Sans IA</option>
              </select>
            </div>
            <div class="flex items-end">
              <button @click="applyFilters" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Filtrer
              </button>
            </div>
          </div>
        </div>

        <!-- Liste des Automatisations -->
        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IA</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière Exécution</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="automation in automations.data" :key="automation.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ automation.name }}</div>
                      <div class="text-sm text-gray-500">{{ automation.description }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="getTriggerTypeClass(automation.trigger_type)">
                      {{ getTriggerTypeLabel(automation.trigger_type) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(automation.status)">
                      {{ getStatusLabel(automation.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span v-if="automation.use_ai" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      IA Activée
                    </span>
                    <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      IA Désactivée
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ automation.last_executed_at ? formatDate(automation.last_executed_at) : 'Jamais' }}
                    <div v-if="automation.execution_count > 0" class="text-xs text-gray-400">
                      {{ automation.execution_count }} fois
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button @click="viewAutomation(automation)" class="text-blue-600 hover:text-blue-900">
                        Voir
                      </button>
                      <button @click="editAutomation(automation)" class="text-indigo-600 hover:text-indigo-900">
                        Modifier
                      </button>
                      <button @click="toggleAutomation(automation)" :class="automation.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'">
                        {{ automation.status === 'active' ? 'Désactiver' : 'Activer' }}
                      </button>
                      <button @click="executeAutomation(automation)" class="text-green-600 hover:text-green-900">
                        Exécuter
                      </button>
                      <button @click="duplicateAutomation(automation)" class="text-purple-600 hover:text-purple-900">
                        Dupliquer
                      </button>
                      <button @click="deleteAutomation(automation)" class="text-red-600 hover:text-red-900">
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
                <Link v-if="automations.prev_page_url" :href="automations.prev_page_url" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Précédent
                </Link>
                <Link v-if="automations.next_page_url" :href="automations.next_page_url" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Suivant
                </Link>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    Affichage de <span class="font-medium">{{ automations.from }}</span> à <span class="font-medium">{{ automations.to }}</span> sur <span class="font-medium">{{ automations.total }}</span> résultats
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Link v-for="link in automations.links" :key="link.label" :href="link.url" v-html="link.label" class="relative inline-flex items-center px-4 py-2 border text-sm font-medium" :class="getPaginationClass(link)">
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Création -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Nouvelle Automatisation</h3>
          
          <form @submit.prevent="createAutomation" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input v-model="newAutomation.name" type="text" required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Type de Déclencheur</label>
                <select v-model="newAutomation.triggerType" required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="birthday">Anniversaire</option>
                  <option value="seasonal">Saisonnier</option>
                  <option value="new_client">Nouveau Client</option>
                  <option value="inactive_client">Client Inactif</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea v-model="newAutomation.description" rows="3" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select v-model="newAutomation.actionType" required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="send_message">Envoyer un Message</option>
                  <option value="send_email">Envoyer un Email</option>
                  <option value="add_tag">Ajouter un Tag</option>
                  <option value="create_task">Créer une Tâche</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Statut Initial</label>
                <select v-model="newAutomation.status" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="flex items-center">
                <input v-model="newAutomation.useAI" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="ml-2 text-sm text-gray-700">Utiliser l'IA pour personnaliser le contenu</span>
              </label>
            </div>
            
            <div class="flex justify-end space-x-2">
              <button type="button" @click="closeCreateModal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                Annuler
              </button>
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Créer
              </button>
            </div>
          </form>
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
  automations: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    default: () => ({
      totalRules: 0,
      activeRules: 0,
      executedToday: 0,
      successRate: 0
    })
  }
})

const showCreateModal = ref(false)
const filters = ref({
  triggerType: '',
  status: '',
  useAI: ''
})

const newAutomation = ref({
  name: '',
  description: '',
  triggerType: 'birthday',
  actionType: 'send_message',
  status: 'draft',
  useAI: false
})

const applyFilters = () => {
  router.get(route('marketing.automations.index'), filters.value, {
    preserveState: true,
    preserveScroll: true
  })
}

const getTriggerTypeClass = (type) => {
  const classes = {
    birthday: 'bg-pink-100 text-pink-800',
    seasonal: 'bg-orange-100 text-orange-800',
    new_client: 'bg-green-100 text-green-800',
    inactive_client: 'bg-yellow-100 text-yellow-800',
    custom: 'bg-purple-100 text-purple-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const getTriggerTypeLabel = (type) => {
  const labels = {
    birthday: 'Anniversaire',
    seasonal: 'Saisonnier',
    new_client: 'Nouveau Client',
    inactive_client: 'Client Inactif',
    custom: 'Personnalisé'
  }
  return labels[type] || type
}

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusLabel = (status) => {
  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    draft: 'Brouillon'
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

const createDefaultRules = async () => {
  if (confirm('Voulez-vous créer les règles d\'automatisation par défaut ?')) {
    try {
      await router.post(route('marketing.automations.create-defaults'))
    } catch (error) {
      console.error('Erreur lors de la création des règles par défaut:', error)
    }
  }
}

const showCreateModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  newAutomation.value = {
    name: '',
    description: '',
    triggerType: 'birthday',
    actionType: 'send_message',
    status: 'draft',
    useAI: false
  }
}

const createAutomation = async () => {
  try {
    await router.post(route('marketing.automations.store'), newAutomation.value)
    closeCreateModal()
  } catch (error) {
    console.error('Erreur lors de la création:', error)
  }
}

const viewAutomation = (automation) => {
  router.get(route('marketing.automations.show', automation.id))
}

const editAutomation = (automation) => {
  router.get(route('marketing.automations.edit', automation.id))
}

const toggleAutomation = async (automation) => {
  const newStatus = automation.status === 'active' ? 'inactive' : 'active'
  try {
    await router.patch(route('marketing.automations.update', automation.id), {
      status: newStatus
    })
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error)
  }
}

const executeAutomation = async (automation) => {
  if (confirm(`Voulez-vous exécuter l'automatisation "${automation.name}" maintenant ?`)) {
    try {
      await router.post(route('marketing.automations.execute', automation.id))
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error)
    }
  }
}

const duplicateAutomation = async (automation) => {
  if (confirm(`Voulez-vous dupliquer l'automatisation "${automation.name}" ?`)) {
    try {
      await router.post(route('marketing.automations.duplicate', automation.id))
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
    }
  }
}

const deleteAutomation = async (automation) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'automatisation "${automation.name}" ?`)) {
    try {
      await router.delete(route('marketing.automations.destroy', automation.id))
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }
}

onMounted(() => {
  // Initialiser les filtres depuis les props si nécessaire
})
</script>