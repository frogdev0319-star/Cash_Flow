import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initLocale } from './i18n'
import { initAuth } from './auth'

initLocale()
initAuth()

createApp(App)
    .use(router)
    .mount('#app')
