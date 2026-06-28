import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BASE_DRINKS, FLAVORS, RULES, TOPPINGS } from './config/catalog'
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

function formatMoney(amount = 0) {
  return `$${Number(amount).toFixed(2)}`
}

function renderToppingBreakdown(toppings = []) {
  const toppingTotal = toppings.reduce((sum, item) => sum + item.amount, 0)

  return (
    <>
      {toppings.length ? (
        toppings.map((item) => (
          <li key={item.label} className="breakdown-row">
            <span>{item.label}</span>
            <span className="breakdown-addon">+{formatMoney(item.amount)}</span>
          </li>
        ))
      ) : (
        <li className="breakdown-row">
          <span>None</span>
          <span>{formatMoney(0)}</span>
        </li>
      )}
      <li className="breakdown-row strong">
        <span>Topping add-ons total</span>
        <span>{formatMoney(toppingTotal)}</span>
      </li>
    </>
  )
}

function validateDrinkSelection(name, options = {}) {
  if (!name || !String(name).trim()) {
    return 'Please provide a name for your custom drink.'
  }

  if (!BASE_DRINKS[options.base]) {
    return 'Please choose a valid base drink.'
  }

  if (!FLAVORS[options.flavor]) {
    return 'Please choose a valid flavor.'
  }

  if (!['regular', 'large'].includes(options.size)) {
    return 'Please choose a valid size.'
  }

  if (!['dine_in', 'take_home'].includes(options.serviceType)) {
    return 'Please choose a valid service type.'
  }

  const toppings = Array.isArray(options.toppings) ? options.toppings : []
  const invalidTopping = toppings.find((topping) => !TOPPINGS[topping])
  if (invalidTopping) {
    return 'One or more selected toppings are invalid.'
  }

  const disallowed = RULES.disallowedToppingsByBase[options.base] || []
  const blockedTopping = toppings.find((topping) => disallowed.includes(topping))
  if (blockedTopping) {
    return `The topping "${TOPPINGS[blockedTopping].label}" is not compatible with ${BASE_DRINKS[options.base].label}.`
  }

  if (options.serviceType === 'take_home' && toppings.length > RULES.maxTakeHomeToppings) {
    return `Take-home drinks can include at most ${RULES.maxTakeHomeToppings} toppings.`
  }

  return null
}

function DrinkForm({ initialName = '', initialOptions = defaultOptions, onSave, submitting }) {
  const [name, setName] = useState(initialName)
  const [options, setOptions] = useState(initialOptions)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [formError, setFormError] = useState('')

  const liveBreakdown = useMemo(() => calculatePriceBreakdown(options), [options])
  const prepTime = useMemo(() => estimatePrepTime(options), [options])

  useEffect(() => {
    setFormError('')
  }, [name, options])

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
    const validationError = validateDrinkSelection(name, options)
    if (validationError) {
      setFormError(validationError)
      return
    }

    onSave({ name: String(name).trim(), options })
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

      {formError ? <p className="error">{formError}</p> : null}

      <div className="preview">
        <h3>Live Preview</h3>
        <p>
          {BASE_DRINKS[options.base]?.label} · {FLAVORS[options.flavor]?.label} · {options.size}
        </p>
        <p>Toppings: {options.toppings.length ? options.toppings.map((t) => TOPPINGS[t].label).join(', ') : 'None'}</p>
        <p>Service: {options.serviceType === 'take_home' ? 'Take home' : 'Dine in'}</p>
        <p className="strong">Total: {formatMoney(liveBreakdown?.total)}</p>
        <p>⏱ {prepTime} min</p>
        <button type="button" className="secondary" onClick={() => setShowBreakdown((v) => !v)}>
          {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
        </button>
        {showBreakdown ? (
          <ul className="breakdown-list">
            <li className="breakdown-row">
              <span>Base</span>
              <span>{formatMoney(liveBreakdown?.base?.amount)}</span>
            </li>
            <li className="breakdown-row">
              <span>Flavor</span>
              <span>{formatMoney(liveBreakdown?.flavor?.amount)}</span>
            </li>
            <li className="breakdown-row">
              <span>Size</span>
              <span>{formatMoney(liveBreakdown?.size?.amount)}</span>
            </li>
            {renderToppingBreakdown(liveBreakdown?.toppings ?? [])}
            <li className="breakdown-row">
              <span>Subtotal</span>
              <span>{formatMoney(liveBreakdown?.subtotal)}</span>
            </li>
            <li className="breakdown-row">
              <span>{liveBreakdown?.discount?.label || 'Discount'}</span>
              <span>-{formatMoney(liveBreakdown?.discount?.amount)}</span>
            </li>
            <li className="breakdown-row strong">
              <span>Total</span>
              <span>{formatMoney(liveBreakdown?.total)}</span>
            </li>
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
      const detail = err instanceof Error ? err.message : String(err)
      setError(detail || 'Failed to save your drink.')
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
            <p>{BASE_DRINKS[drink.options.base]?.label}</p>
            <p>
              {drink.options.size} · {drink.options.serviceType === 'take_home' ? 'Take home' : 'Dine in'}
            </p>
            <p className="strong">${Number(drink.price).toFixed(2)}</p>
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
      <p>Price: {formatMoney(drink.price)}</p>
      <p>⏱ {drink.prepTimeMinutes} min</p>
      <h3>Price Breakdown</h3>
      <ul className="breakdown-list">
        <li className="breakdown-row">
          <span>Base</span>
          <span>{formatMoney(drink.priceBreakdown.base.amount)}</span>
        </li>
        <li className="breakdown-row">
          <span>Flavor</span>
          <span>{formatMoney(drink.priceBreakdown.flavor.amount)}</span>
        </li>
        <li className="breakdown-row">
          <span>Size</span>
          <span>{formatMoney(drink.priceBreakdown.size.amount)}</span>
        </li>
        {renderToppingBreakdown(drink.priceBreakdown.toppings)}
        <li className="breakdown-row">
          <span>Subtotal</span>
          <span>{formatMoney(drink.priceBreakdown.subtotal)}</span>
        </li>
        <li className="breakdown-row">
          <span>{drink.priceBreakdown.discount.label}</span>
          <span>-{formatMoney(drink.priceBreakdown.discount.amount)}</span>
        </li>
        <li className="breakdown-row strong">
          <span>Total</span>
          <span>{formatMoney(drink.priceBreakdown.total)}</span>
        </li>
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
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    drinksApi.get(id).then(setDrink).catch((err) => setLoadError(err.message))
  }, [id])

  const onSave = async (payload) => {
    setSaveError('')
    setSaving(true)
    try {
      await drinksApi.update(id, payload)
      navigate(`/drinks/${id}`)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!drink) {
    if (loadError) return <p className="error">{loadError}</p>
    return <p>Loading...</p>
  }

  return (
    <section>
      <h1>Edit Drink</h1>
      <p className="subtitle">Adjust your previous choices and resave.</p>
      {saveError ? <p className="error">{saveError}</p> : null}
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
        <div className="brand">
          <span className="brand-mark">F&F</span>
          <div>
            <p className="brand-title">Frost & Foam</p>
            <p className="brand-sub">Craft your perfect sip</p>
          </div>
        </div>
        <div className="nav-links">
          <Link to="/">Customizer</Link>
          <Link to="/drinks">Saved Drinks</Link>
        </div>
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
