import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Trips.css'

function Trips() {
  const navigate = useNavigate()

  const today = new Date().toISOString().split('T')[0]

  const [step, setStep] = useState(1)

  const [tripType, setTripType] = useState('round')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

  const [originAirport, setOriginAirport] = useState(null)
  const [destinationAirport, setDestinationAirport] = useState(null)

  const [originSuggestions, setOriginSuggestions] = useState([])
  const [destinationSuggestions, setDestinationSuggestions] = useState([])

  const [loadingOriginAirports, setLoadingOriginAirports] = useState(false)
  const [loadingDestinationAirports, setLoadingDestinationAirports] =
    useState(false)

  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [budget, setBudget] = useState('')

  const [selectedFlight, setSelectedFlight] = useState(null)
  const [flights, setFlights] = useState([])
  const [loadingFlights, setLoadingFlights] = useState(false)
  const [flightError, setFlightError] = useState('')

  const [bookingLinks, setBookingLinks] = useState([])
  const [loadingBookingLinks, setLoadingBookingLinks] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const formatDate = (date) => {
    if (!date) return ''

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  /*
   * ---------------------------------------------------------
   * AIRPORT SEARCH
   * ---------------------------------------------------------
   */

  const searchAirports = async (query, type) => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      if (type === 'origin') {
        setOriginSuggestions([])
      } else {
        setDestinationSuggestions([])
      }

      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      console.error('No login token found')
      return
    }

    try {
      if (type === 'origin') {
        setLoadingOriginAirports(true)
      } else {
        setLoadingDestinationAirports(true)
      }

      const response = await fetch(
        `https://lifeos-v22r.onrender.com/trips/airports?query=${encodeURIComponent(
          trimmedQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Airport search failed: ${response.status}`
        )
      }

      const data = await response.json()

      /*
       * Ignav returns an airport list.
       * This also safely handles an object containing
       * an airports array.
       */
      const airports = Array.isArray(data)
        ? data
        : Array.isArray(data.airports)
          ? data.airports
          : []

      if (type === 'origin') {
        setOriginSuggestions(airports)
      } else {
        setDestinationSuggestions(airports)
      }

    } catch (error) {
      console.error('Airport search error:', error)

      if (type === 'origin') {
        setOriginSuggestions([])
      } else {
        setDestinationSuggestions([])
      }

    } finally {
      if (type === 'origin') {
        setLoadingOriginAirports(false)
      } else {
        setLoadingDestinationAirports(false)
      }
    }
  }

  /*
   * Debounce airport search so we don't send a request
   * on every single keystroke.
   */
  useEffect(() => {
    if (originAirport) {
      setOriginSuggestions([])
      return
    }

    if (origin.length < 2) {
      setOriginSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      searchAirports(origin, 'origin')
    }, 350)

    return () => clearTimeout(timer)
  }, [origin, originAirport])

  useEffect(() => {
    if (destinationAirport) {
      setDestinationSuggestions([])
      return
    }

    if (destination.length < 2) {
      setDestinationSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      searchAirports(destination, 'destination')
    }, 350)

    return () => clearTimeout(timer)
  }, [destination, destinationAirport])

  /*
   * ---------------------------------------------------------
   * AIRPORT SELECTION
   * ---------------------------------------------------------
   */

  const handleSwapLocations = () => {
    setOrigin(destination)
    setDestination(origin)

    setOriginAirport(destinationAirport)
    setDestinationAirport(originAirport)

    setOriginSuggestions([])
    setDestinationSuggestions([])
  }

  const selectOriginAirport = (airport) => {
    setOriginAirport(airport)

    const displayName =
      airport.name ||
      airport.city ||
      airport.airport_name ||
      airport.iata_code ||
      airport.iataCode ||
      ''

    setOrigin(displayName)
    setOriginSuggestions([])
  }

  const selectDestinationAirport = (airport) => {
    setDestinationAirport(airport)

    const displayName =
      airport.name ||
      airport.city ||
      airport.airport_name ||
      airport.iata_code ||
      airport.iataCode ||
      ''

    setDestination(displayName)
    setDestinationSuggestions([])
  }

  /*
   * ---------------------------------------------------------
   * AIRPORT DISPLAY HELPERS
   * ---------------------------------------------------------
   */

  const getAirportCode = (airport) => {
    if (!airport) return ''

    return (
      airport.iata_code ||
      airport.iataCode ||
      airport.code ||
      airport.iata ||
      ''
    )
  }

  const getAirportName = (airport) => {
    if (!airport) return ''

    return (
      airport.name ||
      airport.airport_name ||
      airport.airportName ||
      airport.city ||
      ''
    )
  }

  const getAirportCity = (airport) => {
    if (!airport) return ''

    return (
      airport.city ||
      airport.city_name ||
      airport.cityName ||
      ''
    )
  }

  const getAirportCountry = (airport) => {
    if (!airport) return ''

    return (
      airport.country ||
      airport.country_name ||
      airport.countryName ||
      ''
    )
  }

  const formatTime = (value) => {
    if (!value) return '--'

    // Ignav returns local airport time as YYYY-MM-DDTHH:MM:SS.
    // Read the clock time directly so the browser does not shift it
    // into the user's own timezone.
    if (typeof value === 'string') {
      const match = value.match(/T(\d{2}):(\d{2})/)

      if (match) {
        let hour = Number(match[1])
        const minute = match[2]
        const suffix = hour >= 12 ? 'PM' : 'AM'

        hour = hour % 12 || 12

        return `${String(hour).padStart(2, '0')}:${minute} ${suffix}`
      }
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '--'

    const hours = Math.floor(Number(minutes) / 60)
    const mins = Number(minutes) % 60

    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const getCarrierName = (carrier) => {
    if (!carrier) return 'Airline'
    if (typeof carrier === 'string') return carrier
    return carrier.name || carrier.airline_name || carrier.iata || 'Airline'
  }

  const getSegmentAirportCode = (airport) => {
    if (!airport) return ''
    if (typeof airport === 'string') return airport
    return airport.iata_code || airport.iataCode || airport.code || airport.iata || ''
  }

  const getStopsLabel = (itinerary) => {
    const segments = itinerary?.outbound?.segments || []
    const stops = Math.max(0, segments.length - 1)

    if (stops === 0) return 'Non-stop'
    if (stops === 1) return '1 stop'
    return `${stops} stops`
  }

  const fetchFlights = async () => {
    const token = localStorage.getItem('token')
    const originCode = getAirportCode(originAirport)
    const destinationCode = getAirportCode(destinationAirport)

    if (!token || !originCode || !destinationCode || !departureDate) {
      return
    }

    setLoadingFlights(true)
    setFlightError('')
    setFlights([])
    setSelectedFlight(null)
    setBookingLinks([])
    setBookingError('')

    try {
      const response = await fetch(
        'https://lifeos-v22r.onrender.com/trips/flights/search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            origin: originCode,
            destination: destinationCode,
            departureDate,
            returnDate: tripType === 'round' ? returnDate : '',
            travelers,
          }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          `Flight search failed: ${response.status}`
        )
      }

      const results = Array.isArray(data?.itineraries)
        ? data.itineraries
        : []

      setFlights(results)

      if (results.length === 0) {
        setFlightError(
          'No live flight offers were returned for this route and date.'
        )
      }
    } catch (error) {
      console.error('Flight search error:', error)
      setFlightError(
        error.message || 'Could not load live flight offers.'
      )
    } finally {
      setLoadingFlights(false)
    }
  }

  const fetchBookingLinks = async () => {
    const token = localStorage.getItem('token')
    const ignavId = selectedFlight?.ignav_id

    if (!token || !ignavId) {
      setBookingError('This flight does not have a valid booking reference.')
      return
    }

    setLoadingBookingLinks(true)
    setBookingError('')
    setBookingLinks([])

    try {
      const response = await fetch(
        'https://lifeos-v22r.onrender.com/trips/flights/booking-links',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ignavId,
          }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          `Booking links request failed: ${response.status}`
        )
      }

      const options = Array.isArray(data?.booking_options)
        ? data.booking_options
        : []

      const links = options.flatMap((option) => {
        const optionLinks = Array.isArray(option?.links)
          ? option.links
          : []

        return optionLinks.map((link) => ({
          ...link,
          providerName:
            option?.provider_name ||
            option?.provider ||
            option?.name ||
            'Booking provider',
          providerType: option?.provider_type || '',
          fareName: option?.fare_name || '',
          price: option?.price || null,
          currency: option?.currency || 'INR',
        }))
      })

      setBookingLinks(links)

      if (links.length === 0) {
        setBookingError(
          'No booking links were returned for this flight right now.'
        )
      }
    } catch (error) {
      console.error('Booking links error:', error)
      setBookingError(
        error.message || 'Could not load booking options.'
      )
    } finally {
      setLoadingBookingLinks(false)
    }
  }

  useEffect(() => {
    if (step !== 2) return
    fetchFlights()
  }, [step])

  /*
   * ---------------------------------------------------------
   * DATE HANDLERS
   * ---------------------------------------------------------
   */

  const handleDepartureChange = (e) => {
    const selectedDate = e.target.value

    setDepartureDate(selectedDate)

    if (returnDate && returnDate < selectedDate) {
      setReturnDate('')
    }
  }

  /*
   * ---------------------------------------------------------
   * TRIP TYPE
   * ---------------------------------------------------------
   */

  const handleTripTypeChange = (type) => {
    setTripType(type)

    if (type === 'oneway') {
      setReturnDate('')
    }
  }

  /*
   * ---------------------------------------------------------
   * PLAN TRIP
   * ---------------------------------------------------------
   */

  const handlePlanTrip = (e) => {
    e.preventDefault()

    if (!origin.trim()) {
      alert('Please enter your departure airport.')
      return
    }

    if (!originAirport) {
      alert('Please select your departure airport from the suggestions.')
      return
    }

    if (!destination.trim()) {
      alert('Please enter your destination airport.')
      return
    }

    if (!destinationAirport) {
      alert('Please select your destination airport from the suggestions.')
      return
    }

    const originCode = getAirportCode(originAirport)
    const destinationCode = getAirportCode(destinationAirport)

    if (!originCode) {
      alert('Selected departure airport does not have a valid IATA code.')
      return
    }

    if (!destinationCode) {
      alert('Selected destination airport does not have a valid IATA code.')
      return
    }

    if (originCode === destinationCode) {
      alert('Departure and destination cannot be the same.')
      return
    }

    if (!departureDate) {
      alert('Please select your departure date.')
      return
    }

    if (departureDate < today) {
      alert('You cannot plan a trip for a past date.')
      return
    }

    if (tripType === 'round') {
      if (!returnDate) {
        alert('Please select your return date.')
        return
      }

      if (returnDate < departureDate) {
        alert(
          'Return date cannot be before the departure date.'
        )
        return
      }
    }

    if (travelers < 1) {
      alert('There must be at least 1 traveler.')
      return
    }

    if (travelers > 9) {
      alert('Maximum 9 travelers are allowed.')
      return
    }

    if (budget && Number(budget) < 0) {
      alert('Budget cannot be negative.')
      return
    }

    setSelectedFlight(null)
    setStep(2)
  }

  /*
   * ---------------------------------------------------------
   * BACK
   * ---------------------------------------------------------
   */

  const handleBackToSetup = () => {
    setStep(1)
    setSelectedFlight(null)
  }

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="trips-page">

      <div className="trips-background-orb trips-orb-one"></div>
      <div className="trips-background-orb trips-orb-two"></div>

      <main className="trips-container">

        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <>
            <div className="travel-page-back">
              <button
                type="button"
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
            </div>

            <section className="trips-hero">

              <div className="trips-badge">
                ✨ LIFEOS TRAVEL PLANNER
              </div>

              <h1>
                Plan your
                <span> unforgettable trip.</span>
              </h1>

              <p>
                Tell LIFEOS where you want to go, and we'll help
                you plan flights, hotels, places, itinerary and
                budget — all in one place.
              </p>

            </section>


            <section className="trip-planner-card">

              <div className="planner-header">

                <div>

                  <span className="planner-step">
                    STEP 1 OF 6
                  </span>

                  <h2>Where are you going?</h2>

                  <p>
                    Start with the basics of your journey.
                  </p>

                </div>

                <div className="planner-icon">
                  ✈️
                </div>

              </div>


              <form onSubmit={handlePlanTrip}>

                {/* ==========================================
                    FROM / TO
                ========================================== */}

                <div className="route-grid route-grid-with-swap">

                  {/* FROM */}

                  <div className="form-group">

                    <label>From</label>

                    <div className="input-with-icon">

                      <span>🛫</span>

                      <input
                        type="text"
                        placeholder="e.g. Chennai"
                        value={origin}
                        onChange={(e) => {
                          setOrigin(e.target.value)
                          setOriginAirport(null)
                        }}
                        autoComplete="off"
                      />

                    </div>

                    {origin.length >= 2 &&
                      (loadingOriginAirports ||
                        originSuggestions.length > 0) && (

                        <div className="airport-suggestions">

                          {loadingOriginAirports && (
                            <div className="airport-loading">
                              Searching airports...
                            </div>
                          )}

                          {!loadingOriginAirports &&
                            originSuggestions.map(
                              (airport, index) => {

                                const code =
                                  getAirportCode(airport)

                                const name =
                                  getAirportName(airport)

                                const city =
                                  getAirportCity(airport)

                                const country =
                                  getAirportCountry(airport)

                                return (
                                  <button
                                    type="button"
                                    className="airport-suggestion"
                                    key={`${code}-${name}-${index}`}
                                    onClick={() =>
                                      selectOriginAirport(
                                        airport
                                      )
                                    }
                                  >

                                    <div className="airport-suggestion-icon">
                                      ✈️
                                    </div>

                                    <div className="airport-suggestion-info">

                                      <strong>
                                        {name || city || code}
                                      </strong>

                                      <span>
                                        {[
                                          city,
                                          country,
                                        ]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </span>

                                    </div>

                                    {code && (
                                      <span className="airport-code">
                                        {code}
                                      </span>
                                    )}

                                  </button>
                                )
                              }
                            )}

                        </div>
                      )}

                  </div>

                  <button
                    type="button"
                    className="swap-route-button"
                    onClick={handleSwapLocations}
                    aria-label="Swap From and To"
                    title="Swap From and To"
                  >
                    ⇄
                  </button>


                  {/* TO */}

                  <div className="form-group">

                    <label>To</label>

                    <div className="input-with-icon">

                      <span>📍</span>

                      <input
                        type="text"
                        placeholder="e.g. Varanasi"
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value)
                          setDestinationAirport(null)
                        }}
                        autoComplete="off"
                      />

                    </div>

                    {destination.length >= 2 &&
                      (loadingDestinationAirports ||
                        destinationSuggestions.length > 0) && (

                        <div className="airport-suggestions">

                          {loadingDestinationAirports && (
                            <div className="airport-loading">
                              Searching airports...
                            </div>
                          )}

                          {!loadingDestinationAirports &&
                            destinationSuggestions.map(
                              (airport, index) => {

                                const code =
                                  getAirportCode(airport)

                                const name =
                                  getAirportName(airport)

                                const city =
                                  getAirportCity(airport)

                                const country =
                                  getAirportCountry(airport)

                                return (
                                  <button
                                    type="button"
                                    className="airport-suggestion"
                                    key={`${code}-${name}-${index}`}
                                    onClick={() =>
                                      selectDestinationAirport(
                                        airport
                                      )
                                    }
                                  >

                                    <div className="airport-suggestion-icon">
                                      ✈️
                                    </div>

                                    <div className="airport-suggestion-info">

                                      <strong>
                                        {name || city || code}
                                      </strong>

                                      <span>
                                        {[
                                          city,
                                          country,
                                        ]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </span>

                                    </div>

                                    {code && (
                                      <span className="airport-code">
                                        {code}
                                      </span>
                                    )}

                                  </button>
                                )
                              }
                            )}

                        </div>
                      )}

                  </div>

                </div>


                {/* ==========================================
                    TRIP TYPE
                ========================================== */}

                <div className="form-group">

                  <label>Trip type</label>

                  <div className="trip-type-selector">

                    <button
                      type="button"
                      className={
                        tripType === 'round'
                          ? 'trip-type active'
                          : 'trip-type'
                      }
                      onClick={() =>
                        handleTripTypeChange('round')
                      }
                    >

                      <span>⇄</span>

                      <div>
                        <strong>Round Trip</strong>

                        <small>
                          Return to your starting point
                        </small>
                      </div>

                    </button>


                    <button
                      type="button"
                      className={
                        tripType === 'oneway'
                          ? 'trip-type active'
                          : 'trip-type'
                      }
                      onClick={() =>
                        handleTripTypeChange('oneway')
                      }
                    >

                      <span>→</span>

                      <div>
                        <strong>One Way</strong>

                        <small>
                          Travel to your destination
                        </small>
                      </div>

                    </button>

                  </div>

                </div>


                {/* ==========================================
                    DATES
                ========================================== */}

                <div className="date-grid">

                  <div className="form-group">

                    <label>Departure</label>

                    <div className="input-with-icon">

                      <span>📅</span>

                      <input
                        type="date"
                        min={today}
                        value={departureDate}
                        onChange={handleDepartureChange}
                      />

                    </div>

                  </div>


                  {tripType === 'round' && (

                    <div className="form-group">

                      <label>Return</label>

                      <div className="input-with-icon">

                        <span>📅</span>

                        <input
                          type="date"
                          min={departureDate || today}
                          value={returnDate}
                          onChange={(e) =>
                            setReturnDate(e.target.value)
                          }
                        />

                      </div>

                    </div>

                  )}

                </div>


                {/* ==========================================
                    TRAVELERS / BUDGET
                ========================================== */}

                <div className="planner-options">

                  <div className="form-group">

                    <label>Travelers</label>

                    <div className="traveler-control">

                      <button
                        type="button"
                        onClick={() =>
                          setTravelers((current) =>
                            Math.max(1, current - 1)
                          )
                        }
                      >
                        −
                      </button>

                      <div>

                        <strong>{travelers}</strong>

                        <span>
                          {travelers === 1
                            ? 'Traveler'
                            : 'Travelers'}
                        </span>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setTravelers((current) =>
                            Math.min(9, current + 1)
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                  </div>


                  <div className="form-group">

                    <label>Total Trip Budget</label>

                    <div className="input-with-icon">

                      <span>₹</span>

                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 20000"
                        value={budget}
                        onChange={(e) =>
                          setBudget(e.target.value)
                        }
                      />

                    </div>

                  </div>

                </div>


                <button
                  type="submit"
                  className="plan-trip-button"
                >
                  <span>Plan My Trip</span>
                  <span>→</span>
                </button>

              </form>

            </section>


            <section className="trip-features">

              <div className="feature-card">

                <span>✈️</span>

                <div>
                  <strong>Smart Flights</strong>

                  <p>
                    Compare real flight offers.
                  </p>
                </div>

              </div>


              <div className="feature-card">

                <span>🏨</span>

                <div>
                  <strong>Smart Hotels</strong>

                  <p>
                    Find stays within your budget.
                  </p>
                </div>

              </div>


              <div className="feature-card">

                <span>📍</span>

                <div>
                  <strong>Places</strong>

                  <p>
                    Discover places worth visiting.
                  </p>
                </div>

              </div>


              <div className="feature-card">

                <span>🗓️</span>

                <div>
                  <strong>AI Itinerary</strong>

                  <p>
                    Build your day-by-day plan.
                  </p>
                </div>

              </div>

            </section>

          </>
        )}


        {/* =================================================
            STEP 2 — FLIGHTS
        ================================================= */}

        {step === 2 && (

          <section className="flight-page">

            <div className="flight-topbar">

              <button
                type="button"
                className="back-button"
                onClick={handleBackToSetup}
              >
                ← Back
              </button>

              <div className="trips-badge">
                ✨ STEP 2 OF 6
              </div>

            </div>


            <section className="flight-hero">

              <h1>
                Choose your
                <span> flight.</span>
              </h1>

              <p>
                We'll compare available flight offers for your
                journey and help you find an option that fits
                your budget.
              </p>

            </section>


            <section className="flight-route-card">

              <div className="route-point">

                <small>FROM</small>

                <strong>
                  {getAirportCode(originAirport)
                    ? `${origin} (${getAirportCode(originAirport)})`
                    : origin}
                </strong>

                <span>
                  {formatDate(departureDate)}
                </span>

              </div>


              <div className="route-arrow">
                {tripType === 'round' ? '⇄' : '→'}
              </div>


              <div className="route-point">

                <small>TO</small>

                <strong>
                  {getAirportCode(destinationAirport)
                    ? `${destination} (${getAirportCode(destinationAirport)})`
                    : destination}
                </strong>

                <span>
                  {tripType === 'round'
                    ? formatDate(returnDate)
                    : 'One way'}
                </span>

              </div>


              <div className="route-divider"></div>


              <div className="route-meta">

                <div>
                  <small>TRAVELERS</small>
                  <strong>{travelers}</strong>
                </div>

                {budget && (

                  <div>
                    <small>BUDGET</small>

                    <strong>
                      ₹
                      {Number(budget).toLocaleString(
                        'en-IN'
                      )}
                    </strong>
                  </div>

                )}

              </div>

            </section>


            <section className="flight-search-card">

              <div className="flight-search-header">

                <div>

                  <span className="planner-step">
                    LIVE FLIGHT SEARCH
                  </span>

                  <h2>
                    Available flights
                  </h2>

                  <p>
                    Current prices will be retrieved from
                    the connected travel provider.
                  </p>

                </div>


                <div className="live-status">
                  <span></span>
                  Live pricing
                </div>

              </div>


              <div className="flight-api-notice">

                <div className="notice-icon">
                  ✈️
                </div>

                <div>

                  <strong>
                    Real prices — no fake data
                  </strong>

                  <p>
                    LIFEOS will only display flight prices
                    returned by the connected travel provider.
                    No artificial prices are shown.
                  </p>

                </div>

              </div>


              {loadingFlights ? (

                <div className="flight-empty-state">

                  <div className="empty-flight-icon flight-loading-icon">
                    ✈️
                  </div>

                  <h3>
                    Searching live flights...
                  </h3>

                  <p>
                    LIFEOS is checking current flight offers for your route.
                    Please wait a moment.
                  </p>

                </div>

              ) : flightError ? (

                <div className="flight-empty-state flight-error-state">

                  <div className="empty-flight-icon">
                    ⚠️
                  </div>

                  <h3>
                    No flight offers available
                  </h3>

                  <p>
                    {flightError}
                  </p>

                  <button
                    type="button"
                    className="retry-flight-button"
                    onClick={fetchFlights}
                  >
                    Search again
                  </button>

                </div>

              ) : flights.length > 0 ? (

                <div className="flight-results">

                  <div className="flight-results-summary">
                    <strong>{flights.length} live offer{flights.length === 1 ? '' : 's'}</strong>
                    <span>Prices returned by Ignav</span>
                  </div>

                  {flights.map((flight, index) => {
                    const outbound = flight?.outbound || {}
                    const segments = outbound?.segments || []
                    const firstSegment = segments[0] || {}
                    const lastSegment = segments[segments.length - 1] || firstSegment
                    const price = flight?.price?.amount
                    const currency = flight?.price?.currency || 'INR'
                    const isSelected = selectedFlight === flight

                    return (
                      <button
                        type="button"
                        className={`flight-card ${isSelected ? 'selected' : ''}`}
                        key={flight?.ignav_id || index}
                        onClick={() => {
                          setSelectedFlight(flight)
                          setBookingLinks([])
                          setBookingError('')
                        }}
                      >

                        <div className="flight-card-main">

                          <div className="flight-airline">
                            <div className="airline-logo">
                              ✈️
                            </div>
                            <div>
                              <strong>{getCarrierName(outbound.carrier)}</strong>
                              <span>{flight?.cabin_class || 'Economy'}</span>
                            </div>
                          </div>

                          <div className="flight-timing">
                            <div>
                              <strong>
                                {formatTime(
                                  firstSegment?.departure_time_local ||
                                  firstSegment?.departure?.time ||
                                  firstSegment?.departure_time
                                )}
                              </strong>
                              <span>
                                {getSegmentAirportCode(
                                  firstSegment?.departure_airport ||
                                  firstSegment?.departure?.airport ||
                                  firstSegment?.departure?.location ||
                                  firstSegment?.origin ||
                                  originAirport
                                )}
                              </span>
                            </div>

                            <div className="flight-line">
                              <span>{formatDuration(outbound.duration_minutes)}</span>
                              <i></i>
                              <small>{getStopsLabel(flight)}</small>
                            </div>

                            <div>
                              <strong>
                                {formatTime(
                                  lastSegment?.arrival_time_local ||
                                  lastSegment?.arrival?.time ||
                                  lastSegment?.arrival_time
                                )}
                              </strong>
                              <span>
                                {getSegmentAirportCode(
                                  lastSegment?.arrival_airport ||
                                  lastSegment?.arrival?.airport ||
                                  lastSegment?.arrival?.location ||
                                  lastSegment?.destination ||
                                  destinationAirport
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flight-price">
                            <strong>
                              {price !== undefined && price !== null
                                ? new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency,
                                    maximumFractionDigits: 0,
                                  }).format(Number(price))
                                : 'Price unavailable'}
                            </strong>
                            <span>total fare</span>
                          </div>

                        </div>

                        {flight?.requires_self_transfer && (
                          <div className="self-transfer-warning">
                            ⚠️ Self-transfer required
                          </div>
                        )}

                        {isSelected && (
                          <div className="flight-selected-label">
                            ✓ Flight selected
                          </div>
                        )}

                      </button>
                    )
                  })}

                </div>

              ) : (

                <div className="flight-empty-state">
                  <div className="empty-flight-icon">✈️</div>
                  <h3>Ready for live flight search</h3>
                  <p>
                    Your trip details are ready. LIFEOS will fetch current flight
                    offers from the connected travel provider.
                  </p>
                </div>

              )}


              {selectedFlight && (
                <div className="booking-options-panel">
                  <div className="booking-options-header">
                    <div>
                      <span className="planner-step">
                        BOOKING OPTIONS
                      </span>
                      <h3>Ready to book?</h3>
                      <p>
                        Get real booking links for your selected flight.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="booking-options-button"
                      onClick={fetchBookingLinks}
                      disabled={loadingBookingLinks}
                    >
                      {loadingBookingLinks
                        ? 'Finding booking options...'
                        : bookingLinks.length > 0
                          ? 'Refresh booking options'
                          : 'View booking options'}
                    </button>
                  </div>

                  {bookingError && (
                    <div className="booking-error">
                      ⚠️ {bookingError}
                    </div>
                  )}

                  {bookingLinks.length > 0 && (
                    <div className="booking-links-list">
                      {bookingLinks.map((link, index) => (
                        <div
                          className="booking-link-card"
                          key={`${link?.url || 'booking'}-${index}`}
                        >
                          <div className="booking-provider">
                            <div className="booking-provider-icon">
                              🔗
                            </div>
                            <div>
                              <strong>
                                {link.providerName}
                              </strong>
                              {link.fareName && (
                                <span>{link.fareName}</span>
                              )}
                              {link.providerType && (
                                <small>{link.providerType}</small>
                              )}
                            </div>
                          </div>

                          <a
                            className="booking-link-button"
                            href={link?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Book on provider →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flight-footer">

                <div>

                  <strong>
                    Next: Hotel search
                  </strong>

                  <p>
                    After selecting a flight, LIFEOS will
                    search for suitable hotels based on your
                    dates, location, rating and budget.
                  </p>

                </div>

                <button
                  type="button"
                  className="continue-button"
                  disabled={!selectedFlight}
                  onClick={() => setStep(3)}
                >
                  {selectedFlight ? 'Continue to Hotels →' : 'Select a flight first →'}
                </button>

              </div>

            </section>

          </section>

        )}


        {/* =================================================
            STEP 3 — HOTELS
        ================================================= */}

        {step === 3 && (

          <section className="hotel-page">

            <div className="flight-topbar">

              <button
                type="button"
                className="back-button"
                onClick={() => setStep(2)}
              >
                ← Back to Flights
              </button>

              <div className="trips-badge">
                ✨ STEP 3 OF 6
              </div>

            </div>


            <section className="flight-hero hotel-hero">

              <h1>
                Find your
                <span> perfect stay.</span>
              </h1>

              <p>
                LIFEOS will compare suitable hotels in your destination
                and help you balance comfort, rating, location and budget.
              </p>

            </section>


            <section className="hotel-route-card">

              <div className="hotel-destination">

                <small>DESTINATION</small>

                <strong>
                  {destination}
                </strong>

                <span>
                  {tripType === 'round'
                    ? `${formatDate(departureDate)} — ${formatDate(returnDate)}`
                    : formatDate(departureDate)}
                </span>

              </div>


              <div className="hotel-meta-divider"></div>


              <div className="hotel-meta-item">

                <small>TRAVELERS</small>

                <strong>
                  {travelers}
                </strong>

              </div>


              {budget && (

                <div className="hotel-meta-item">

                  <small>TRIP BUDGET</small>

                  <strong>
                    ₹{Number(budget).toLocaleString('en-IN')}
                  </strong>

                </div>

              )}

            </section>


            <section className="hotel-search-card">

              <div className="hotel-search-header">

                <div>

                  <span className="planner-step">
                    LIVE HOTEL SEARCH
                  </span>

                  <h2>
                    Hotels in {destination}
                  </h2>

                  <p>
                    Current hotel availability, ratings and prices will
                    come from the connected travel provider.
                  </p>

                </div>


                <div className="live-status">

                  <span></span>

                  Live pricing

                </div>

              </div>


              <div className="hotel-api-notice">

                <div className="notice-icon">
                  🏨
                </div>

                <div>

                  <strong>
                    Real hotel data — no fake listings
                  </strong>

                  <p>
                    LIFEOS will only display hotels and prices returned
                    by the connected provider. No artificial prices,
                    ratings or availability will be shown.
                  </p>

                </div>

              </div>


              <div className="hotel-preference-grid">

                <div className="hotel-preference-card">

                  <span>💰</span>

                  <div>

                    <strong>Budget aware</strong>

                    <p>
                      Keep hotel costs aligned with your total trip budget.
                    </p>

                  </div>

                </div>


                <div className="hotel-preference-card">

                  <span>⭐</span>

                  <div>

                    <strong>Highly rated</strong>

                    <p>
                      Compare available stays by their real ratings.
                    </p>

                  </div>

                </div>


                <div className="hotel-preference-card">

                  <span>📍</span>

                  <div>

                    <strong>Good location</strong>

                    <p>
                      Consider the hotel's location while planning your stay.
                    </p>

                  </div>

                </div>

              </div>


              <div className="hotel-empty-state">

                <div className="empty-hotel-icon">
                  🏨
                </div>

                <h3>
                  Ready for live hotel search
                </h3>

                <p>
                  Once the hotel provider is connected, LIFEOS will fetch
                  real available stays with price, rating, location,
                  amenities and availability.
                </p>

                <div className="hotel-data-grid">

                  <div>

                    <span>Destination</span>

                    <strong>
                      {destination}
                    </strong>

                  </div>


                  <div>

                    <span>Check-in</span>

                    <strong>
                      {formatDate(departureDate)}
                    </strong>

                  </div>


                  {tripType === 'round' && (

                    <div>

                      <span>Check-out</span>

                      <strong>
                        {formatDate(returnDate)}
                      </strong>

                    </div>

                  )}


                  <div>

                    <span>Guests</span>

                    <strong>
                      {travelers}
                    </strong>

                  </div>

                </div>

              </div>


              <div className="hotel-footer">

                <div>

                  <strong>
                    Next: Places to explore
                  </strong>

                  <p>
                    After selecting a hotel, LIFEOS will help you discover
                    famous attractions and interesting places nearby.
                  </p>

                </div>

                <button
                  type="button"
                  className="continue-button"
                  disabled
                >
                  Continue to Places →
                </button>

              </div>

            </section>

          </section>

        )}

      </main>

    </div>
  )
}

export default Trips
