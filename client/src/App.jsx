import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { BASE_DRINKS, FLAVORS, RULES, TOPPINGS } from './config/catalog'
import { estimatePrepTime, calculatePriceBreakdown } from './utils/pricing'
import { drinksApi } from './services/drinksApi'
import './App.css'

const PREVIEW_PALETTES = {
  milkshake: { base: '#ffd8c2', glow: '#ffb78d', cup: '#fff1e8' },
  frappe: { base: '#cbb89e', glow: '#9f7f5f', cup: '#f5eadf' },
  iced_latte: { base: '#d7bf9f', glow: '#c29a6b', cup: '#f8efe1' },
  cream_soda: { base: '#b9e4d6', glow: '#74c7ad', cup: '#ecfbf5' },
  matcha: { base: '#bdd9aa', glow: '#86b56c', cup: '#eef8e5' },
}

const FLAVOR_SWATCHES = {
  vanilla: '#f8e7bf',
  caramel: '#d79a55',
  hazelnut: '#a8713f',
  mocha: '#7b4b30',
  strawberry: '#eb8ea6',
  matcha: '#98c26f',
}

const TOPPING_ICONS = {
  whipped_cream: '✦',
  boba: '●',
  jelly: '◆',
  chocolate_chips: '•',
  cinnamon: '≈',
}

const DRINK_PHOTOS = {
  milkshake:
    'https://www.foodandwine.com/thmb/aYv9IwIyM4EKLL0o7W1CUSfjXzU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Vanilla-Milkshake-FT-MAG-RECIPE-0325-4ad53abc27a74f7687e510cc17d28d1d.jpg',
  frappe: 'https://images.immediate.co.uk/production/volatile/sites/30/2025/07/GoodFoodFrappe-8757348.jpg',
  iced_latte: 'https://thegirlonbloor.com/wp-content/uploads/2025/05/Iced-latte-hero.jpg',
  cream_soda: 'https://japanesecooking101.com/wp-content/uploads/2017/07/DSC00088b.jpg',
  matcha: 'https://www.natalieshealth.com/wp-content/uploads/2022/05/Iced-Coconut-Matcha-Latte-featured-image.jpeg',
}

const TOPPING_PHOTOS = {
  whipped_cream:
    'https://www.seriouseats.com/thmb/Nkx7nmi5D6fKrHmYkLopUwqTXrs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/20221205-HowToWhipCream-AmandaSuarez-26-6600ee54f8dd466f9f2f5269d24afcb6.jpg',
  boba: 'https://tyberrymuch.com/wp-content/uploads/2023/07/homemade-tapioca-pearl-boba-recipe-1.jpg',
  jelly: 'https://cdn.mos.cms.futurecdn.net/5DBXDkPNSrZQu4Eauy72Tf.jpg',
  chocolate_chips: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Semi-sweet_chocolate_chips.jpg',
  cinnamon: 'https://media.cnn.com/api/v1/images/stellar/prod/170807181545-herbs-and-spices-cinnamon.jpg?q=w_2278,h_1282,x_0,y_0,c_fill',
}

const FLAVOR_PHOTOS = {
  vanilla: 'https://flavorsum.com/wp-content/uploads/2024/08/Vanilla-Blog-Header.jpg',
  caramel:
    'https://www.gmpopcorn.com/Portals/0/EasyDNNnews/1045/img-caramel-flavored-candies-with-caramel-syrup.jpg',
  hazelnut:
    'https://mississippimudcoffee.com/cdn/shop/articles/hazelnut_coffee_cornerstone.png?v=1760544167&width=1100',
  mocha: 'https://itaberco.com/wp-content/uploads/2024/05/Mocha-Flavor-Compounds-1-kg-Mkp-2024-scaled.jpg',
  strawberry: 'https://www.bickfordflavors.com/cdn/shop/articles/Strawberry_Ice_Cream_Bar_1024x1024.jpg?v=1648233825',
  matcha: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Matcha_Scoop.jpg',
}

