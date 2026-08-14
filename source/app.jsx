import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { loadSupabaseConfig, saveSupabaseConfig, createSupabaseClient } from './supabaseClient'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function App() {
  const [tab, setTab] = useState('dashboard') // dashboard | products | sales | settings

  // الإعدادات ديال Supabase (URL + Clé) — مخزنين ف localStorage غير هوما
  const [config, setConfig] = useState(() => loadSupabaseConfig())
  const supabase = useMemo(
    () => createSupabaseClient(config.url, config.anonKey),
    [config.url, config.anonKey]
  )
  const isConnected = Boolean(supabase)

  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // ---------- جلب الداتا من Supabase ----------
  const fetchProducts = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true })
    if (error) setErrorMsg(error.message)
    else setProducts(data || [])
  }, [supabase])

  const fetchSales = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false })
    if (error) setErrorMsg(error.message)
    else setSales(data || [])
  }, [supabase])

  const refreshAll = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setErrorMsg('')
    await Promise.all([fetchProducts(), fetchSales()])
    setLoading(false)
  }, [supabase, fetchProducts, fetchSales])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // ---------- إحصائيات ----------
  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalStockQty = products.reduce((s, p) => s + Number(p.quantity), 0)
    const totalStockValue = products.reduce((s, p) => s + Number(p.quantity) * Number(p.price), 0)
    const totalRevenue = sales.reduce((s, sv) => s + Number(sv.total), 0)
    const totalSalesCount = sales.reduce((s, sv) => s + Number(sv.qty), 0)
    const lowStock = products.filter((p) => Number(p.quantity) <= Number(p.min_qty || 5))

    const salesByProduct = {}
    sales.forEach((sv) => {
      salesByProduct[sv.product_name] = (salesByProduct[sv.product_name] || 0) + Number(sv.qty)
    })
    const topProducts = Object.entries(salesByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { totalProducts, totalStockQty, totalStockValue, totalRevenue, totalSalesCount, lowStock, topProducts }
  }, [products, sales])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800" dir="rtl">
      <Header tab={tab} setTab={setTab} isConnected={isConnected} />
      <main className="max-w-6xl mx-auto p-4">
        {!isConnected && tab !== 'settings' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 mb-4 text-sm">
            ⚠️ ماشي متصل ب Supabase. سير لـ «الإعدادات» وعمر SUPABASE_URL و SUPABASE_ANON_KEY.
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4 text-sm">
            {errorMsg}
          </div>
        )}
        {loading && <p className="text-sm text-slate-400 mb-4">جاري التحميل...</p>}

        {tab === 'dashboard' && <Dashboard stats={stats} />}
        {tab === 'products' && (
          <Products supabase={supabase} products={products} refreshAll={refreshAll} setErrorMsg={setErrorMsg} />
        )}
        {tab === 'sales' && (
          <Sales
            supabase={supabase}
            products={products}
            sales={sales}
            refreshAll={refreshAll}
            setErrorMsg={setErrorMsg}
          />
        )}
        {tab === 'settings' && (
          <Settings config={config} setConfig={setConfig} isConnected={isConnected} onRefresh={refreshAll} />
        )}
      </main>
    </div>
  )
}

