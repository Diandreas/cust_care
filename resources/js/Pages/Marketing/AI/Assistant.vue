<template>
  <AppLayout title="Assistant IA Marketing">
    <template #header>
      <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        Assistant IA Marketing
      </h2>
    </template>

    <div class="py-12">
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Chat IA -->
          <div class="lg:col-span-2">
            <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Chat IA</h3>
                <p class="text-sm text-gray-500">Posez vos questions marketing à l'IA</p>
              </div>
              
              <!-- Zone de Chat -->
              <div class="h-96 overflow-y-auto p-4 space-y-4" ref="chatContainer">
                <div v-for="message in chatMessages" :key="message.id" class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                  <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg" :class="message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'">
                    <div class="text-sm">{{ message.content }}</div>
                    <div class="text-xs mt-1 opacity-70">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>
                
                <div v-if="isLoading" class="flex justify-start">
                  <div class="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div class="flex items-center space-x-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span class="text-sm">L'IA réfléchit...</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Zone de Saisie -->
              <div class="px-6 py-4 border-t border-gray-200">
                <form @submit.prevent="sendMessage" class="flex space-x-3">
                  <input v-model="userInput" type="text" placeholder="Posez votre question..." class="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" :disabled="isLoading">
                  <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium" :disabled="isLoading || !userInput.trim()">
                    Envoyer
                  </button>
                </form>
              </div>
            </div>
          </div>

          <!-- Outils IA -->
          <div class="space-y-6">
            <!-- Générateur de Contenu -->
            <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Générateur de Contenu</h3>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Type de Contenu</label>
                  <select v-model="contentType" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="social_post">Post Réseaux Sociaux</option>
                    <option value="article">Article de Blog</option>
                    <option value="email">Email Marketing</option>
                    <option value="flyer">Contenu de Flyer</option>
                    <option value="ad_copy">Publicité</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                  <input v-model="contentSubject" type="text" placeholder="Ex: Promotion été 2024" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Ton</label>
                  <select v-model="contentTone" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="professional">Professionnel</option>
                    <option value="casual">Décontracté</option>
                    <option value="friendly">Amical</option>
                    <option value="persuasive">Persuasif</option>
                    <option value="informative">Informatif</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Plateforme</label>
                  <select v-model="contentPlatform" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="general">Général</option>
                  </select>
                </div>
                
                <button @click="generateContent" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium" :disabled="isGenerating">
                  {{ isGenerating ? 'Génération...' : 'Générer le Contenu' }}
                </button>
              </div>
            </div>

            <!-- Optimiseur de Contenu -->
            <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Optimiseur de Contenu</h3>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Contenu à Optimiser</label>
                  <textarea v-model="contentToOptimize" rows="4" placeholder="Collez votre contenu ici..." class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Objectif</label>
                  <select v-model="optimizationGoal" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="engagement">Engagement</option>
                    <option value="conversion">Conversion</option>
                    <option value="clarity">Clarté</option>
                    <option value="seo">SEO</option>
                    <option value="tone">Ton et Style</option>
                  </select>
                </div>
                
                <button @click="optimizeContent" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium" :disabled="isOptimizing">
                  {{ isOptimizing ? 'Optimisation...' : 'Optimiser' }}
                </button>
              </div>
            </div>

            <!-- Suggestions IA -->
            <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Suggestions IA</h3>
              </div>
              <div class="p-6">
                <button @click="getSuggestions" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium" :disabled="isGettingSuggestions">
                  {{ isGettingSuggestions ? 'Analyse...' : 'Obtenir des Suggestions' }}
                </button>
                
                <div v-if="suggestions.length > 0" class="mt-4 space-y-3">
                  <div v-for="suggestion in suggestions" :key="suggestion.id" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div class="text-sm text-yellow-800">{{ suggestion.content }}</div>
                    <div class="text-xs text-yellow-600 mt-1">{{ suggestion.category }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Résultats de Génération -->
        <div v-if="generatedContent" class="mt-8">
          <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Contenu Généré</h3>
            </div>
            <div class="p-6">
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Type: {{ getContentTypeLabel(contentType) }}</span>
                  <div class="flex space-x-2">
                    <button @click="copyToClipboard(generatedContent)" class="text-blue-600 hover:text-blue-800 text-sm">
                      Copier
                    </button>
                    <button @click="downloadContent" class="text-green-600 hover:text-green-800 text-sm">
                      Télécharger
                    </button>
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <pre class="whitespace-pre-wrap text-sm text-gray-900">{{ generatedContent }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Résultats d'Optimisation -->
        <div v-if="optimizedContent" class="mt-8">
          <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Contenu Optimisé</h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-2">Contenu Original</h4>
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <pre class="whitespace-pre-wrap text-sm text-gray-900">{{ contentToOptimize }}</pre>
                  </div>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-700 mb-2">Contenu Optimisé</h4>
                  <div class="bg-green-50 p-4 rounded-lg">
                    <pre class="whitespace-pre-wrap text-sm text-gray-900">{{ optimizedContent }}</pre>
                  </div>
                </div>
              </div>
              <div class="mt-4 flex justify-end">
                <button @click="copyToClipboard(optimizedContent)" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Copier l'Optimisation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'

const chatContainer = ref(null)
const chatMessages = ref([])
const userInput = ref('')
const isLoading = ref(false)
const isGenerating = ref(false)
const isOptimizing = ref(false)
const isGettingSuggestions = ref(false)

const contentType = ref('social_post')
const contentSubject = ref('')
const contentTone = ref('professional')
const contentPlatform = ref('instagram')
const contentToOptimize = ref('')
const optimizationGoal = ref('engagement')

const generatedContent = ref('')
const optimizedContent = ref('')
const suggestions = ref([])

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: userInput.value,
    timestamp: new Date()
  }

  chatMessages.value.push(userMessage)
  const message = userInput.value
  userInput.value = ''
  isLoading.value = true

  // Faire défiler vers le bas
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }

  try {
    const response = await router.post(route('marketing.ai.chat'), {
      message: message
    }, {
      preserveState: false,
      onSuccess: (page) => {
        if (page.props.aiResponse) {
          const aiMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: page.props.aiResponse,
            timestamp: new Date()
          }
          chatMessages.value.push(aiMessage)
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error)
  } finally {
    isLoading.value = false
    await nextTick()
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }
}

const generateContent = async () => {
  if (!contentSubject.value.trim() || isGenerating.value) return

  isGenerating.value = true
  generatedContent.value = ''

  try {
    const response = await router.post(route('marketing.ai.generate-content'), {
      type: contentType.value,
      subject: contentSubject.value,
      tone: contentTone.value,
      platform: contentPlatform.value
    }, {
      preserveState: false,
      onSuccess: (page) => {
        if (page.props.generatedContent) {
          generatedContent.value = page.props.generatedContent
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors de la génération:', error)
  } finally {
    isGenerating.value = false
  }
}

const optimizeContent = async () => {
  if (!contentToOptimize.value.trim() || isOptimizing.value) return

  isOptimizing.value = true
  optimizedContent.value = ''

  try {
    const response = await router.post(route('marketing.ai.optimize-content'), {
      content: contentToOptimize.value,
      goal: optimizationGoal.value
    }, {
      preserveState: false,
      onSuccess: (page) => {
        if (page.props.optimizedContent) {
          optimizedContent.value = page.props.optimizedContent
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors de l\'optimisation:', error)
  } finally {
    isOptimizing.value = false
  }
}

const getSuggestions = async () => {
  isGettingSuggestions.value = true
  suggestions.value = []

  try {
    const response = await router.post(route('marketing.ai.generate-suggestions'), {}, {
      preserveState: false,
      onSuccess: (page) => {
        if (page.props.suggestions) {
          suggestions.value = page.props.suggestions
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error)
  } finally {
    isGettingSuggestions.value = false
  }
}

const getContentTypeLabel = (type) => {
  const labels = {
    social_post: 'Post Réseaux Sociaux',
    article: 'Article de Blog',
    email: 'Email Marketing',
    flyer: 'Contenu de Flyer',
    ad_copy: 'Publicité'
  }
  return labels[type] || type
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // Afficher une notification de succès
  } catch (error) {
    console.error('Erreur lors de la copie:', error)
  }
}

const downloadContent = () => {
  if (!generatedContent.value) return

  const blob = new Blob([generatedContent.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contenu-${contentType.value}-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  // Message de bienvenue
  chatMessages.value.push({
    id: 1,
    role: 'assistant',
    content: 'Bonjour ! Je suis votre assistant IA marketing. Comment puis-je vous aider aujourd\'hui ?',
    timestamp: new Date()
  })
})
</script>