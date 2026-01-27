<template>
  <div class="orders-container">
    <div class="orders-card">
      <h2 class="title">{{ t('orders.title') }}</h2>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div v-if="loading" class="loading">{{ t('orders.loading') }}</div>

      <div v-else class="table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>{{ t('orders.plan') }}</th>
              <th>{{ t('orders.price') }}</th>
              <th>{{ t('orders.date') }}</th>
              <th>{{ t('orders.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!orders.length">
              <td class="empty" colspan="4">{{ t('orders.empty') }}</td>
            </tr>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.productName }}</td>
            <td class="mono">${{ order.amount }} {{ order.currency }}</td>
            <td class="mono">{{ formatDate(order.createdAt) }}</td>
            <td>
              <div class="status-cell">
                <span :class="['status', statusClass(order.status)]">{{ statusLabel(order.status) }}</span>
                <button
                  v-if="order.status === 'order.succeeded'"
                  class="cancel-btn"
                  type="button"
                  :disabled="cancelingId === order.id"
                  @click="openCancelModal(order.id)"
                >
                  {{ cancelingId === order.id ? t('orders.canceling') : t('orders.cancel') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <div class="actions">
        <button class="refresh-btn" type="button" @click="fetchOrders">
          {{ t('orders.refresh') }}
        </button>
      </div>
    </div>

    <div v-if="showCancelModal" class="modal-overlay" @click.self="closeCancelModal">
      <div class="modal-card">
        <h3 class="modal-title">{{ t('orders.cancelTitle') }}</h3>
        <p class="modal-subtitle">{{ t('orders.cancelSubtitle') }}</p>

        <label class="modal-label" for="cancel-reason-select">{{ t('orders.cancelReason') }}</label>
        <select id="cancel-reason-select" v-model="refundReason" class="modal-select">
          <option value="customer_cancellation">{{ t('orders.reasonCustomerCancellation') }}</option>
          <option value="duplicate_payment">{{ t('orders.reasonDuplicatePayment') }}</option>
          <option value="other">{{ t('orders.reasonOther') }}</option>
        </select>

        <div v-if="refundReason === 'other'" class="modal-other">
          <label class="modal-label" for="cancel-detail">{{ t('orders.cancelDetail') }}</label>
          <textarea
            id="cancel-detail"
            v-model="cancelDetail"
            class="modal-textarea"
            rows="4"
            :placeholder="t('orders.cancelDetailPlaceholder')"
          />
        </div>

        <div class="modal-actions">
          <button class="modal-btn secondary" type="button" @click="closeCancelModal">
            {{ t('common.cancel') }}
          </button>
          <button class="modal-btn primary" type="button" :disabled="!canSubmitCancel" @click="confirmCancel">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { t } from '@/i18n'
import { isLoggedIn, userEmail } from '@/auth'

interface OrderRow {
  id: string
  amount: number
  currency: string
  productName: string
  status: string
  createdAt: string
  updatedAt: string
}

const orders = ref<OrderRow[]>([])
const loading = ref(false)
const errorMessage = ref('')
const cancelingId = ref<string | null>(null)
const showCancelModal = ref(false)
const cancelOrderId = ref<string | null>(null)
const refundReason = ref<'customer_cancellation' | 'duplicate_payment' | 'other'>('customer_cancellation')
const cancelDetail = ref('')

const formatDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

const statusLabel = (status: string) => {
  const s = status || 'unknown'
  if (s === 'order.succeeded' || s === 'succeeded') return t('orders.statusSucceeded')
  if (s === 'order.refunded') return t('orders.statusRefunded')
  if (s === 'order.failed' || s === 'failed') return t('orders.statusFailed')
  if (s === 'order.pending' || s === 'pending') return t('orders.statusPending')
  if (s === 'order.created' || s === 'created' || s === 'requiresPayment') return t('orders.statusCreated')
  return s
}

const statusClass = (status: string) => {
  const s = status || 'unknown'
  if (s === 'order.succeeded' || s === 'succeeded') return 'success'
  if (s === 'order.refunded') return 'refunded'
  if (s === 'order.failed' || s === 'failed') return 'danger'
  if (s === 'order.pending' || s === 'pending') return 'warning'
  return 'neutral'
}

const fetchOrders = async () => {
  if (!isLoggedIn.value || !userEmail.value) {
    orders.value = []
    errorMessage.value = '請先登入'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const url = new URL('http://https://cash-flow-backend.zeabur.app/orders')
    url.searchParams.set('limit', '200')
    url.searchParams.set('mail', userEmail.value)
    const response = await fetch(url.toString())
    const data = (await response.json().catch(() => null)) as { orders?: OrderRow[], error?: unknown } | null
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : t('orders.fetchFailed')
      throw new Error(message)
    }
    orders.value = Array.isArray(data?.orders) ? data.orders : []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('orders.fetchFailed')
  } finally {
    loading.value = false
  }
}

const openCancelModal = (id: string) => {
  cancelOrderId.value = id
  refundReason.value = 'customer_cancellation'
  cancelDetail.value = ''
  showCancelModal.value = true
}

const closeCancelModal = () => {
  if (cancelingId.value) return
  showCancelModal.value = false
  cancelOrderId.value = null
  cancelDetail.value = ''
}

const canSubmitCancel = computed(() => {
  if (!cancelOrderId.value || cancelingId.value) return false
  if (refundReason.value === 'other') return cancelDetail.value.trim().length > 0
  return true
})

const confirmCancel = async () => {
  if (!cancelOrderId.value) return
  const id = cancelOrderId.value
  const reason = refundReason.value
  const detail = cancelDetail.value.trim()
  showCancelModal.value = false
  await cancelOrder(id, reason, detail)
  cancelOrderId.value = null
  cancelDetail.value = ''
}

const cancelOrder = async (id: string, reason: 'customer_cancellation' | 'duplicate_payment' | 'other', detail: string) => {
  cancelingId.value = id
  try {
    const response = await fetch(`http://https://cash-flow-backend.zeabur.app/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mail: userEmail.value, reason, detail })
    })
    const data = (await response.json().catch(() => null)) as { error?: unknown } | null
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : t('orders.cancelFailed')
      throw new Error(message)
    }
    await fetchOrders()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('orders.cancelFailed')
  } finally {
    cancelingId.value = null
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.orders-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 900px;
  width: 100%;
  max-height: calc(100vh - 140px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.title {
  color: #333;
  text-align: center;
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.loading {
  text-align: center;
  color: #666;
  padding: 1rem 0;
}

.error-message {
  color: #fa755a;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #fff5f5;
  border-radius: 10px;
  font-size: 0.95rem;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 12px;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  border-radius: 12px;
}

th,
td {
  padding: 0.9rem 0.9rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

th {
  text-align: left;
  color: #333;
  background: #f7f9fc;
  font-weight: 800;
}

tr:hover td {
  background: rgba(247, 249, 252, 0.6);
}

.mono {
  font-family: monospace;
}

.empty {
  text-align: center;
  color: #666;
  padding: 1.5rem 0;
}

.status {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.9rem;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.cancel-btn {
  border: 2px solid rgba(0, 0, 0, 0.14);
  background: white;
  color: #333;
  border-radius: 10px;
  padding: 0.35rem 0.6rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.12);
}

.cancel-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 80;
}

.modal-card {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.modal-title {
  margin: 0 0 0.4rem;
  color: #333;
  font-size: 1.4rem;
}

.modal-subtitle {
  margin: 0 0 1rem;
  color: #666;
}

.modal-label {
  display: block;
  color: #333;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.modal-select {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 1rem;
  outline: none;
  background: white;
  color: #333;
  margin-bottom: 1rem;
}

.modal-select:focus {
  border-color: rgba(102, 126, 234, 0.7);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

.modal-other {
  margin-top: 0.25rem;
}

.modal-textarea {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 1rem;
  outline: none;
  resize: vertical;
}

.modal-textarea:focus {
  border-color: rgba(102, 126, 234, 0.7);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1rem;
}

.modal-btn {
  border-radius: 10px;
  padding: 0.6rem 1rem;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid rgba(0, 0, 0, 0.14);
  background: white;
  color: #333;
}

.modal-btn.primary {
  border-color: rgba(102, 126, 234, 0.5);
  color: #667eea;
}

.modal-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.12);
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status.success {
  color: #1f7a3d;
  background: rgba(31, 122, 61, 0.12);
}

.status.warning {
  color: #8a5a00;
  background: rgba(255, 178, 0, 0.16);
}

.status.refunded {
  color: #8a5a00;
  background: rgba(255, 178, 0, 0.16);
}

.status.danger {
  color: #b42318;
  background: rgba(250, 117, 90, 0.18);
}

.status.neutral {
  color: #333;
  background: rgba(0, 0, 0, 0.06);
}

.actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.refresh-btn {
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.refresh-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(102, 126, 234, 0.25);
}
</style>
