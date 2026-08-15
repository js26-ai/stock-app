import React, { useState, useEffect } from 'react'

const STORAGE_KEY = 'products'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function App() {
  const [products, setProducts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name || quantity === '') return
    setProducts((prev) => [...prev, { id: uid(), name, quantity: Number(quantity) }])
    setName('')
    setQuantity('')
  }

  function handleDelete(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800" dir="rtl">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-indigo-700">📦 نظام تسيير المخزون</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {/* فورم إضافة منتج */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500">اسم المنتج</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: قضيب حديد 12 مم"
              required
            />
          </div>
          <div className="sm:w-40">
            <label className="text-xs font-semibold text-slate-500">الكمية</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-indigo-700 w-full sm:w-auto"
            >
              إضافة
            </button>
          </div>
        </form>

        {/* جدول المنتجات */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-right px-4 py-2">اسم المنتج</th>
                <th className="text-right px-4 py-2">الكمية</th>
                <th className="text-right px-4 py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-slate-400 py-6">
                    لا توجد منتجات بعد.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">{p.quantity}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
