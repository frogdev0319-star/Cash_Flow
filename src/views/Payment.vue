<template>
  <div class="payment-container">
    <div class="payment-card">
      <div class="back-btn" @click="goBack">{{ t('payment.back') }}</div>
      
      <h2>{{ t('payment.title') }}</h2>
      
      <div class="order-summary">
        <h3>{{ t('payment.summary') }}</h3>
        <div class="summary-item">
          <span>{{ t('payment.productName') }}</span>
          <span>{{ productName }}</span>
        </div>
        <div class="summary-item total">
          <span>{{ t('payment.total') }}</span>
          <span>${{ productPrice }} TWD</span>
        </div>
      </div>

      <div class="payment-info">
        <p class="info-text">{{ t('payment.info') }}</p>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        
        <button 
          @click="handlePayment" 
          :disabled="processing"
          class="pay-btn"
        >
          {{ processing ? t('payment.redirecting') : `${t('payment.goPay')} $${productPrice} TWD` }}
        </button>
      </div>

      <div class="secure-notice">
        {{ t('payment.secure') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { locale, t } from '@/i18n'
import { userEmail as authUserEmail } from '@/auth'

const route = useRoute()
const router = useRouter()

const productName = ref(route.query.name as string || '未知商品')
const productPrice = ref(route.query.price as string || '0')
const productId = ref(route.query.productId as string || '')
const processing = ref(false)
const errorMessage = ref('')

const handlePayment = async () => {
  processing.value = true
  errorMessage.value = ''

  try {
    // 從後端創建 Checkout Session
    // const response = await fetch('http://localhost:3001/create-checkout-session', {
    const response = await fetch(' https://cash-flow-app.zeabur.app/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: parseInt(productPrice.value),
        currency: 'TWD',
        productName: productName.value,
        mail: authUserEmail.value,
        locale: locale.value,
        productImage: getProductImage(productId.value)
      })
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as { error?: unknown } | null
      const message = typeof errorData?.error === 'string' ? errorData.error : '創建結帳工作階段失敗'
      throw new Error(message)
    }

    const { checkoutUrl, sessionId } = await response.json() as { checkoutUrl?: string, sessionId?: string }
    if (!checkoutUrl) throw new Error('後端未回傳 checkoutUrl')

    try {
      sessionStorage.setItem('tokenz_last_amount', productPrice.value)
      sessionStorage.setItem('tokenz_last_currency', 'TWD')
      sessionStorage.setItem('tokenz_last_product_name', productName.value)
      if (sessionId) sessionStorage.setItem('tokenz_last_session_id', sessionId)
    } catch {}

    // 轉址到 Tokenz 託管的支付頁面
    window.location.href = checkoutUrl
  } catch (error) {
    console.error('支付錯誤:', error)
    errorMessage.value = error instanceof Error ? error.message : t('payment.createFailed')
    processing.value = false
  }
}

const getProductImage = (productId: string) => {
  const images: Record<string, string> = {
    'basic': 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=400',
    'pro': 'https://images.unsplash.com/photo-1680868543815-b8666dba60f7?w=400',
    'enterprise': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    'premium': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    'business': 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=400',
    'ultimate': 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?w=400'
  }
  return images[productId] || ''
}

const goBack = () => {
  router.push({ name: 'Home' })
}
</script>

<style scoped>
.payment-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.payment-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
}

.back-btn {
  position: absolute;
  top: 2rem;
  left: 2rem;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.back-btn:hover {
  transform: translateX(-5px);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.order-summary {
  background: #f7f9fc;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.order-summary h3 {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #666;
}

.summary-item.total {
  border-top: 2px solid #667eea;
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-weight: bold;
  font-size: 1.3rem;
  color: #333;
}

.payment-info {
  margin-bottom: 2rem;
}

.info-text {
  text-align: center;
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.error-message {
  color: #fa755a;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #fff5f5;
  border-radius: 5px;
  font-size: 0.9rem;
}

.pay-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1.2rem;
  font-size: 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-weight: 600;
}

.pay-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.pay-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secure-notice {
  text-align: center;
  color: #666;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .payment-card {
    padding: 2rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
</style>