// ==================== الرأس / التنقل ====================
function Header({ tab, setTab, isConnected }) {
  const tabs = [
    { id: 'dashboard', label: 'الإحصائيات' },
    { id: 'products', label: 'المنتجات' },
    { id: 'sales', label: 'البيع' },
    { id: 'settings', label: 'الإعدادات' },
  ]
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-indigo-700">📦 تسيير المخزون</h1>
          <span
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`}
            title={isConnected ? 'متصل' : 'غير متصل'}
          />
        </div>
        <nav className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

// ==================== لوحة الإحصائيات ====================
function Dashboard({ stats }) {
  const cards = [
    { label: 'عدد المنتجات', value: stats.totalProducts, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'الكمية الإجمالية بالمخزون', value: stats.totalStockQty, color: 'bg-blue-50 text-blue-700' },
    { label: 'قيمة المخزون (درهم)', value: stats.totalStockValue.toFixed(2), color: 'bg-emerald-50 text-emerald-700' },
    { label: 'رقم المعاملات (درهم)', value: stats.totalRevenue.toFixed(2), color: 'bg-amber-50 text-amber-700' },
    { label: 'عدد القطع المباعة', value: stats.totalSalesCount, color: 'bg-purple-50 text-purple-700' },
  ]

  const maxTop = stats.topProducts.length ? stats.topProducts[0][1] : 1

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-4 shadow-sm ${c.color}`}>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs mt-1 font-medium opacity-80">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h2 className="font-bold mb-3 text-red-600">⚠️ منتجات ناقصة (مخزون منخفض)</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-slate-400">لا يوجد نقص حاليا.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex justify-between text-sm bg-red-50 rounded-lg px-3 py-2">
                  <span>{p.name}</span>
                  <span className="font-bold text-red-600">{p.quantity} متبقي</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h2 className="font-bold mb-3 text-indigo-700">🏆 الأكثر مبيعا</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">لا توجد مبيعات بعد.</p>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map(([name, qty]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{name}</span>
                    <span className="font-semibold">{qty}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${(qty / maxTop) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== المنتجات ====================
function Products({ supabase, products, refreshAll, setErrorMsg }) {
  const emptyForm = { name: '', category: '', price: '', quantity: '', min_qty: '' }
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!supabase) return
    if (!form.name || form.price === '' || form.quantity === '') return
    setSaving(true)
    setErrorMsg('')

    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name,
          category: form.category,
          price: Number(form.price),
          quantity: Number(form.quantity),
          min_qty: form.min_qty === '' ? null : Number(form.min_qty),
        })
        .eq('id', editingId)
      if (error) setErrorMsg(error.message)
      setEditingId(null)
    } else {
      const { error } = await supabase.from('products').insert({
        name: form.name,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        min_qty: form.min_qty === '' ? null : Number(form.min_qty),
      })
      if (error) setErrorMsg(error.message)
    }

    setForm(emptyForm)
    setSaving(false)
    refreshAll()
  }

  function handleEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      category: p.category || '',
      price: p.price,
      quantity: p.quantity,
      min_qty: p.min_qty ?? '',
    })
  }

  async function handleDelete(id) {
    if (!supabase) return
    if (!confirm('واش متأكد أنك بغيتي تمسح هاد المنتج؟')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) setErrorMsg(error.message)
    refreshAll()
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border h-fit space-y-3">
        <h2 className="font-bold text-indigo-700">{editingId ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500">اسم المنتج</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">الفئة</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-500">الثمن (درهم)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">الكمية</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">حد التنبيه (نقص المخزون)</label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
            placeholder="5"
            value={form.min_qty}
            onChange={(e) => setForm({ ...form, min_qty: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!supabase || saving}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '...جاري الحفظ' : editingId ? 'حفظ التعديل' : 'إضافة'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
              className="px-3 rounded-lg border text-sm"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      <div className="md:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-right px-3 py-2">المنتج</th>
              <th className="text-right px-3 py-2">الفئة</th>
              <th className="text-right px-3 py-2">الثمن</th>
              <th className="text-right px-3 py-2">الكمية</th>
              <th className="text-right px-3 py-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-6">
                  لا توجد منتجات بعد.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2 text-slate-500">{p.category || '—'}</td>
                <td className="px-3 py-2">{Number(p.price).toFixed(2)} د.م.</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      Number(p.quantity) <= Number(p.min_qty || 5)
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {p.quantity}
                  </span>
                </td>
                <td className="px-3 py-2 space-x-2 space-x-reverse">
                  <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:underline text-xs">
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-xs">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== البيع ====================
function Sales({ supabase, products, sales, refreshAll, setErrorMsg }) {
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedProduct = products.find((p) => p.id === productId)

  async function handleSell(e) {
    e.preventDefault()
    if (!supabase || !selectedProduct || !qty) return
    const qtyNum = Number(qty)
    if (qtyNum <= 0) return
    if (qtyNum > Number(selectedProduct.quantity)) {
      alert('الكمية المطلوبة أكبر من المخزون المتوفر!')
      return
    }

    setSaving(true)
    setErrorMsg('')

    // 1) ننقصو الكمية من جدول products
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: Number(selectedProduct.quantity) - qtyNum })
      .eq('id', productId)

    if (updateError) {
      setErrorMsg(updateError.message)
      setSaving(false)
      return
    }

    // 2) نسجلو البيع ف جدول sales
    const { error: insertError } = await supabase.from('sales').insert({
      product_id: productId,
      product_name: selectedProduct.name,
      qty: qtyNum,
      unit_price: Number(selectedProduct.price),
      total: qtyNum * Number(selectedProduct.price),
    })

    if (insertError) setErrorMsg(insertError.message)

    setProductId('')
    setQty('')
    setSaving(false)
    refreshAll()
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <form onSubmit={handleSell} className="bg-white rounded-xl p-4 shadow-sm border h-fit space-y-3">
        <h2 className="font-bold text-indigo-700">تسجيل عملية بيع</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500">المنتج</label>
          <select
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">اختر منتج...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={Number(p.quantity) <= 0}>
                {p.name} (متوفر: {p.quantity})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">الكمية المباعة</label>
          <input
            type="number"
            min="1"
            className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </div>
        {selectedProduct && qty && (
          <div className="bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2 text-sm font-semibold">
            المجموع: {(Number(qty) * Number(selectedProduct.price)).toFixed(2)} د.م.
          </div>
        )}
        <button
          type="submit"
          disabled={!supabase || saving}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? '...جاري التسجيل' : 'تأكيد البيع'}
        </button>
      </form>

      <div className="md:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-right px-3 py-2">المنتج</th>
              <th className="text-right px-3 py-2">الكمية</th>
              <th className="text-right px-3 py-2">المجموع</th>
              <th className="text-right px-3 py-2">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-6">
                  لا توجد مبيعات بعد.
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2 font-medium">{s.product_name}</td>
                <td className="px-3 py-2">{s.qty}</td>
                <td className="px-3 py-2 font-semibold text-emerald-600">{Number(s.total).toFixed(2)} د.م.</td>
                <td className="px-3 py-2 text-slate-500 text-xs">
                  {new Date(s.date).toLocaleString('ar-MA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== الإعدادات ====================
function Settings({ config, setConfig, isConnected, onRefresh }) {
  const [url, setUrl] = useState(config.url)
  const [anonKey, setAnonKey] = useState(config.anonKey)
  const [savedMsg, setSavedMsg] = useState('')

  function handleSave(e) {
    e.preventDefault()
    saveSupabaseConfig(url.trim(), anonKey.trim())
    setConfig({ url: url.trim(), anonKey: anonKey.trim() })
    setSavedMsg('تم الحفظ ✅')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl p-5 shadow-sm border space-y-4">
        <h2 className="font-bold text-indigo-700 text-lg">إعدادات الاتصال ب Supabase</h2>
        <p className="text-xs text-slate-500">
          نلقاو هاد المعلومات ف Supabase Dashboard {'>'} Project Settings {'>'} API
        </p>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">SUPABASE_URL</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm ltr:text-left"
              dir="ltr"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">SUPABASE_ANON_KEY</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm ltr:text-left"
              dir="ltr"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-indigo-700">
              حفظ
            </button>
            {savedMsg && <span className="text-emerald-600 text-sm font-semibold">{savedMsg}</span>}
          </div>
        </form>

        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-sm">
            الحالة:{' '}
            <span className={isConnected ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
              {isConnected ? 'متصل' : 'غير متصل'}
            </span>
          </span>
          <button onClick={onRefresh} className="text-xs text-indigo-600 hover:underline">
            تحديث الداتا
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        ملاحظة: هاد المعلومات (URL والمفتاح العمومي anon) كتتخزن ف localStorage ديال المتصفح باش تبقى محفوظة، الداتا ديال المنتجات والمبيعات كتبقى فـ Supabase.
      </p>
    </div>
  )
}