const SIZE_PHOTOS = {
  regular: 'https://loremflickr.com/800/900/coffee-cup?lock=51',
  large: 'https://loremflickr.com/800/900/large-coffee-cup?lock=52',
}

const SERVICE_PHOTOS = {
  dine_in: 'https://loremflickr.com/800/900/cafe-table?lock=61',
  take_home: 'https://loremflickr.com/800/900/takeaway-coffee?lock=62',
}

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

function getPreviewVisual(options) {
  const base = PREVIEW_PALETTES[options.base] ?? PREVIEW_PALETTES.milkshake
  const flavor = FLAVOR_SWATCHES[options.flavor] ?? FLAVOR_SWATCHES.vanilla
  const selectedToppings = Array.isArray(options.toppings) ? options.toppings : []

  return {
    background: `radial-gradient(circle at top, ${base.glow} 0%, ${base.base} 42%, #f7eee5 100%)`,
    accent: flavor,
    cupColor: base.cup,
    photo: DRINK_PHOTOS[options.base] ?? DRINK_PHOTOS.milkshake,
    toppingDots: selectedToppings.slice(0, 4).map((topping, index) => ({
      id: topping,
      label: TOPPINGS[topping]?.label ?? topping,
      icon: TOPPING_ICONS[topping] ?? '•',
      photo: TOPPING_PHOTOS[topping] ?? TOPPING_PHOTOS.whipped_cream,
      offset: index * 12,
    })),
  }
}

function buildPreviewSequence(options) {
  const toppingIds = Array.isArray(options.toppings) ? options.toppings : []

  return [
    {
      key: 'base',
      step: '01',
      label: 'Base',
      title: BASE_DRINKS[options.base]?.label ?? 'Base drink',
      note: 'Core drink style',
      image: DRINK_PHOTOS[options.base] ?? DRINK_PHOTOS.milkshake,
    },
    {
      key: 'flavor',
      step: '02',
      label: 'Flavor',
      title: FLAVORS[options.flavor]?.label ?? 'Flavor',
      note: 'Main flavor profile',
      image: FLAVOR_PHOTOS[options.flavor] ?? FLAVOR_PHOTOS.vanilla,
    },
    {
      key: 'size',
      step: '03',
      label: 'Size',
      title: options.size === 'large' ? 'Large' : 'Regular',
      note: options.size === 'large' ? 'More to enjoy' : 'Standard serving',
      image: SIZE_PHOTOS[options.size] ?? SIZE_PHOTOS.regular,
    },
    {
      key: 'toppings',
      step: '04',
      label: 'Toppings',
      title: toppingIds.length ? `${toppingIds.length} selected` : 'None selected',
      note: 'Add-ons layered on top',
      items: toppingIds.length
        ? toppingIds.map((topping) => ({
            id: topping,
            title: TOPPINGS[topping]?.label ?? topping,
            image: TOPPING_PHOTOS[topping] ?? TOPPING_PHOTOS.whipped_cream,
          }))
        : [
            {
              id: 'none',
              title: 'No toppings',
              image: TOPPING_PHOTOS.whipped_cream,
            },
          ],
    },
    {
      key: 'service',
      step: '05',
      label: 'Service',
      title: options.serviceType === 'take_home' ? 'Take home' : 'Dine in',
      note: options.serviceType === 'take_home' ? 'Packed to go' : 'Enjoy in cafe',
      image: SERVICE_PHOTOS[options.serviceType] ?? SERVICE_PHOTOS.dine_in,
    },
  ]
}

