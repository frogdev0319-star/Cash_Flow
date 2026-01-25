import { ref } from 'vue'

export const isLoggedIn = ref(false)
export const userEmail = ref('')

export function initAuth() {
  try {
    isLoggedIn.value = sessionStorage.getItem('tokenz_logged_in') === '1'
    userEmail.value = sessionStorage.getItem('tokenz_user_email') || ''
  } catch {
    isLoggedIn.value = false
    userEmail.value = ''
  }
}

export function setAuthUser(email: string) {
  isLoggedIn.value = true
  userEmail.value = email
  try {
    sessionStorage.setItem('tokenz_logged_in', '1')
    sessionStorage.setItem('tokenz_user_email', email)
  } catch {}
}

export function clearAuth() {
  isLoggedIn.value = false
  userEmail.value = ''
  try {
    sessionStorage.removeItem('tokenz_logged_in')
    sessionStorage.removeItem('tokenz_user_email')
  } catch {}
}

