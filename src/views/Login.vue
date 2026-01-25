<template>
  <div class="login-container">
    <div class="login-card">
      <h2>{{ t('login.title') }}</h2>
      <p class="subtitle">{{ t('login.subtitle') }}</p>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div class="field">
        <label for="email">{{ t('login.account') }}</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="username"
          placeholder="aaa@aaa.com"
        />
      </div>

      <div class="field">
        <label for="password">{{ t('login.password') }}</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="0"
          @keyup.enter="handleLogin"
        />
      </div>

      <button class="login-btn" :disabled="loading" @click="handleLogin">
        {{ loading ? t('login.loading') : t('login.submit') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'
import { setAuthUser } from '@/auth'

const router = useRouter()

const email = ref('aaa@aaa.com')
const password = ref('0')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: unknown } | null
      const message = typeof data?.error === 'string' ? data.error : t('login.failed')
      throw new Error(message)
    }

    setAuthUser(email.value)

    router.push({ name: 'Home' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('login.failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.error-message {
  color: #fa755a;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #fff5f5;
  border-radius: 10px;
  font-size: 0.95rem;
}

.field {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  color: #333;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 1rem;
  outline: none;
}

input:focus {
  border-color: rgba(102, 126, 234, 0.7);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1.1rem;
  font-size: 1.1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-weight: 700;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