function DrinkVisual({ options, compact = false, label }) {
  const previewVisual = getPreviewVisual(options)
  const selectedToppings = Array.isArray(options.toppings) ? options.toppings : []

  return (
    <div className={`drink-visual${compact ? ' compact' : ''}`} style={{ '--preview-accent': previewVisual.accent, '--preview-cup': previewVisual.cupColor, '--preview-bg': previewVisual.background }}>
      <div className="drink-visual-stage">
        <img className="drink-photo" src={previewVisual.photo} alt={`${BASE_DRINKS[options.base]?.label} drink photo`} />
        <div className="drink-photo-overlay" />
        <div className="preview-glow" />
        <div className="preview-orb preview-orb-one" />
        <div className="preview-orb preview-orb-two" />

        <div className="preview-cup">
          {label ? <span className="preview-drink-tag">{label}</span> : null}
        </div>

        <div className="preview-toppings">
          {compact ? null : (
            previewVisual.toppingDots.length ? (
              previewVisual.toppingDots.map((topping) => (
                <img
                  className="preview-topping-badge"
                  key={topping.id}
                  src={topping.photo}
                  alt={topping.label}
                  style={{ transform: `translateY(${topping.offset}px)` }}
                />
              ))
            ) : (
              <span className="preview-empty-state">Add toppings to decorate the cup.</span>
            )
          )}
        </div>
      </div>
      {compact ? (
        <div className="drink-visual-caption">
          <strong>{BASE_DRINKS[options.base]?.label}</strong>
          <span>{selectedToppings.length ? `${selectedToppings.length} toppings` : 'No toppings'}</span>
        </div>
      ) : null}
    </div>
  )
}

