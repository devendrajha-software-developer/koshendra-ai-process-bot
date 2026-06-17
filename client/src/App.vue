<template>
  <div class="app-container">
    <RateLimitNotification />
    <AuthModal 
      :isOpen="showAuthModal" 
      @close="handleAuthClose"
      @authenticated="handleAuthenticated"
    />
    <Sidebar 
      :chats="chatStore.chats.value || []"
      :currentChatId="chatStore.currentChat.value?._id || ''"
      :isCollapsed="sidebarCollapsed"
      @new-chat="handleNewChat"
      @select-chat="handleSelectChat"
      @toggle-sidebar="toggleSidebar"
      @delete-chat="handleDeleteChat"
      @rename-chat="handleRenameChat"
    />
    <main class="main-content">
      <AppHeader :user="currentUser" @logout="handleLogout" />
      <div class="router-container">
        <!-- Show ChatScreen when there are messages, otherwise show router-view -->
        <ChatScreen 
          v-if="messages.length > 0 && $route.path === '/'"
          :messages="messages"
          :isLoading="chatLoading"
          @submit="handleChatSubmit"
          @new-chat="handleNewChat"
        />
        <router-view v-else @submit="handleChatSubmit" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from './components/sidebar/sidebar.vue';
import AppHeader from './components/Header/app-header.vue';
import AuthModal from './components/auth/auth-modal.vue';
import ChatScreen from './components/Chat/chat-screen/chat-screen.vue';
import RateLimitNotification from './components/RateLimitNotification.vue';
import { useAuthStore } from './stores/authStore';
import { useChatStore } from './stores/chatStore';
import { useChat } from './composables/useChat';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();
const { messages, isLoading: chatLoading, sendMessage, clearMessages } = useChat();
const showAuthModal = ref(false);
const currentUser = ref(null);
const sidebarCollapsed = ref(false);

onMounted(() => {
  if (authStore.isAuthenticated.value) {
    currentUser.value = authStore.currentUser.value;
    // Fetch chat history for authenticated user
    chatStore.fetchChats();
  } else {
    showAuthModal.value = true;
  }
});

function handleAuthClose() {
  showAuthModal.value = false;
}

function handleAuthenticated(user) {
  currentUser.value = user;
  showAuthModal.value = false;
  // Fetch chat history after login/register
  chatStore.fetchChats();
}

function handleLogout() {
  authStore.logout();
  currentUser.value = null;
  showAuthModal.value = true;
  // Refresh page to reset all state
  window.location.reload();
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

async function handleNewChat() {
  chatStore.currentChat.value = null;
  clearMessages();
  router.push('/');
}

async function handleChatSubmit(text) {
  try {
    await sendMessage(text);
    // Update chat history after sending message
    chatStore.fetchChats();
  } catch (err) {
    console.error('Failed to send message:', err);
  }
}

async function handleSelectChat(chatId) {
  await chatStore.selectChat(chatId);
  router.push('/');
}

async function handleDeleteChat(chatId) {
  if (confirm('Are you sure you want to delete this chat?')) {
    await chatStore.deleteChat(chatId);
    if (chatStore.currentChat.value?._id === chatId) {
      chatStore.currentChat.value = null;
      clearMessages();
    }
  }
}

async function handleRenameChat(chatId) {
  const chat = chatStore.chats.value.find(c => c._id === chatId);
  const newTitle = prompt('Enter new chat title:', chat?.title || 'Untitled Chat');
  if (newTitle && newTitle.trim()) {
    await chatStore.renameChat(chatId, newTitle.trim());
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  height: 100vh;
}

.router-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
</style>
