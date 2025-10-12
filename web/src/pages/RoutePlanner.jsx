import React, { useEffect, useRef, useState } from 'react';
import { FaRoute, FaPlus, FaTrash, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { usePageTitle } from '../hooks/usePageTitle';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function RoutePlanner() {
  // Set page title
  usePageTitle("Route Planner - Navigation Tool");

  const [stops, setStops] = useState([{ address: '' }]);
  const [optimizing, setOptimizing] = useState(false);
  const [plan, setPlan] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const [predictions, setPredictions] = useState([]); // array of arrays per stop index
  const [mapsReady, setMapsReady] = useState(() => Boolean(typeof window !== 'undefined' && window.google && window.google.maps));

  const addStop = () => setStops(s => [...s, { address: '' }]);
  const removeStop = (i) => setStops(s => s.filter((_, idx) => idx !== i));
  const updateStop = (i, value) => setStops(s => s.map((st, idx) => idx===i ? { address: value } : st));

  // Load Google Maps script once
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    if (window.google && window.google.maps && window.google.maps.places) {
      setMapsReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsReady(true);
    document.body.appendChild(script);
    // do not remove to keep cached
  }, [GOOGLE_MAPS_API_KEY]);

  // Initialize map when API is ready
  useEffect(() => {
    if (!mapsReady) return;
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.2090 },
      zoom: 11,
    });
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({ suppressMarkers: false });
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current.setMap(mapInstanceRef.current);
    placesServiceRef.current = new window.google.maps.places.PlacesService(mapInstanceRef.current);
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
  }, [mapsReady]);

  const computePlanFallback = () => {
    const valid = stops.map(s => s.address.trim()).filter(Boolean);
    const now = new Date();
    return valid.map((addr, idx) => ({ addr, eta: new Date(now.getTime() + idx * 20 * 60000) }));
  };

  // Plan route using Google Directions if available; fallback if not
  const optimize = async () => {
    const addresses = stops.map(s => s.address.trim()).filter(Boolean);
    if (addresses.length < 2) { alert('Add at least 2 addresses'); return; }
    setOptimizing(true);
    try {
      if (window.google && window.google.maps && directionsServiceRef.current && directionsRendererRef.current) {
        const origin = addresses[0];
        const destination = addresses[addresses.length - 1];
        const waypoints = addresses.slice(1, -1).map(a => ({ location: a, stopover: true }));

        const result = await directionsServiceRef.current.route({
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        });
        directionsRendererRef.current.setDirections(result);

        // Build human-readable plan from legs
        const route = result.routes[0];
        const order = route.waypoint_order || [];
        const ordered = [origin, ...order.map(i => addresses.slice(1, -1)[i]), destination];
        // Approximate ETAs by cumulative leg durations
        let cumMs = 0;
        const now = Date.now();
        const legs = route.legs;
        const out = ordered.map((addr, idx) => {
          if (idx > 0) cumMs += (legs[idx - 1]?.duration?.value || 0) * 1000; // seconds to ms
          return { addr, eta: new Date(now + cumMs) };
        });
        setPlan(out);
      } else {
        setPlan(computePlanFallback());
      }
    } catch (e) {
      console.error('Route planning failed:', e);
      const msg = (e && (e.message || e.status || e)) + '';
      if (msg && msg.toString().includes('ZERO_RESULTS')) {
        toast.error('No route found between origin and destination.');
      } else {
        toast.error('Route planning failed. Showing approximate itinerary.');
      }
      setPlan(computePlanFallback());
    } finally {
      setOptimizing(false);
    }
  };

  const ensurePredictionsArray = (len) => {
    setPredictions(prev => {
      const copy = prev.slice();
      while (copy.length < len) copy.push([]);
      return copy;
    });
  };

  const onChangeAddress = (i, value) => {
    updateStop(i, value);
    ensurePredictionsArray(stops.length);
    const svc = autocompleteServiceRef.current;
    if (!svc || !value || value.length < 3) {
      setPredictions(prev => {
        const copy = prev.slice();
        copy[i] = [];
        return copy;
      });
      return;
    }
    svc.getPlacePredictions({ input: value }, (res) => {
      setPredictions(prev => {
        const copy = prev.slice();
        copy[i] = res || [];
        return copy;
      });
    });
  };

  const pickPrediction = (i, prediction) => {
    updateStop(i, prediction.description);
    setPredictions(prev => {
      const copy = prev.slice();
      copy[i] = [];
      return copy;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaRoute className="text-green-600"/> Property Visit Route Planner</h1>
      <div className="bg-white rounded-xl shadow p-4 sm:p-5 space-y-3">
        {stops.map((s, i) => (
          <div key={i} className="flex flex-col gap-1 relative">
            <div className="flex gap-2">
              <input className="flex-1 border rounded p-2 text-sm sm:text-base" value={s.address} onChange={e=>onChangeAddress(i, e.target.value)} placeholder={`Stop ${i+1} address`}/>
              {stops.length > 1 && (
                <button onClick={()=>removeStop(i)} className="px-3 rounded bg-red-100 text-red-600"><FaTrash/></button>
              )}
            </div>
            {predictions[i] && predictions[i].length > 0 && (
              <ul className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded shadow max-h-56 overflow-auto">
                {predictions[i].map(p => (
                  <li key={p.place_id} className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer" onMouseDown={() => pickPrediction(i, p)}>
                    {p.description}
                  </li>
                ))}
              </ul>
            )}
            {stops.length > 1 && (
              null
            )}
          </div>
        ))}
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={addStop} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 justify-center"><FaPlus/> Add Stop</button>
          <button onClick={optimize} disabled={optimizing} className="px-4 py-2 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-60">{optimizing?'Planning...':'Plan Route'}</button>
        </div>
      </div>
      <div className="mt-6">
        {GOOGLE_MAPS_API_KEY ? (
          <div ref={mapRef} className="w-full h-64 sm:h-80 rounded-xl border border-gray-200" />
        ) : (
          <div className="text-sm text-gray-500">Tip: Set VITE_GOOGLE_MAPS_API_KEY to enable interactive map and directions.</div>
        )}
      </div>
      {plan.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Visit Itinerary</h2>
          <ol className="space-y-2 list-decimal list-inside">
            {plan.map((p, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <FaClock className="text-gray-500"/> <span className="font-medium">{p.addr}</span> — ETA {p.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-500 mt-3">Note: Demo itinerary. Integrate with Google Maps Directions API for real routing.</p>
        </div>
      )}
    </div>
  );
}