function ImageChoiceGrid({ title, description, items, selectedValues, onToggle, multiple = false }) {
  const selectedSet = new Set(Array.isArray(selectedValues) ? selectedValues : [selectedValues])

  return (
    <section className="choice-section">
      <div className="choice-header">
        <div>
          <p className="choice-title">{title}</p>
          <p className="choice-description">{description}</p>
        </div>
      </div>
      <div className={`choice-grid${multiple ? ' multi' : ''}`}>
        {items.map((item) => {
          const selected = selectedSet.has(item.value)
          return (
            <button
              key={item.value}
              type="button"
              className={`choice-card${selected ? ' selected' : ''}`}
              onClick={() => onToggle(item.value)}
              aria-pressed={selected}
            >
              <img src={item.image} alt={item.label} />
              <span className="choice-overlay" />
              <span className="choice-copy">
                <span className="choice-label">{item.label}</span>
                {item.note ? <span className="choice-note">{item.note}</span> : null}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function PreviewSummary({ options, liveBreakdown, prepTime, selectedToppings, showBreakdown, onToggleBreakdown }) {
  const previewVisual = getPreviewVisual(options)

  return (
    <div className="preview summary-only" style={{ '--preview-accent': previewVisual.accent, '--preview-bg': previewVisual.background }}>
      <div className="preview-header">
        <div>
          <h3>Live Preview</h3>
          <p className="preview-kicker">Text-only summary of your current order.</p>
        </div>
        <button type="button" className="secondary preview-toggle" onClick={onToggleBreakdown}>
          {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
        </button>
      </div>

      <div className="summary-box">
        <div>
          <span className="summary-label">Base Drink</span>
          <strong>{BASE_DRINKS[options.base]?.label}</strong>
        </div>
        <div>
          <span className="summary-label">Flavor</span>
          <strong>{FLAVORS[options.flavor]?.label}</strong>
        </div>
        <div>
          <span className="summary-label">Size</span>
          <strong>{options.size === 'large' ? 'Large' : 'Regular'}</strong>
        </div>
        <div>
          <span className="summary-label">Service</span>
          <strong>{options.serviceType === 'take_home' ? 'Take home' : 'Dine in'}</strong>
        </div>
        <div className="summary-wide">
          <span className="summary-label">Toppings</span>
          <strong>{selectedToppings.length ? selectedToppings.join(' · ') : 'None'}</strong>
        </div>
        <div>
          <span className="summary-label">Total</span>
          <strong>{liveBreakdown ? formatMoney(liveBreakdown.total) : '$0.00'}</strong>
        </div>
        <div>
          <span className="summary-label">Prep time</span>
          <strong>{prepTime} min</strong>
        </div>
      </div>
    </div>
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
  const previewVisual = useMemo(() => getPreviewVisual(options), [options])
  const selectedToppings = options.toppings.map((topping) => TOPPINGS[topping]?.label ?? topping)

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
    <div className="drink-builder">
      <form className="panel order-panel" onSubmit={handleSubmit}>
        <label>
          <span className="field-heading">Custom drink name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Frost Favorite" />
        </label>

        <ImageChoiceGrid
          title="Base Drink"
          description="Pick the main drink with a representative photo."
          selectedValues={options.base}
          onToggle={(value) => setOptions((prev) => ({ ...prev, base: value }))}
          items={Object.entries(BASE_DRINKS).map(([value, item]) => ({
            value,
            label: item.label,
            note: `$${item.price.toFixed(2)}`,
            image: DRINK_PHOTOS[value] ?? DRINK_PHOTOS.milkshake,
          }))}
        />

        <ImageChoiceGrid
          title="Flavor"
          description="Choose the flavor layer shown on top of the drink."
          selectedValues={options.flavor}
          onToggle={(value) => setOptions((prev) => ({ ...prev, flavor: value }))}
          items={Object.entries(FLAVORS).map(([value, item]) => ({
            value,
            label: item.label,
            note: `$${item.price.toFixed(2)}`,
            image: FLAVOR_PHOTOS[value] ?? FLAVOR_PHOTOS.vanilla,
          }))}
        />

        <div>
          <p className="field-heading">Size</p>
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
          <ImageChoiceGrid
            title="Toppings"
            description="Tap toppings to add or remove them."
            multiple
            selectedValues={options.toppings}
            onToggle={toggleTopping}
            items={Object.entries(TOPPINGS).map(([value, item]) => ({
              value,
              label: item.label,
              note: `$${item.price.toFixed(2)}`,
              image: TOPPING_PHOTOS[value] ?? TOPPING_PHOTOS.whipped_cream,
            }))}
          />
        </div>

        <div className="service-section">
          <p className="field-heading">Service</p>
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

          <button type="submit" className="save-drink-button" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save drink'}
          </button>
        </div>

        {formError ? <p className="error">{formError}</p> : null}
      </form>

      <div className="panel preview-panel">
        <PreviewSummary
          options={options}
          liveBreakdown={liveBreakdown}
          prepTime={prepTime}
          selectedToppings={selectedToppings}
          showBreakdown={showBreakdown}
          onToggleBreakdown={() => setShowBreakdown((v) => !v)}
        />

        {showBreakdown ? (
          <ul className="breakdown-list preview-breakdown">
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
    </div>
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
      <h1>Make your own cup</h1>
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
          <article className="card saved-drink-card" key={drink.id}>
            <div className="saved-drink-image-wrap">
              <img
                className="saved-drink-image"
                src={DRINK_PHOTOS[drink.options.base] ?? DRINK_PHOTOS.milkshake}
                alt={BASE_DRINKS[drink.options.base]?.label}
              />
            </div>
            <div className="saved-drink-content">
              <div className="saved-drink-header">
                <h3>{drink.name}</h3>
                <p className="strong saved-drink-price">${Number(drink.price).toFixed(2)}</p>
              </div>
              <p className="saved-drink-meta">{BASE_DRINKS[drink.options.base]?.label}</p>
              <p className="saved-drink-meta">
                {drink.options.size === 'large' ? 'Large' : 'Regular'} · {drink.options.serviceType === 'take_home' ? 'Take home' : 'Dine in'} · ⏱ {drink.prepTimeMinutes} min
              </p>
              <Link className="saved-drink-link" to={`/drinks/${drink.id}`}>
                View details
              </Link>
            </div>
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
      <DrinkVisual options={drink.options} label={FLAVORS[drink.options.flavor]?.label} />
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
        <h1 className="site-title">FROST & FOAM</h1>
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
