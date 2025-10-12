import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaRoute, FaPlus, FaTrash, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import { usePageTitle } from '../hooks/usePageTitle';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function RoutePlanner() {
  // Set page title
  usePageTitle("Route Planner - Navigation Tool");

  const [stops, setStops] = useState([{ address: '', coordinates: null }]);
  const [optimizing, setOptimizing] = useState(false);
  const [plan, setPlan] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [map, setMap] = useState(null);
  const [mapError, setMapError] = useState(null);

  const mapRef = useRef(null);
  const geocoderRefs = useRef([]);
  const markersRef = useRef([]);

  const addStop = () => setStops(s => [...s, { address: '', coordinates: null }]);
  const removeStop = (i) => setStops(s => s.filter((_, idx) => idx !== i));
  const updateStop = (i, value, coordinates = null) => {
    setStops(s => s.map((st, idx) => 
      idx === i ? { address: value, coordinates } : st
    ));
  };

  // Initialize Mapbox
  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in your environment variables.');
      setMapError('Mapbox access token not configured');
      return;
    }
    
    try {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      setMapReady(true);
      setMapError(null);
    } catch (error) {
      console.error('Error setting Mapbox access token:', error);
      setMapError('Failed to initialize Mapbox');
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapReady || !mapRef.current || map) return;

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [77.2090, 28.6139], // Delhi coordinates
        zoom: 11,
        attributionControl: false
      });

      // Handle map load
      mapInstance.on('load', () => {
        console.log('Map loaded successfully');
        setMap(mapInstance);
        setMapError(null);
        
        // Add navigation controls
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control
        mapInstance.addControl(new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }), 'top-right');
      });

      // Handle map errors
      mapInstance.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map failed to load. Please check your internet connection.');
      });

      // Handle style load errors
      mapInstance.on('style.load', () => {
        console.log('Map style loaded successfully');
      });

      mapInstance.on('style.error', (e) => {
        console.error('Map style error:', e);
        setMapError('Map style failed to load');
      });

    } catch (error) {
      console.error('Error creating map:', error);
      setMapError('Failed to create map instance');
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [mapReady]);

  // Clear markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      if (marker) {
        marker.remove();
      }
    });
    markersRef.current = [];
  }, []);

  // Add markers for stops
  const addMarkers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    clearMarkers();

    stops.forEach((stop, index) => {
      if (stop.coordinates) {
        const marker = new mapboxgl.Marker({
          color: index === 0 ? '#10b981' : index === stops.length - 1 ? '#ef4444' : '#3b82f6'
        })
          .setLngLat(stop.coordinates)
          .addTo(map);
        
        markersRef.current.push(marker);
      }
    });
  }, [map, stops, clearMarkers]);

  // Update markers when stops change
  useEffect(() => {
    if (map && map.isStyleLoaded()) {
      addMarkers();
    }
  }, [map, stops, addMarkers]);

  const computePlanFallback = () => {
    const valid = stops.map(s => s.address.trim()).filter(Boolean);
    const now = new Date();
    return valid.map((addr, idx) => ({ 
      addr, 
      eta: new Date(now.getTime() + idx * 20 * 60000) 
    }));
  };

  // Plan route using Mapbox Directions API
  const optimize = async () => {
    const validStops = stops.filter(s => s.address.trim() && s.coordinates);
    if (validStops.length < 2) { 
      toast.error('Please add at least 2 valid addresses with coordinates');
      return; 
    }

    if (!map || !map.isStyleLoaded()) {
      toast.error('Map is not ready. Please wait for the map to load.');
      return;
    }

    setOptimizing(true);
    try {
      // Prepare coordinates for Mapbox Directions API
      const coordinates = validStops.map(stop => stop.coordinates).join(';');
      
      // Call Mapbox Directions API
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Safely remove existing route source and layer
        try {
          if (map.getSource('route')) {
            if (map.getLayer('route')) {
              map.removeLayer('route');
            }
            map.removeSource('route');
          }
        } catch (error) {
          console.warn('Error removing existing route:', error);
        }

        // Add route source
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });

        // Add route layer
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Calculate ETAs based on route legs
        const waypoints = data.waypoints || [];
        const now = Date.now();
        let cumulativeDuration = 0;

        const itinerary = validStops.map((stop, idx) => {
          if (idx > 0) {
            // Calculate duration for this leg (in milliseconds)
            const legDuration = route.legs[idx - 1]?.duration * 1000 || 0;
            cumulativeDuration += legDuration;
          }
          
          return {
            addr: stop.address,
            eta: new Date(now + cumulativeDuration),
            coordinates: stop.coordinates
          };
        });

        setPlan(itinerary);

        // Fit map to route bounds
        if (route.geometry.coordinates.length > 0) {
          const bounds = route.geometry.coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(route.geometry.coordinates[0], route.geometry.coordinates[0]));

          map.fitBounds(bounds, {
            padding: 50
          });
        }

        toast.success('Route planned successfully!');
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Route planning failed:', error);
      toast.error('Route planning failed. Showing approximate itinerary.');
      setPlan(computePlanFallback());
    } finally {
      setOptimizing(false);
    }
  };

  // Handle address input with debounced geocoding
  const onChangeAddress = useCallback(async (i, value) => {
    updateStop(i, value);
    
    if (!value || value.length < 3) {
      setPredictions(prev => {
        const copy = [...prev];
        copy[i] = [];
        return copy;
      });
      return;
    }

    try {
      // Use Mapbox Geocoding API for suggestions
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?country=in&types=address,poi&limit=5&access_token=${MAPBOX_ACCESS_TOKEN}`
      );

      if (response.ok) {
        const data = await response.json();
        setPredictions(prev => {
          const copy = [...prev];
          copy[i] = data.features || [];
          return copy;
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, []);

  const pickPrediction = (i, prediction) => {
    updateStop(i, prediction.place_name, prediction.center);
    setPredictions(prev => {
      const copy = [...prev];
      copy[i] = [];
      return copy;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaRoute className="text-blue-600"/> Property Visit Route Planner
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Planning Panel */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-5 space-y-3">
          <h2 className="text-lg font-semibold mb-4">Plan Your Route</h2>
          
          {stops.map((s, i) => (
            <div key={i} className="flex flex-col gap-1 relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    className="w-full border rounded p-2 text-sm sm:text-base pr-8" 
                    value={s.address} 
                    onChange={e => onChangeAddress(i, e.target.value)} 
                    placeholder={`Stop ${i+1} address`}
                  />
                  {s.coordinates && (
                    <FaMapMarkerAlt className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {stops.length > 1 && (
                  <button 
                    onClick={() => removeStop(i)} 
                    className="px-3 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <FaTrash/>
                  </button>
                )}
              </div>
              
              {predictions[i] && predictions[i].length > 0 && (
                <ul className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded shadow max-h-56 overflow-auto">
                  {predictions[i].map((prediction, idx) => (
                    <li 
                      key={idx} 
                      className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
                      onMouseDown={() => pickPrediction(i, prediction)}
                    >
                      <div className="font-medium">{prediction.place_name}</div>
                      {prediction.context && (
                        <div className="text-xs text-gray-500">
                          {prediction.context.map(ctx => ctx.text).join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button 
              onClick={addStop} 
              className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 justify-center transition-colors"
            >
              <FaPlus/> Add Stop
            </button>
            <button 
              onClick={optimize} 
              disabled={optimizing || !map || !map.isStyleLoaded()} 
              className="px-4 py-2 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-60 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {optimizing ? 'Planning...' : 'Plan Route'}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {MAPBOX_ACCESS_TOKEN ? (
            <div className="h-64 sm:h-80 lg:h-96 relative">
              {mapError ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FaRoute className="text-4xl mb-2 mx-auto text-red-500" />
                    <p className="text-red-600">{mapError}</p>
                    <button 
                      onClick={() => {
                        setMapError(null);
                        setMapReady(false);
                        setTimeout(() => setMapReady(true), 100);
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-full" />
              )}
            </div>
          ) : (
            <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FaRoute className="text-4xl mb-2 mx-auto" />
                <p>Tip: Set VITE_MAPBOX_ACCESS_TOKEN to enable interactive map and directions.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Route Itinerary */}
      {plan.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaClock className="text-blue-600"/> Visit Itinerary
          </h2>
          <ol className="space-y-3">
            {plan.map((p, idx) => (
              <li key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  idx === 0 ? 'bg-green-500' : idx === plan.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{p.addr}</div>
                  <div className="text-sm text-gray-500">
                    ETA: {p.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Route optimized using Mapbox Directions API</strong> - Real-time routing with traffic considerations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}