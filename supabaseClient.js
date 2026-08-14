import { createClient } from '@supabase/supabase-js'

// كنخزنو غير الإعدادات ديال الاتصال (URL + clé) ف localStorage
// الداتا ديال المنتجات والمبيعات ماشي هنا — هادوك كيتخزنو ف Supabase
const CONFIG_KEY = 'supabase_config'

export function loadSupabaseConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : { url: '', anonKey: '' }
  } catch {
    return { url: '', anonKey: '' }
  }
}

export function saveSupabaseConfig(url, anonKey) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, anonKey }))
}

export function createSupabaseClient(url, anonKey) {
  if (!url || !anonKey) return null
  try {
    return createClient(url, anonKey)
  } catch {
    return null
  }
}
