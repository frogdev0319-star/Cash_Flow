<template>
  <div id="app">
    <header v-if="showLayout" class="app-header">
      <div class="header-left">
        <span class="user-label">{{ t('auth.user') }}</span>
        <span class="user-email">{{ isLoggedIn ? (userEmail || '-') : '-' }}</span>
      </div>

      <div class="header-center">
        <select id="lang-select" class="lang-select" v-model="currentLocale">
          <option value="zh_TW">{{ t('language.zhTW') }}</option>
          <option value="en_US">{{ t('language.en') }}</option>
          <option value="ja_JP">{{ t('language.ja') }}</option>
        </select>
      </div>

      <div class="header-right">
        <!-- reserved -->
      </div>
    </header>

    <aside v-if="showLayout" class="app-aside">
      <button class="menu-item" type="button" @click="goHome">
        {{ t('nav.plans') }}
      </button>
      <button class="menu-item" type="button" @click="goOrders">
        {{ t('nav.orders') }}
      </button>
      <button v-if="isLoggedIn" class="menu-item logout" type="button" @click="handleLogout">
        {{ t('auth.logout') }}
      </button>
    </aside>

    <main :class="{ 'with-layout': showLayout }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { locale, setLocale, t, type Locale } from './i18n'
import { clearAuth, isLoggedIn, userEmail } from './auth'
import { useRoute, useRouter } from 'vue-router'

const currentLocale = computed<Locale>({
  get: () => locale.value,
  set: (value) => setLocale(value)
})

const router = useRouter()
const route = useRoute()

const showLayout = computed(() => route.name !== 'Login')

const handleLogout = () => {
  clearAuth()
  router.push({ name: 'Login' })
}

const goOrders = () => {
  router.push({ name: 'OrderList' })
}

const goHome = () => {
  router.push({ name: 'Home' })
}
</script>

<style scoped>
#app {
  min-height: 100vh;
}

.app-header {
  height: 56px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 700;
  white-space: nowrap;
}

.user-email {
  font-size: 0.9rem;
  color: #333;
  font-family: monospace;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(520px, 55vw);
}

.lang-select {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  padding: 8px 10px;
  background: white;
  color: #333;
}

.app-aside {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 220px;
  padding: 14px 12px;
  background: rgba(255, 255, 255, 0.09);
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 40;
}

.menu-item {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 3px;
  padding: 12px 12px;
  font-weight: 800;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.menu-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
}

.menu-item.logout {
  border-color: rgba(102, 126, 234, 0.5);
  color: #667eea;
}

.with-layout {
  padding-top: 56px;
  padding-left: 220px;
}
</style>
