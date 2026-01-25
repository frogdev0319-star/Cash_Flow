import { ref } from 'vue'

export type Locale = 'zh_TW' | 'en_US' | 'ja_JP'

export const locale = ref<Locale>('zh_TW')

const STORAGE_KEY = 'tokenz_locale'

const messages: Record<Locale, Record<string, string>> = {
  zh_TW: {
    'language.label': '語系',
    'language.zhTW': '繁中',
    'language.en': '英文',
    'language.ja': '日文',

    'home.subtitle': 'TokenZ 線上支付流程',
    'home.buyNow': '立即購買',

    'payment.back': '← 返回',
    'payment.title': '完成付款',
    'payment.summary': '訂單摘要',
    'payment.productName': '商品名稱：',
    'payment.total': '總金額：',
    'payment.info': '點擊下方按鈕將轉址到安全的支付頁面',
    'payment.redirecting': '正在轉址...',
    'payment.goPay': '前往支付',
    'payment.secure': '🔒 使用 Tokenz 安全支付系統',
    'payment.createFailed': '無法創建支付工作階段，請稍後再試',
    'payment.user': '使用者',
    'auth.logout': '登出',
    'auth.user': '使用者',
    'nav.plans': '選擇方案',
    'nav.orders': '訂單紀錄',
    'orders.title': '訂單狀況',
    'orders.plan': '訂單方案',
    'orders.price': '價格',
    'orders.date': '訂單日期',
    'orders.status': '付款狀況',
    'orders.loading': '載入中...',
    'orders.refresh': '重新整理',
    'orders.empty': '目前沒有訂單',
    'orders.fetchFailed': '讀取訂單失敗',
    'orders.statusSucceeded': '已付款',
    'orders.statusRefunded': '已退款',
    'orders.statusFailed': '付款失敗',
    'orders.statusPending': '處理中',
    'orders.statusCreated': '待付款',
    'orders.cancel': '取消訂單',
    'orders.canceling': '取消中...',
    'orders.cancelConfirm': '確定要取消此訂單嗎？',
    'orders.cancelFailed': '取消訂單失敗',
    'orders.cancelTitle': '取消訂單',
    'orders.cancelSubtitle': '請填寫退款原因後送出取消申請',
    'orders.cancelReason': '退款原因',
    'orders.cancelDetail': '詳細說明',
    'orders.cancelDetailPlaceholder': '請輸入詳細說明',
    'orders.reasonCustomerCancellation': '取消訂單',
    'orders.reasonDuplicatePayment': '付款重複',
    'orders.reasonOther': '其他原因',
    'common.cancel': '取消',
    'common.confirm': '確定',

    'success.title': '付款成功！',
    'success.thanks': '感謝您的購買',
    'success.paymentId': '交易編號：',
    'success.amount': '付款金額：',
    'success.home': '返回首頁',
    'success.receipt': '📧 付款收據已發送到您的電子郵件',

    'cancel.title': '付款已取消',
    'cancel.message': '您的付款已被取消，未產生任何費用',
    'cancel.home': '返回首頁',
    'cancel.retry': '重新嘗試',

    'pending.title': '付款處理中',
    'pending.message': '正在確認付款狀態，請稍候...',
    'pending.home': '返回首頁'
    ,
    'login.title': '登入',
    'login.subtitle': '請輸入帳號與密碼',
    'login.account': '帳號（Email）',
    'login.password': '密碼',
    'login.submit': '登入',
    'login.loading': '登入中...',
    'login.failed': '登入失敗'
  },
  en_US: {
    'language.label': 'Language',
    'language.zhTW': '繁體中文',
    'language.en': 'English',
    'language.ja': 'Japanese',

    'home.subtitle': 'TEST online checkout flow',
    'home.buyNow': 'Buy now',

    'payment.back': '← Back',
    'payment.title': 'Complete payment',
    'payment.summary': 'Order summary',
    'payment.productName': 'Product:',
    'payment.total': 'Total:',
    'payment.info': 'Click the button below to continue to a secure payment page',
    'payment.redirecting': 'Redirecting...',
    'payment.goPay': 'Pay',
    'payment.secure': '🔒 Secured by Tokenz',
    'payment.createFailed': 'Unable to create a payment session. Please try again later.',
    'payment.user': 'User',
    'auth.logout': 'Sign out',
    'auth.user': 'User',
    'nav.plans': 'Plans',
    'nav.orders': 'Order history',
    'orders.title': 'Orders',
    'orders.plan': 'Plan',
    'orders.price': 'Price',
    'orders.date': 'Order date',
    'orders.status': 'Payment status',
    'orders.loading': 'Loading...',
    'orders.refresh': 'Refresh',
    'orders.empty': 'No orders yet',
    'orders.fetchFailed': 'Failed to load orders',
    'orders.statusSucceeded': 'Paid',
    'orders.statusRefunded': 'Refunded',
    'orders.statusFailed': 'Failed',
    'orders.statusPending': 'Pending',
    'orders.statusCreated': 'Unpaid',
    'orders.cancel': 'Cancel order',
    'orders.canceling': 'Canceling...',
    'orders.cancelConfirm': 'Cancel this order?',
    'orders.cancelFailed': 'Failed to cancel order',
    'orders.cancelTitle': 'Cancel order',
    'orders.cancelSubtitle': 'Please enter a refund reason before submitting',
    'orders.cancelReason': 'Refund reason',
    'orders.cancelDetail': 'Detail',
    'orders.cancelDetailPlaceholder': 'Enter detail',
    'orders.reasonCustomerCancellation': 'Customer cancellation',
    'orders.reasonDuplicatePayment': 'Duplicate payment',
    'orders.reasonOther': 'Other',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',

    'success.title': 'Payment successful!',
    'success.thanks': 'Thanks for your purchase',
    'success.paymentId': 'Transaction ID:',
    'success.amount': 'Amount:',
    'success.home': 'Back to home',
    'success.receipt': '📧 A receipt has been sent to your email',

    'cancel.title': 'Payment canceled',
    'cancel.message': 'Your payment was canceled and no charge was made.',
    'cancel.home': 'Back to home',
    'cancel.retry': 'Try again',

    'pending.title': 'Payment pending',
    'pending.message': 'Confirming payment status. Please wait...',
    'pending.home': 'Back to home'
    ,
    'login.title': 'Sign in',
    'login.subtitle': 'Enter your account and password',
    'login.account': 'Account (Email)',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.loading': 'Signing in...',
    'login.failed': 'Sign in failed'
  },
  ja_JP: {
    'language.label': '言語',
    'language.zhTW': '繁体字',
    'language.en': '英語',
    'language.ja': '日本語',

    'home.subtitle': 'TEST オンライン決済フロー',
    'home.buyNow': '今すぐ購入',

    'payment.back': '← 戻る',
    'payment.title': 'お支払い',
    'payment.summary': '注文内容',
    'payment.productName': '商品名：',
    'payment.total': '合計：',
    'payment.info': '下のボタンから安全な決済ページへ移動します',
    'payment.redirecting': '移動中...',
    'payment.goPay': '支払う',
    'payment.secure': '🔒 Tokenz の安全な決済',
    'payment.createFailed': '決済セッションを作成できませんでした。時間をおいて再試行してください。',
    'payment.user': 'ユーザー',
    'auth.logout': 'ログアウト',
    'auth.user': 'ユーザー',
    'nav.plans': 'プラン選択',
    'nav.orders': '注文履歴',
    'orders.title': '注文状況',
    'orders.plan': 'プラン',
    'orders.price': '価格',
    'orders.date': '注文日時',
    'orders.status': '支払い状況',
    'orders.loading': '読み込み中...',
    'orders.refresh': '更新',
    'orders.empty': '注文はまだありません',
    'orders.fetchFailed': '注文の取得に失敗しました',
    'orders.statusSucceeded': '支払い済み',
    'orders.statusRefunded': '返金済み',
    'orders.statusFailed': '失敗',
    'orders.statusPending': '処理中',
    'orders.statusCreated': '未払い',
    'orders.cancel': '注文をキャンセル',
    'orders.canceling': 'キャンセル中...',
    'orders.cancelConfirm': 'この注文をキャンセルしますか？',
    'orders.cancelFailed': '注文のキャンセルに失敗しました',
    'orders.cancelTitle': '注文をキャンセル',
    'orders.cancelSubtitle': '返金理由を入力して送信してください',
    'orders.cancelReason': '返金理由',
    'orders.cancelDetail': '詳細',
    'orders.cancelDetailPlaceholder': '詳細を入力してください',
    'orders.reasonCustomerCancellation': 'お客様都合のキャンセル',
    'orders.reasonDuplicatePayment': '重複決済',
    'orders.reasonOther': 'その他',
    'common.cancel': 'キャンセル',
    'common.confirm': '確定',

    'success.title': 'お支払い完了！',
    'success.thanks': 'ご購入ありがとうございます',
    'success.paymentId': '取引番号：',
    'success.amount': '金額：',
    'success.home': 'ホームへ戻る',
    'success.receipt': '📧 領収書をメールで送信しました',

    'cancel.title': '支払いがキャンセルされました',
    'cancel.message': 'お支払いはキャンセルされ、請求は発生していません。',
    'cancel.home': 'ホームへ戻る',
    'cancel.retry': 'もう一度試す',

    'pending.title': '処理中',
    'pending.message': '支払い状況を確認しています。しばらくお待ちください...',
    'pending.home': 'ホームへ戻る'
    ,
    'login.title': 'ログイン',
    'login.subtitle': 'アカウントとパスワードを入力してください',
    'login.account': 'アカウント（メール）',
    'login.password': 'パスワード',
    'login.submit': 'ログイン',
    'login.loading': 'ログイン中...',
    'login.failed': 'ログインに失敗しました'
  }
}

export function initLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh_TW' || saved === 'en_US' || saved === 'ja_JP') locale.value = saved
    if (saved === 'zh-TW') locale.value = 'zh_TW'
    if (saved === 'en') locale.value = 'en_US'
    if (saved === 'ja') locale.value = 'ja_JP'
  } catch { }
}

export function setLocale(next: Locale) {
  locale.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch { }
}

export function t(key: string) {
  return messages[locale.value][key] ?? messages.zh_TW[key] ?? key
}
