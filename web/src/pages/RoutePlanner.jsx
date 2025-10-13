import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaRoute, FaPlus, FaTrash, FaClock, FaMapMarkerAlt, FaCar, FaWalking, FaBicycle, FaBus, FaCog, FaDownload, FaShare, FaBookmark, FaHistory, FaFilter, FaSearch, FaLocationArrow, FaMapPin, FaDirections, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import '../styles/routePlannerSuggestions.css';

import { usePageTitle } from '../hooks/usePageTitle';
import { useHeader } from '../contexts/HeaderContext';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function RoutePlanner() {
  // Set page title
  usePageTitle("Advanced Route Planner - Navigation Tool");
  
  // Header context
  const { hideHeader, showHeader } = useHeader();

  // State management
  const [stops, setStops] = useState([{ address: '', coordinates: null }]);
  const [optimizing, setOptimizing] = useState(false);
  const [plan, setPlan] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [map, setMap] = useState(null);
  const [mapError, setMapError] = useState(null);
  
  // Advanced features state
  const [travelMode, setTravelMode] = useState('driving');
  const [mapStyle, setMapStyle] = useState('streets');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [routeOptimization, setRouteOptimization] = useState(true);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedAlternative, setSelectedAlternative] = useState(0);
  const [isRouteSaved, setIsRouteSaved] = useState(false);

  const mapRef = useRef(null);
  const geocoderRefs = useRef([]);
  const markersRef = useRef([]);
  const routeSourcesRef = useRef([]);

  // Map styles configuration
  const mapStyles = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12'
  };

  // Travel modes configuration
  const travelModes = [
    { id: 'driving', name: 'Driving', icon: FaCar, color: '#3B82F6' },
    { id: 'walking', name: 'Walking', icon: FaWalking, color: '#10B981' },
    { id: 'cycling', name: 'Cycling', icon: FaBicycle, color: '#8B5CF6' },
    { id: 'driving-traffic', name: 'Driving (Traffic)', icon: FaCar, color: '#F59E0B' }
  ];

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

  // Initialize map with advanced features
  useEffect(() => {
    if (!mapReady || !mapRef.current || map) return;

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapRef.current,
        style: mapStyles[mapStyle],
        center: [77.2090, 28.6139], // Delhi coordinates
        zoom: 11,
        attributionControl: false,
        maxZoom: 20,
        minZoom: 1
      });

      // Handle map load
      mapInstance.on('load', () => {
        console.log('Map loaded successfully');
        setMap(mapInstance);
        setMapError(null);
        
        // Add navigation controls
        mapInstance.addControl(new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }), 'top-right');
        
        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true
        });
        
        geolocate.on('geolocate', (e) => {
          setCurrentLocation([e.coords.longitude, e.coords.latitude]);
        });
        
        mapInstance.addControl(geolocate, 'top-right');
        
        // Add scale control
        mapInstance.addControl(new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        }), 'bottom-left');
        
        // Add fullscreen control
        mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      });

      // Handle map errors
      mapInstance.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map failed to load. Please check your internet connection.');
      });

      // Handle style load
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
  }, [mapReady, mapStyle]);

  // Clear all route sources and layers
  const clearRoutes = useCallback(() => {
    if (!map) return;
    
    // Clear main route
    try {
      if (map.getLayer('route-main')) {
        map.removeLayer('route-main');
      }
      if (map.getSource('route-main')) {
        map.removeSource('route-main');
      }
    } catch (error) {
      console.warn('Error removing main route:', error);
    }
    
    // Clear alternative routes
    routeSourcesRef.current.forEach((sourceId) => {
      try {
        if (map.getLayer(sourceId)) {
          map.removeLayer(sourceId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.warn(`Error removing route ${sourceId}:`, error);
      }
    });
    routeSourcesRef.current = [];
  }, [map]);

  // Clear markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      if (marker) {
        marker.remove();
      }
    });
    markersRef.current = [];
  }, []);

  // Add markers for stops with enhanced styling
  const addMarkers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    clearMarkers();

    stops.forEach((stop, index) => {
      if (stop.coordinates) {
        const isStart = index === 0;
        const isEnd = index === stops.length - 1;
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: ${isStart ? '#10b981' : isEnd ? '#ef4444' : '#3b82f6'};
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        `;
        el.textContent = index + 1;

        const marker = new mapboxgl.Marker(el)
          .setLngLat(stop.coordinates)
          .addTo(map);
        
        // Add popup with stop information
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">Stop ${index + 1}</h3>
              <p class="text-xs text-gray-600">${stop.address}</p>
              <button onclick="navigator.clipboard.writeText('${stop.coordinates[1]}, ${stop.coordinates[0]}')" 
                      class="text-xs text-blue-600 hover:text-blue-800 mt-1">
                Copy Coordinates
              </button>
            </div>
          `);
        
        marker.setPopup(popup);
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

  // Change map style
  const changeMapStyle = (style) => {
    if (map) {
      setMapStyle(style);
      map.setStyle(mapStyles[style]);
    }
  };

  // Toggle traffic layer
  const toggleTraffic = () => {
    if (!map) return;
    
    setShowTraffic(!showTraffic);
    
    if (!showTraffic) {
      // Add traffic layer
      map.addSource('traffic', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1'
      });
      
      map.addLayer({
        id: 'traffic',
        type: 'line',
        source: 'traffic',
        'source-layer': 'traffic',
        paint: {
          'line-width': 2,
          'line-color': [
            'case',
            ['==', ['get', 'congestion'], 'low'], '#10b981',
            ['==', ['get', 'congestion'], 'moderate'], '#f59e0b',
            ['==', ['get', 'congestion'], 'heavy'], '#ef4444',
            ['==', ['get', 'congestion'], 'severe'], '#dc2626',
            '#6b7280'
          ]
        }
      });
    } else {
      // Remove traffic layer
      if (map.getLayer('traffic')) {
        map.removeLayer('traffic');
      }
      if (map.getSource('traffic')) {
        map.removeSource('traffic');
      }
    }
  };

  // Compute fallback plan
  const computePlanFallback = () => {
    const valid = stops.map(s => s.address.trim()).filter(Boolean);
    const now = new Date();
    return valid.map((addr, idx) => ({ 
      addr, 
      eta: new Date(now.getTime() + idx * 20 * 60000) 
    }));
  };

  // Enhanced route planning with alternatives
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
    setIsRouteSaved(false); // Reset saved status when planning new route
    try {
      // Prepare coordinates for Mapbox Directions API
      const coordinates = validStops.map(stop => stop.coordinates).join(';');
      
      // Build request parameters
      const params = new URLSearchParams({
        geometries: 'geojson',
        overview: 'full',
        steps: 'true',
        alternatives: showAlternatives ? 'true' : 'false',
        access_token: MAPBOX_ACCESS_TOKEN
      });

      if (avoidTolls) params.append('exclude', 'toll');
      if (avoidHighways) params.append('exclude', 'motorway');
      
      // Call Mapbox Directions API
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${coordinates}?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        // Clear existing routes
        clearRoutes();
        
        // Process main route
        const mainRoute = data.routes[0];
        setRouteData(mainRoute);
        
        // Process alternatives if available
        if (data.routes.length > 1) {
          setAlternatives(data.routes.slice(1));
        } else {
          setAlternatives([]);
        }
        
        // Add main route to map
        const mainSourceId = 'route-main';
        routeSourcesRef.current.push(mainSourceId);
        
        map.addSource(mainSourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: mainRoute.geometry
          }
        });

        map.addLayer({
          id: 'route-main',
          type: 'line',
          source: mainSourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.8
          }
        });

        // Add alternative routes
        alternatives.forEach((altRoute, index) => {
          const altSourceId = `route-alt-${index}`;
          routeSourcesRef.current.push(altSourceId);
          
          map.addSource(altSourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: altRoute.geometry
            }
          });

          map.addLayer({
            id: `route-alt-${index}`,
            type: 'line',
            source: altSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#6b7280',
              'line-width': 3,
              'line-opacity': 0.6,
              'line-dasharray': [2, 2]
            }
          });
        });

        // Calculate ETAs and route statistics
        const waypoints = data.waypoints || [];
        const now = Date.now();
        let cumulativeDuration = 0;

        const itinerary = validStops.map((stop, idx) => {
          if (idx > 0) {
            const legDuration = mainRoute.legs[idx - 1]?.duration * 1000 || 0;
            cumulativeDuration += legDuration;
          }
          
          return {
            addr: stop.address,
            eta: new Date(now + cumulativeDuration),
            coordinates: stop.coordinates
          };
        });

        setPlan(itinerary);

        // Set route statistics
        setRouteStats({
          distance: (mainRoute.distance / 1000).toFixed(2), // km
          duration: Math.round(mainRoute.duration / 60), // minutes
          fuelCost: calculateFuelCost(mainRoute.distance, travelMode),
          co2Emission: calculateCO2Emission(mainRoute.distance, travelMode)
        });

        // Fit map to route bounds
        if (mainRoute.geometry.coordinates.length > 0) {
          const bounds = mainRoute.geometry.coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(mainRoute.geometry.coordinates[0], mainRoute.geometry.coordinates[0]));

          map.fitBounds(bounds, {
            padding: 50
          });
        }

        // Save to route history
        const routeRecord = {
          id: Date.now(),
          stops: validStops,
          route: mainRoute,
          alternatives: alternatives,
          timestamp: new Date(),
          travelMode: travelMode
        };
        
        setRouteHistory(prev => [routeRecord, ...prev.slice(0, 9)]); // Keep last 10 routes

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

  // Calculate fuel cost (rough estimate)
  const calculateFuelCost = (distance, mode) => {
    if (mode === 'driving' || mode === 'driving-traffic') {
      const fuelEfficiency = 12; // km per liter
      const fuelPrice = 100; // INR per liter
      return ((distance / 1000) / fuelEfficiency * fuelPrice).toFixed(2);
    }
    return 0;
  };

  // Calculate CO2 emission (rough estimate)
  const calculateCO2Emission = (distance, mode) => {
    if (mode === 'driving' || mode === 'driving-traffic') {
      const emissionRate = 120; // grams CO2 per km
      return ((distance / 1000) * emissionRate).toFixed(0);
    }
    return 0;
  };

  // Save route to backend
  const saveRoute = async () => {
    if (!routeData) {
      toast.error('No route to save');
      return;
    }

    const routeToSave = {
      name: `Route ${stops.filter(s => s.address).map(s => s.address.split(',')[0]).join(' → ')}`,
      stops: stops.filter(s => s.address && s.coordinates),
      route: routeData,
      travelMode: travelMode,
      timestamp: new Date()
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/route-planner/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(routeToSave)
      });

      if (response.ok) {
        const data = await response.json();
        setSavedRoutes(prev => [data.route, ...prev]);
        setIsRouteSaved(true);
        toast.success('Route saved successfully!');
      } else {
        throw new Error('Failed to save route');
      }
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route. Please try again.');
    }
  };

  // Load saved route
  const loadRoute = (savedRoute) => {
    setStops(savedRoute.stops);
    setTravelMode(savedRoute.travelMode);
    setRouteData(savedRoute.route);
    setIsRouteSaved(true);
    toast.success('Route loaded successfully!');
  };

  // Fetch saved routes from backend
  const fetchSavedRoutes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/route-planner/saved`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSavedRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching saved routes:', error);
    }
  };

  // Delete a saved route
  const deleteSavedRoute = async (routeId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/route-planner/saved/${routeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSavedRoutes(prev => prev.filter(route => route._id !== routeId));
        toast.success('Route deleted successfully!');
      } else {
        throw new Error('Failed to delete route');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route. Please try again.');
    }
  };

  // Delete all saved routes
  const deleteAllSavedRoutes = async () => {
    if (savedRoutes.length === 0) {
      toast.info('No routes to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all ${savedRoutes.length} saved routes? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = savedRoutes.map(route => 
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/route-planner/saved/${route._id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );

      await Promise.all(deletePromises);
      setSavedRoutes([]);
      toast.success('All routes deleted successfully!');
    } catch (error) {
      console.error('Error deleting all routes:', error);
      toast.error('Failed to delete all routes. Please try again.');
    }
  };

  // Export route as GPX
  const exportRoute = () => {
    if (!routeData) {
      toast.error('No route to export');
      return;
    }

    const gpxContent = generateGPX(routeData, stops);
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${Date.now()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Route exported as GPX file!');
  };

  // Generate GPX content
  const generateGPX = (route, waypoints) => {
    const coordinates = route.geometry.coordinates;
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="UrbanSetu Route Planner">
  <trk>
    <name>Route</name>
    <trkseg>`;
    
    coordinates.forEach(coord => {
      gpx += `
      <trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>`;
    });
    
    gpx += `
    </trkseg>
  </trk>`;
    
    waypoints.forEach((waypoint, index) => {
      if (waypoint.coordinates) {
        gpx += `
  <wpt lat="${waypoint.coordinates[1]}" lon="${waypoint.coordinates[0]}">
    <name>Stop ${index + 1}</name>
    <desc>${waypoint.address}</desc>
  </wpt>`;
      }
    });
    
    gpx += `
</gpx>`;
    return gpx;
  };

  // Share route
  const shareRoute = async () => {
    if (!routeData) {
      toast.error('No route to share');
      return;
    }

    const shareData = {
      title: 'Route from UrbanSetu',
      text: `Check out this route: ${stops.filter(s => s.address).map(s => s.address).join(' → ')}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Route shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
        fallbackShare(shareData);
      }
    } else {
      fallbackShare(shareData);
    }
  };

  // Fallback share method
  const fallbackShare = (shareData) => {
    navigator.clipboard.writeText(shareData.url).then(() => {
      toast.success('Route URL copied to clipboard!');
    }).catch(() => {
      toast.error('Unable to share route');
    });
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

  // Use current location
  const useCurrentLocation = (index) => {
    if (currentLocation) {
      updateStop(index, 'Current Location', currentLocation);
      toast.success('Current location added!');
    } else {
      toast.error('Current location not available');
    }
  };

  // Fetch saved routes on component mount
  useEffect(() => {
    fetchSavedRoutes();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showSettings) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSettings]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-40 bg-white overflow-auto p-4' : 'max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-10'}`}>
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaRoute className="text-blue-600"/> Advanced Route Planner
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newFullscreen = !isFullscreen;
                setIsFullscreen(newFullscreen);
                if (newFullscreen) {
                  hideHeader();
                } else {
                  showHeader();
                }
              }}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Toggle Fullscreen"
            >
              <FaMapPin className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Saved Routes"
            >
              <FaBookmark className="text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Controls */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
            title="Saved Routes"
          >
            <FaBookmark className="text-gray-600 text-lg" />
          </button>
          <button
            onClick={() => {
              setIsFullscreen(false);
              showHeader();
            }}
            className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
            title="Exit Fullscreen"
          >
            <FaMapPin className="text-gray-600 text-lg" />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Planning Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Travel Mode Selection */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FaDirections className="text-blue-600" /> Travel Mode
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {travelModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setTravelMode(mode.id)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      travelMode === mode.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon style={{ color: mode.color }} />
                    <span className="text-sm font-medium">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route Options */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FaFilter className="text-green-600" /> Route Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={routeOptimization}
                  onChange={(e) => setRouteOptimization(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Optimize waypoints</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={avoidTolls}
                  onChange={(e) => setAvoidTolls(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Avoid tolls</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={avoidHighways}
                  onChange={(e) => setAvoidHighways(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Avoid highways</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAlternatives}
                  onChange={(e) => setShowAlternatives(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show alternatives</span>
              </label>
            </div>
          </div>

          {/* Stops Input */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-600" /> Stops
            </h3>
            
            {stops.map((s, i) => (
              <div key={i} className="flex flex-col gap-1 relative mb-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input 
                      className="w-full border rounded p-2 text-sm pr-8" 
                      value={s.address} 
                      onChange={e => onChangeAddress(i, e.target.value)} 
                      placeholder={`Stop ${i+1} address`}
                    />
                    {s.coordinates && (
                      <FaMapMarkerAlt className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  <button
                    onClick={() => useCurrentLocation(i)}
                    className="px-2 py-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title="Use current location"
                  >
                    <FaLocationArrow />
                  </button>
                  {stops.length > 1 && (
                    <button 
                      onClick={() => removeStop(i)} 
                      className="px-2 py-2 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <FaTrash/>
                    </button>
                  )}
                </div>
                
                {predictions[i] && predictions[i].length > 0 && (
                  <div className="suggestions-panel">
                    <ul className="suggestions-list suggestions-scroll">
                      {predictions[i].map((prediction, idx) => (
                        <li 
                          key={idx} 
                          className="suggestion-item" 
                          onMouseDown={() => pickPrediction(i, prediction)}
                        >
                          <div className="suggestion-name">{prediction.place_name}</div>
                          {prediction.context && (
                            <div className="suggestion-context">
                              {prediction.context.map(ctx => ctx.text).join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex flex-col gap-2">
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

          {/* Route Actions */}
          {routeData && (
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FaInfoCircle className="text-purple-600" /> Route Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={saveRoute}
                  className={`p-2 rounded transition-colors flex items-center gap-2 justify-center ${
                    isRouteSaved 
                      ? 'bg-green-200 text-green-700 cursor-default' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  disabled={isRouteSaved}
                >
                  <FaBookmark />
                  <span className="text-sm">{isRouteSaved ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  onClick={exportRoute}
                  className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center gap-2 justify-center"
                >
                  <FaDownload />
                  <span className="text-sm">Export</span>
                </button>
                <button
                  onClick={shareRoute}
                  className="p-2 rounded bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex items-center gap-2 justify-center"
                >
                  <FaShare />
                  <span className="text-sm">Share</span>
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-2 justify-center"
                >
                  <FaBookmark />
                  <span className="text-sm">Saved Routes</span>
                </button>
              </div>
            </div>
          )}

          {/* Route Statistics */}
          {routeStats && (
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FaInfoCircle className="text-orange-600" /> Route Statistics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{routeStats.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{routeStats.duration} min</span>
                </div>
                {routeStats.fuelCost > 0 && (
                  <div className="flex justify-between">
                    <span>Fuel Cost:</span>
                    <span className="font-medium">₹{routeStats.fuelCost}</span>
                  </div>
                )}
                {routeStats.co2Emission > 0 && (
                  <div className="flex justify-between">
                    <span>CO₂ Emission:</span>
                    <span className="font-medium">{routeStats.co2Emission}g</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="lg:col-span-2">
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

          {/* Map Controls */}
          <div className="mt-4 bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FaCog className="text-gray-600" /> Map Controls
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(mapStyles).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => changeMapStyle(key)}
                  className={`p-2 rounded text-sm capitalize ${
                    mapStyle === key
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </button>
              ))}
              <button
                onClick={toggleTraffic}
                className={`p-2 rounded text-sm ${
                  showTraffic
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Traffic
              </button>
            </div>
          </div>
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

      {/* Alternative Routes */}
      {alternatives.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaRoute className="text-gray-600"/> Alternative Routes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alternatives.map((alt, idx) => (
              <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Route {idx + 2}</span>
                  <span className="text-sm text-gray-500">
                    {Math.round(alt.duration / 60)} min
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {(alt.distance / 1000).toFixed(2)} km
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Saved Routes & History Panel */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
          style={{ overflow: 'hidden' }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <FaBookmark className="text-blue-600" />
                  <span className="hidden sm:inline">Saved Routes & History</span>
                  <span className="sm:hidden">Saved Routes</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchSavedRoutes}
                    className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                    title="Refresh saved routes"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">

                {/* Saved Routes */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <FaBookmark className="text-purple-600" />
                      Saved Routes
                    </h3>
                    {savedRoutes.length > 0 && (
                      <button
                        onClick={deleteAllSavedRoutes}
                        className="px-2 sm:px-3 py-1 bg-red-100 text-red-600 rounded text-xs sm:text-sm hover:bg-red-200 transition-colors"
                      >
                        <span className="hidden sm:inline">Delete All</span>
                        <span className="sm:hidden">Clear</span>
                      </button>
                    )}
                  </div>
                  {savedRoutes.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {savedRoutes.map((route) => (
                        <div key={route._id || route.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{route.name}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(route.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 ml-2">
                            <button
                              onClick={() => {
                                loadRoute(route);
                                setShowSettings(false);
                              }}
                              className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs sm:text-sm hover:bg-blue-200 transition-colors"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteSavedRoute(route._id || route.id)}
                              className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs sm:text-sm hover:bg-red-200 transition-colors"
                              title="Delete route"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No saved routes yet</p>
                  )}
                </div>

                {/* Route History */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                    <FaHistory className="text-orange-600" />
                    Recent Routes
                  </h3>
                  {routeHistory.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {routeHistory.slice(0, 5).map((route) => (
                        <div key={route.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">
                              {route.stops.map(s => s.address.split(',')[0]).join(' → ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {route.timestamp.toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              loadRoute(route);
                              setShowSettings(false);
                            }}
                            className="px-2 sm:px-3 py-1 bg-green-100 text-green-600 rounded text-xs sm:text-sm hover:bg-green-200 transition-colors ml-2"
                          >
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">No recent routes</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}