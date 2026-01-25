<template>
  <div class="home-container">
    <div class="hero">
      <!-- <h1>🪙 Tokenz 代幣商店</h1> -->
      <p class="subtitle">{{ t('home.subtitle') }}</p>
      
      <div class="products-grid">
        <div 
          v-for="product in products" 
          :key="product.id"
          class="product-card"
        >
          <div class="product-icon">{{ product.icon }}</div>
          <h3>{{ product.name }}</h3>
          <p class="description">{{ product.description }}</p>
          <div class="price">${{ product.price }} TWD</div>
          <button 
            @click="selectProduct(product)"
            class="buy-btn"
          >
            {{ t('home.buyNow') }}
          </button>
        </div>
      </div>
    </div>
   
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'

interface Product {
  id: string
  name: string
  description: string
  price: number
  icon: string
}

const router = useRouter()

const products = ref<Product[]>([
  {
    id: 'basic',
    name: '基礎方案',
    description: '適合個人使用者',
    price: 299,
    icon: '💎'
  },
  {
    id: 'pro',
    name: '專業方案',
    description: '適合小型團隊',
    price: 699,
    icon: '🚀'
  },
  {
    id: 'enterprise',
    name: '超級無敵方案',
    description: '適合大型組織',
    price: 2999,
    icon: '👑'
  },
  
])

const selectProduct = (product: Product) => {
  router.push({
    name: 'Payment',
    query: {
      productId: product.id,
      name: product.name,
      price: product.price.toString()
    }
  })
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin-bottom: 120px;
}

.hero {
  max-width: 1200px;
  width: 100%;
  text-align: center;
}

h1 {
  font-size: 3.5rem;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 3rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.product-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.product-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 1.5rem;
}

.buy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-weight: 600;
}

.buy-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.buy-btn:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  h1 {
    font-size: 2.5rem;
  }
  
  .subtitle {
    font-size: 1.2rem;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
