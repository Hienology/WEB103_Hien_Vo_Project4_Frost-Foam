import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BASE_DRINKS, FLAVORS, TOPPINGS } from './config/catalog'
import { estimatePrepTime, calculatePriceBreakdown } from './utils/pricing'
import { drinksApi } from './services/drinksApi'
import './App.css'

const defaultOptions = {
  base: 'milkshake',
  flavor: 'vanilla',
  size: 'regular',
  toppings: [],
  serviceType: 'dine_in',
}

function DrinkForm({ initialName = '', initialOptions = defaultOptions, onSave, submitting }) {
  const [name, setName] = useState(initialName)
  const [options, setOptions] = useState(initialOptions)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const liveBreakdown = useMemo(() => calculatePriceBreakdown(options), [options])
  const prepTime = useMemo(() => estimatePrepTime(options), [options])

  const toggleTopping = (id) => {
    setOptions((prev) => ({
      ...prev,
      toppings: prev.toppings.includes(id)
        ? prev.toppings.filter((value) => value !== id)
        : [...prev.toppings, id],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave({ name, options })
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <label>
        Custom drink name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Frost Favorite" />
      </label>

      <label>
        Base drink
        <select
          value={options.base}
          onChange={(e) => setOptions((prev) => ({ ...prev, base: e.target.value }))}
        >
          {Object.entries(BASE_DRINKS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Flavor
        <select
          value={options.flavor}
          onChange={(e) => setOptions((prev) => ({ ...prev, flavor: e.target.value }))}
        >
          {Object.entries(FLAVORS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <p>Size</p>
        <label className="inline-label">
          <input
            type="radio"
            name="size"
            value="regular"
            checked={options.size === 'regular'}
            onChange={() => setOptions((prev) => ({ ...prev, size: 'regular' }))}
          />
          Regular
        </label>
        <label className="inline-label">
          <input
            type="radio"
            name="size"
            value="large"
            checked={options.size === 'large'}
            onChange={() => setOptions((prev) => ({ ...prev, size: 'large' }))}
          />
          Large
        </label>
      </div>

      <div>
        <p>Toppings (explore freely)</p>
        <div className="chips">
          {Object.entries(TOPPINGS).map(([key, value]) => (
            <label className="chip" key={key}>
              <input
                type="checkbox"
                checked={options.toppings.includes(key)}
                onChange={() => toggleTopping(key)}
              />
              {value.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p>Service</p>
        <label className="inline-label">
          <input
            type="radio"
            name="serviceType"
            value="dine_in"
            checked={options.serviceType === 'dine_in'}
            onChange={() => setOptions((prev) => ({ ...prev, serviceType: 'dine_in' }))}
          />
          Dine in
        </label>
        <label className="inline-label">
          <input
            type="radio"
            name="serviceType"
            value="take_home"
            checked={options.serviceType === 'take_home'}
            onChange={() => setOptions((prev) => ({ ...prev, serviceType: 'take_home' }))}
          />
          Take home
        </label>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save drink'}
      </button>

      <div className="preview">
        <h3>Live Preview</h3>
        <p>
          {BASE_DRINKS[options.base]?.label} · {FLAVORS[options.flavor]?.label} · {options.size}
        </p>
        <p>Toppings: {options.toppings.length ? options.toppings.map((t) => TOPPINGS[t].label).join(', ') : 'None'}</p>
        <p>Service: {options.serviceType === 'take_home' ? 'Take home' : 'Dine in'}</p>
        <p className="strong">Total: ${liveBreakdown?.total.toFixed(2)}</p>
        <p>⏱ {prepTime} min</p>
        <button type="button" className="secondary" onClick={() => setShowBreakdown((v) => !v)}>
          {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
        </button>
        {showBreakdown ? (
          <ul>
            <li>Subtotal: ${liveBreakdown?.subtotal.toFixed(2)}</li>
            <li>Discount: -${liveBreakdown?.discount.toFixed(2)}</li>
          </ul>
        ) : null}
      </div>
    </form>
  )
}

function BuilderPage() {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const handleSave = async (payload) => {
    setError('')
    setSaving(true)
    try {
      await drinksApi.create(payload)
      navigate('/drinks')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <h1>Frost & Foam</h1>
      <p className="subtitle">Build your custom café drink with live price and prep-time preview.</p>
      {error ? <p className="error">{error}</p> : null}
      <DrinkForm onSave={handleSave} submitting={saving} />
    </section>
  )
}

function DrinksListPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    drinksApi
      .list()
      .then((data) => {
        if (mounted) setItems(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section>
      <h1>Saved Drinks</h1>
      {loading ? <p>Loading...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="cards">
        {items.map((drink) => (
          <article className="card" key={drink.id}>
            <h3>{drink.name}</h3>
            <p>
              {BASE_DRINKS[drink.options.base]?.label} · {drink.options.size} ·{' '}
              {drink.options.serviceType === 'take_home' ? 'Take home' : 'Dine in'}
            </p>
            <p>${Number(drink.price).toFixed(2)}</p>
            <p>⏱ {drink.prepTimeMinutes} min</p>
            <Link to={`/drinks/${drink.id}`}>View details</Link>
          </article>
        ))}
      </div>
    </section>
  )
}

function DrinkDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drink, setDrink] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    drinksApi.get(id).then(setDrink).catch((err) => setError(err.message))
  }, [id])

  const handleDelete = async () => {
    const ok = window.confirm('Delete this drink?')
    if (!ok) return
    await drinksApi.remove(id)
    navigate('/drinks')
  }

  if (error) return <p className="error">{error}</p>
  if (!drink) return <p>Loading...</p>

  return (
    <section className="panel">
      <h1>{drink.name}</h1>
      <p>
        {BASE_DRINKS[drink.options.base]?.label} with {FLAVORS[drink.options.flavor]?.label}
      </p>
      <p>Price: ${Number(drink.price).toFixed(2)}</p>
      <p>⏱ {drink.prepTimeMinutes} min</p>
      <h3>Price Breakdown</h3>
      <ul>
        <li>Base: ${drink.priceBreakdown.base.amount.toFixed(2)}</li>
        <li>Flavor: ${drink.priceBreakdown.flavor.amount.toFixed(2)}</li>
        <li>Size: ${drink.priceBreakdown.size.amount.toFixed(2)}</li>
        <li>
          Toppings: $
          {drink.priceBreakdown.toppings.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
        </li>
        <li>Discount: -${drink.priceBreakdown.discount.amount.toFixed(2)}</li>
      </ul>
      <div className="actions">
        <Link to={`/drinks/${drink.id}/edit`}>Edit</Link>
        <button type="button" className="secondary" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </section>
  )
}

function EditDrinkPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drink, setDrink] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    drinksApi.get(id).then(setDrink).catch((err) => setError(err.message))
  }, [id])

  const onSave = async (payload) => {
    setError('')
    setSaving(true)
    try {
      await drinksApi.update(id, payload)
      navigate(`/drinks/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!drink) return <p>Loading...</p>

  return (
    <section>
      <h1>Edit Drink</h1>
      <p className="subtitle">Adjust your previous choices and resave.</p>
      {error ? <p className="error">{error}</p> : null}
      <DrinkForm
        initialName={drink.name}
        initialOptions={drink.options}
        onSave={onSave}
        submitting={saving}
      />
    </section>
  )
}

function App() {
  return (
    <div className="app-shell">
      <nav>
        <Link to="/">Customizer</Link>
        <Link to="/drinks">Saved Drinks</Link>
      </nav>
      <Routes>
        <Route path="/" element={<BuilderPage />} />
        <Route path="/drinks" element={<DrinksListPage />} />
        <Route path="/drinks/:id" element={<DrinkDetailsPage />} />
        <Route path="/drinks/:id/edit" element={<EditDrinkPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
