import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney, formatNumber } from '../../utils/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../utils/cn'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { addToast } = useToast()
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [recipes, setRecipes] = useState([])
  const [allMaterials, setAllMaterials] = useState([])
  const [tab, setTab] = useState('products')
  const [loading, setLoading] = useState(true)
  const [editRecipe, setEditRecipe] = useState(null)
  const [recipeItems, setRecipeItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', type: 'finished_good', unit: 'pcs', selling_price: '', cost_price: '', reorder_level: '' })

  async function load() {
    setLoading(true)
    const [{ data: p }, { data: r }, { data: mats }] = await Promise.all([
      supabase.from('products').select('id, name, type, unit, selling_price, cost_price, reorder_level, is_active').order('type').order('name'),
      supabase.from('recipes').select('id, product_id, name, yield_quantity, recipe_items(id, product_id, quantity, products(name, unit))'),
      supabase.from('products').select('id, name, unit, type').in('type', ['raw_material', 'packaging']).eq('is_active', true).order('name'),
    ])
    setProducts(p || [])
    setRecipes(r || [])
    setAllMaterials(mats || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openRecipe(recipe) {
    setEditRecipe(recipe)
    setRecipeItems(
      (recipe.recipe_items || []).map((ri) => ({
        product_id: ri.product_id,
        quantity: Number(ri.quantity),
        name: ri.products?.name,
        unit: ri.products?.unit,
      }))
    )
  }

  function openNewRecipe(product) {
    const existing = recipes.find((r) => r.product_id === product.id)
    if (existing) {
      openRecipe(existing)
      return
    }
    setEditRecipe({ id: null, product_id: product.id, name: `${product.name} Recipe`, yield_quantity: 1, productName: product.name })
    setRecipeItems([])
  }

  async function saveRecipe() {
    if (!editRecipe) return
    setSaving(true)
    try {
      let recipeId = editRecipe.id
      if (!recipeId) {
        const { data, error } = await supabase
          .from('recipes')
          .insert({ product_id: editRecipe.product_id, name: editRecipe.name, yield_quantity: 1 })
          .select()
          .single()
        if (error) throw error
        recipeId = data.id
      } else {
        await supabase.from('recipe_items').delete().eq('recipe_id', recipeId)
      }
      if (recipeItems.length > 0) {
        const { error } = await supabase.from('recipe_items').insert(
          recipeItems.filter((i) => i.product_id && i.quantity > 0).map((i) => ({
            recipe_id: recipeId,
            product_id: i.product_id,
            quantity: i.quantity,
          }))
        )
        if (error) throw error
      }
      addToast('Recipe saved')
      setEditRecipe(null)
      await load()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function addProduct() {
    if (!newProduct.name.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('products').insert({
        name: newProduct.name.trim(),
        type: newProduct.type,
        unit: newProduct.unit || 'pcs',
        selling_price: Number(newProduct.selling_price) || 0,
        cost_price: Number(newProduct.cost_price) || 0,
        reorder_level: Number(newProduct.reorder_level) || 0,
      })
      if (error) throw error
      // opening balance 0 via no movement
      addToast('Product added')
      setShowAddProduct(false)
      setNewProduct({ name: '', type: 'finished_good', unit: 'pcs', selling_price: '', cost_price: '', reorder_level: '' })
      await load()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'products', label: 'Products' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'business', label: 'Business' },
  ]

  const byType = {
    raw_material: products.filter((p) => p.type === 'raw_material'),
    packaging: products.filter((p) => p.type === 'packaging'),
    finished_good: products.filter((p) => p.type === 'finished_good'),
  }

  const finishedGoods = products.filter((p) => p.type === 'finished_good')

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-[#707070] mt-0.5">Products, recipes and business config</p>
        </div>
        {tab === 'products' && (
          <Button onClick={() => setShowAddProduct(true)}><Plus className="w-4 h-4" /> Add product</Button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-full text-sm',
              tab === t.id ? 'bg-[#181818] text-white' : 'bg-white border border-[#E8E8E5]')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'business' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-2">OLLY</h3>
            <p className="text-sm text-[#707070]">Food-processing business system</p>
            <p className="text-sm text-[#707070] mt-4">Currency: TZS</p>
            {user && <p className="text-sm text-[#707070] mt-1">Signed in as {user.email}</p>}
          </Card>
          <Button variant="secondary" className="w-full" onClick={async () => { await signOut(); navigate('/login') }}>
            Sign out
          </Button>
        </div>
      )}

      {tab === 'recipes' && (
        loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-20" />)}</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#707070] mb-2">Bill of materials per finished product. OLLY uses these for production.</p>
            {finishedGoods.map((p) => {
              const recipe = recipes.find((r) => r.product_id === p.id)
              return (
                <Card key={p.id} className="!p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {recipe ? (
                        <ul className="mt-2 space-y-1">
                          {(recipe.recipe_items || []).map((ri, i) => (
                            <li key={i} className="text-sm text-[#707070]">
                              {ri.products?.name}: {formatNumber(ri.quantity, 3)} {ri.products?.unit}
                            </li>
                          ))}
                          {(!recipe.recipe_items || recipe.recipe_items.length === 0) && (
                            <li className="text-sm text-[#B7833F]">No ingredients yet</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-[#B7833F] mt-1">No recipe</p>
                      )}
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => openNewRecipe(p)}>
                      <Pencil className="w-3.5 h-3.5" /> {recipe ? 'Edit' : 'Create'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      {tab === 'products' && (
        loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : (
          <div className="space-y-6">
            {[
              { key: 'finished_good', label: 'Finished goods' },
              { key: 'raw_material', label: 'Raw materials' },
              { key: 'packaging', label: 'Packaging' },
            ].map((section) => (
              <div key={section.key}>
                <h3 className="text-sm font-medium text-[#707070] mb-2 uppercase tracking-wider">{section.label}</h3>
                <div className="space-y-2">
                  {byType[section.key].map((p) => (
                    <Card key={p.id} className="!p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-[#707070] mt-0.5">Unit: {p.unit} · Reorder at {formatNumber(p.reorder_level)}</p>
                      </div>
                      <div className="text-right text-sm">
                        {p.type === 'finished_good' && (
                          <p className="tabular-nums font-medium">{formatMoney(p.selling_price)}</p>
                        )}
                        <p className="text-xs text-[#707070] tabular-nums">Cost {formatMoney(p.cost_price)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Recipe editor modal */}
      <Modal open={!!editRecipe} onClose={() => setEditRecipe(null)} title={editRecipe?.name || 'Edit recipe'} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-[#707070]">Ingredients per 1 unit of output</p>
          {recipeItems.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-[#707070]">Material</label>
                <select
                  className="w-full h-11 px-3 rounded-xl border border-[#E8E8E5] text-sm"
                  value={item.product_id || ''}
                  onChange={(e) => {
                    const mat = allMaterials.find((m) => m.id === e.target.value)
                    setRecipeItems((items) => items.map((it, i) =>
                      i === idx ? { ...it, product_id: e.target.value, name: mat?.name, unit: mat?.unit } : it
                    ))
                  }}
                >
                  <option value="">Select...</option>
                  {allMaterials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="text-xs text-[#707070]">Qty</label>
                <input type="number" step="0.001" className="w-full h-11 px-3 rounded-xl border border-[#E8E8E5] tabular-nums text-sm"
                  value={item.quantity} onChange={(e) => setRecipeItems((items) =>
                    items.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it)
                  )} />
              </div>
              <button className="h-11 px-3 text-sm text-[#B4534A]" onClick={() => setRecipeItems((items) => items.filter((_, i) => i !== idx))}>
                Remove
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setRecipeItems((items) => [...items, { product_id: '', quantity: 0 }])}>
            <Plus className="w-4 h-4" /> Add ingredient
          </Button>
          <Button className="w-full" loading={saving} onClick={saveRecipe}>Save recipe</Button>
        </div>
      </Modal>

      <Modal open={showAddProduct} onClose={() => setShowAddProduct(false)} title="Add product">
        <div className="space-y-3">
          <Input label="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
          <div>
            <label className="text-sm text-[#707070]">Type</label>
            <select className="mt-1 w-full h-11 px-3 rounded-xl border border-[#E8E8E5]"
              value={newProduct.type} onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}>
              <option value="finished_good">Finished good</option>
              <option value="raw_material">Raw material</option>
              <option value="packaging">Packaging</option>
            </select>
          </div>
          <Input label="Unit" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} placeholder="pcs, kg, L" />
          {newProduct.type === 'finished_good' && (
            <Input label="Selling price" type="number" value={newProduct.selling_price}
              onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })} />
          )}
          <Input label="Cost price" type="number" value={newProduct.cost_price}
            onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })} />
          <Input label="Reorder level" type="number" value={newProduct.reorder_level}
            onChange={(e) => setNewProduct({ ...newProduct, reorder_level: e.target.value })} />
          <Button className="w-full" loading={saving} disabled={!newProduct.name.trim()} onClick={addProduct}>Save product</Button>
        </div>
      </Modal>
    </div>
  )
}
