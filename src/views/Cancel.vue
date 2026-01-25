<template>
  <div class="cancel-container">
      <div class="cancel-card">
      <div class="cancel-icon">❌</div>
      <h2>{{ t('cancel.title') }}</h2>
      <p class="cancel-message">{{ t('cancel.message') }}</p>
      
      <button @click="goHome" class="home-btn">
        {{ t('cancel.home') }}
      </button>
      
      <button @click="tryAgain" class="retry-btn">
        {{ t('cancel.retry') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { t } from '@/i18n'

const router = useRouter()

const goHome = () => {
  router.push({ name: 'Home' })
}

const tryAgain = () => {
  router.go(-1) // 返回上一頁
}
</script>

<style scoped>
.cancel-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.cancel-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.cancel-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

h2 {
  color: #333;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.cancel-message {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.home-btn, .retry-btn {
  width: 100%;
  border: none;
  padding: 1.2rem;
  font-size: 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-weight: 600;
  margin-bottom: 1rem;
}

.home-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.home-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.retry-btn {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.retry-btn:hover {
  background: #f7f9fc;
  transform: translateY(-2px);
}
</style>
