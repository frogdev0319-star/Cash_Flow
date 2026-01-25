<template>
  <div class="success-container">
      <div class="success-card">
      <div class="success-icon">✅</div>
      <h2>{{ t('success.title') }}</h2>
      <p class="success-message">{{ t('success.thanks') }}</p>
      
      <div class="payment-details">
        <div class="detail-item">
          <span>{{ t('success.paymentId') }}</span>
          <span class="payment-id">{{ paymentId }}</span>
        </div>
        <div class="detail-item">
          <span>{{ t('success.amount') }}</span>
          <span class="amount">${{ amount }} {{ currency }}</span>
        </div>
      </div>

      <button @click="goHome" class="home-btn">
        {{ t('success.home') }}
      </button>

      <p class="email-notice">
        {{ t('success.receipt') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '@/i18n'

const route = useRoute()
const router = useRouter()

const paymentId = ref(route.query.paymentId as string || 'N/A')
const amount = ref(route.query.amount as string || '0')
const currency = ref(route.query.currency as string || 'TWD')

onMounted(() => {
  if (!route.query.amount) {
    try {
      const storedAmount = sessionStorage.getItem('tokenz_last_amount')
      if (storedAmount) amount.value = storedAmount
    } catch {}
  }

  if (!route.query.currency) {
    try {
      const storedCurrency = sessionStorage.getItem('tokenz_last_currency')
      if (storedCurrency) currency.value = storedCurrency
    } catch {}
  }

  // 可以在這裡添加成功動畫或發送確認通知
  console.log('Payment successful:', paymentId.value)
})

const goHome = () => {
  router.push({ name: 'Home' })
}
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.success-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

h2 {
  color: #333;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.success-message {
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.payment-details {
  background: #f7f9fc;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: #666;
}

.payment-id {
  font-family: monospace;
  color: #667eea;
  font-weight: 600;
}

.amount {
  font-weight: bold;
  font-size: 1.3rem;
  color: #333;
}

.home-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1.2rem;
  font-size: 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.home-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.email-notice {
  color: #999;
  font-size: 0.9rem;
}
</style>
