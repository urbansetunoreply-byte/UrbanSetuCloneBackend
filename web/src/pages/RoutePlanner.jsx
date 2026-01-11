import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaRoute, FaPlus, FaTrash, FaClock, FaMapMarkerAlt, FaCar, FaWalking, FaBicycle, FaBus, FaCog, FaDownload, FaShare, FaBookmark, FaHistory, FaFilter, FaSearch, FaLocationArrow, FaDirections, FaInfoCircle, FaTrafficLight, FaLayerGroup, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp, FaExpand, FaCompress, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import '../styles/routePlannerSuggestions.css';

import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePageTitle } from '../hooks/usePageTitle';
import { useHeader } from '../contexts/HeaderContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function RoutePlanner() {
  // Set page title
  usePageTitle("Advanced Route Planner - Navigation Tool");

  // Header context
  const { hideHeader, showHeader } = useHeader();
  const { currentUser } = useSelector((state) => state.user);

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
  const [showMapStyles, setShowMapStyles] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  const [loadingLocation, setLoadingLocation] = useState(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDestructive: false
  });

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
    { id: 'driving-traffic', name: 'Traffic', icon: FaTrafficLight, color: '#F59E0B' }
  ];

  const addStop = () => {
    if (stops.length >= 10) {
      toast.warning('Maximum of 10 stops allowed.');
      return;
    }
    setStops(s => [...s, { address: '', coordinates: null }]);
  };
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

  // Trigger map resize when sidebar state changes
  useEffect(() => {
    if (map) {
      // Resize immediately and periodically during transition
      const interval = setInterval(() => {
        map.resize();
      }, 50);

      // Final resize after transition completes
      const timeout = setTimeout(() => {
        clearInterval(interval);
        map.resize();
      }, 350);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [map, isSidebarOpen]);

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
        // Optimistically add the route with local geometry to avoid re-fetching immediately
        const routeWithData = { ...data.route, route: routeData };
        setSavedRoutes(prev => [routeWithData, ...prev]);
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

  // Load saved route (fetches full details if needed)
  const loadRoute = async (savedRoute) => {
    try {
      let routeGeometry = savedRoute.route;

      // If geometry is missing (from optimized list fetch), fetch full details
      if (!routeGeometry) {
        const loadingToast = toast.loading("Fetching route details...");
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/route-planner/saved/${savedRoute._id}`, {
            credentials: 'include'
          });

          if (!response.ok) throw new Error("Failed to fetch details");

          const data = await response.json();
          if (data.success && data.route) {
            routeGeometry = data.route.route;
          } else {
            throw new Error("Invalid route data");
          }
        } catch (err) {
          toast.update(loadingToast, { render: "Failed to load route details", type: "error", isLoading: false, autoClose: 3000 });
          return;
        }
        toast.dismiss(loadingToast);
      }

      if (routeGeometry) {
        setStops(savedRoute.stops);
        setTravelMode(savedRoute.travelMode);
        setRouteData(routeGeometry);
        setIsRouteSaved(true);
        toast.success('Route loaded successfully!');
      }
    } catch (error) {
      console.error("Load route error:", error);
      toast.error("Error loading route");
    }
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
  const deleteSavedRoute = (routeId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Saved Route',
      message: 'Are you sure you want to delete this route from your saved list? This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
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
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Delete all saved routes
  const deleteAllSavedRoutes = () => {
    if (savedRoutes.length === 0) {
      toast.info('No routes to delete');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete All Saved Routes',
      message: `Are you sure you want to delete all ${savedRoutes.length} saved routes? This action cannot be undone.`,
      confirmText: 'Delete All',
      isDestructive: true,
      onConfirm: async () => {
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
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
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
  const useCurrentLocation = async (index) => {
    // Check for location permission in settings
    const allowLocationAccess = localStorage.getItem('allowLocationAccess');
    if (allowLocationAccess !== 'true') {
      const settingsPath = currentUser?.role?.includes('admin') ? '/admin/settings' : '/user/settings';
      toast.info(
        <div>
          Please enable Location Access in <Link to={settingsPath} className="font-bold underline">Settings &gt; Privacy</Link>
        </div>
      );
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    // Set loading state for this specific button
    setLoadingLocation(index);

    // Show loading toast
    const loadingToast = toast.loading('Getting your current location...');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const coordinates = [longitude, latitude];

      // Update current location state
      setCurrentLocation(coordinates);

      // Get address from coordinates using reverse geocoding
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address,poi`
        );
        const data = await response.json();

        let address = 'Current Location';
        if (data.features && data.features.length > 0) {
          address = data.features[0].place_name;
        }

        // Update the stop with current location
        updateStop(index, address, coordinates);

        toast.dismiss(loadingToast);
        toast.success('Current location added successfully!');

      } catch (geocodingError) {
        console.warn('Reverse geocoding failed:', geocodingError);
        // Still update with coordinates even if reverse geocoding fails
        updateStop(index, 'Current Location', coordinates);

        toast.dismiss(loadingToast);
        toast.success('Current location added!');
      }

    } catch (error) {
      toast.dismiss(loadingToast);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error('Location access denied. Please enable location permissions in your browser settings.');
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error('Location information is unavailable. Please check your GPS settings.');
          break;
        case error.TIMEOUT:
          toast.error('Location request timed out. Please try again.');
          break;
        default:
          toast.error('An error occurred while getting your location. Please try again.');
          break;
      }
    } finally {
      // Clear loading state
      setLoadingLocation(null);
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      <style>{`
        @media print {
          header, nav, .main-header, .navbar { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
      <div className={`flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 overflow-hidden relative ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''}`}>

        {/* LEFT SIDEBAR - CONTROLS & RESULTS */}
        <div className={`lg:h-full bg-white dark:bg-gray-800 shadow-2xl z-20 flex flex-col order-2 lg:order-1 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'h-[50vh] w-full lg:w-[420px] opacity-100' : 'h-16 w-full lg:w-0 lg:opacity-0 overflow-hidden'}`}>
          <div className="w-full lg:min-w-[420px] h-full flex flex-col">
            {/* Header Section */}
            <div className="p-4 bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-md flex-shrink-0">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <FaRoute className="text-yellow-300" />
                  <span>Route Planner</span>
                </h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm print:hidden"
                    title={isSidebarOpen ? "Collapse" : "Expand"}
                  >
                    <FaChevronLeft className="text-white text-sm hidden lg:block" />
                    {isSidebarOpen ? (
                      <FaChevronDown className="text-white text-sm lg:hidden" />
                    ) : (
                      <FaChevronUp className="text-white text-sm lg:hidden" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                    title="Saved Routes & History"
                  >
                    <FaBookmark className="text-white text-sm" />
                  </button>

                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

              {/* 1. Travel Mode & Options */}
              <motion.div
                initial="hidden" animate="visible" variants={containerVariants}
                className="space-y-4 print:hidden"
              >
                {/* Travel Mode Tabs */}
                <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl flex gap-1">
                  {travelModes.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = travelMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setTravelMode(mode.id)}
                        className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium flex flex-col items-center gap-1 transition-all ${isActive
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm scale-100'
                          : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        <Icon className={isActive ? 'text-lg' : 'text-base'} />
                        <span className="hidden sm:inline">{mode.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Collapsible Options */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <button
                      onClick={() => setRouteOptimization(prev => !prev)}
                      className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                    >
                      <FaFilter className="text-blue-500" /> Route Preferences
                    </button>
                    <Link
                      to={currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin') ? "/admin/settings" : "/user/settings"}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                      title="Settings"
                    >
                      <FaCog className="text-gray-400 text-xs" />
                    </Link>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                      <input type="checkbox" checked={routeOptimization} onChange={(e) => setRouteOptimization(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Optimize Stops</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                      <input type="checkbox" checked={avoidTolls} onChange={(e) => setAvoidTolls(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Avoid Tolls</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                      <input type="checkbox" checked={avoidHighways} onChange={(e) => setAvoidHighways(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Avoid Highways</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                      <input type="checkbox" checked={showAlternatives} onChange={(e) => setShowAlternatives(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">Alternatives</span>
                    </label>
                  </div>
                </div>
              </motion.div>

              {/* 2. Stops Input */}
              <motion.div variants={itemVariants} className="space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" /> Stops ({stops.length})
                  </h3>
                  <button
                    onClick={addStop}
                    disabled={stops.length >= 10}
                    className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded transition-colors ${stops.length >= 10 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:text-blue-800'}`}
                  >
                    <FaPlus /> Add Stop
                  </button>
                </div>

                <div className="space-y-3 relative">
                  {/* Connecting Line Visual */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-600 z-0"></div>

                  <AnimatePresence>
                    {stops.map((s, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative z-10"
                      >
                        <div className="flex gap-2 items-start">
                          {/* Marker Number */}
                          <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm mt-1 z-10 ring-2 ring-white
                          ${i === 0 ? 'bg-green-500' : i === stops.length - 1 ? 'bg-red-500' : 'bg-blue-500'}
                        `}>
                            {i + 1}
                          </div>

                          {/* Input Area */}
                          <div className="flex-1 bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all flex gap-2">
                            <div className="flex-1 relative">
                              <input
                                value={s.address}
                                onChange={e => onChangeAddress(i, e.target.value)}
                                placeholder={i === 0 ? "Start Location" : "Destination"}
                                className="w-full text-sm outline-none bg-transparent dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                              />
                              {/* Suggestions Dropdown */}
                              {predictions[i] && predictions[i].length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                                  {predictions[i].map((pred, idx) => (
                                    <div
                                      key={idx}
                                      onMouseDown={() => pickPrediction(i, pred)}
                                      className="p-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-xs border-b border-gray-50 dark:border-gray-700 last:border-0"
                                    >
                                      <div className="font-medium text-gray-800 dark:text-gray-200">{pred.place_name}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1 border-l pl-2 border-gray-100 dark:border-gray-600">
                              <button
                                onClick={() => useCurrentLocation(i)}
                                disabled={loadingLocation === i}
                                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors ${loadingLocation === i ? 'animate-pulse' : ''}`}
                                title="Current Location"
                              >
                                <FaLocationArrow className="text-xs" />
                              </button>
                              {stops.length > 1 && (
                                <button
                                  onClick={() => removeStop(i)}
                                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Remove Stop"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* 3. Action Button */}
              <motion.div variants={itemVariants} className="sticky bottom-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm pt-2 print:hidden">
                <button
                  onClick={optimize}
                  disabled={optimizing || !map}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {optimizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Finding the best route...
                    </>
                  ) : (
                    <>
                      <FaDirections className="text-lg" /> Plan Route
                    </>
                  )}
                </button>
              </motion.div>

              {/* 4. Results Section (Conditional) */}
              <AnimatePresence>
                {routeData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-gray-100 mt-4"
                  >
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="text-blue-500 dark:text-blue-300 text-xs font-semibold uppercase">Total Distance</div>
                        <div className="text-xl font-bold text-gray-800 dark:text-white">{routeStats?.distance} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">km</span></div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                        <div className="text-purple-500 dark:text-purple-300 text-xs font-semibold uppercase">Est. Duration</div>
                        <div className="text-xl font-bold text-gray-800 dark:text-white">{routeStats?.duration} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">min</span></div>
                      </div>
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="grid grid-cols-2 gap-2 mt-4 print:hidden">
                      <button onClick={saveRoute} disabled={isRouteSaved} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${isRouteSaved ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                        <FaBookmark /> {isRouteSaved ? 'Saved' : 'Save'}
                      </button>
                      <button onClick={shareRoute} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                        <FaShare /> Share
                      </button>
                      <button onClick={exportRoute} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                        <FaDownload /> GPX
                      </button>
                      <button onClick={() => window.print()} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                        <FaPrint /> Print / PDF
                      </button>
                    </div>

                    {/* Itinerary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Trip Timeline
                      </div>
                      <div>
                        {plan.map((p, idx) => (
                          <div key={idx} className="flex group hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors p-3 items-center gap-3 border-b border-gray-50 dark:border-gray-700 last:border-0 relative">
                            {idx !== plan.length - 1 && (
                              <div className="absolute left-[27px] top-8 bottom-[-8px] w-0.5 bg-gray-200 dark:bg-gray-600 group-hover:bg-blue-100 dark:group-hover:bg-gray-500 transition-colors"></div>
                            )}
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-600 shadow-sm flex items-center justify-center text-xs font-bold z-10
                                  bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 group-hover:scale-110 transition-transform
                               ">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.addr}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <FaClock className="text-gray-300 dark:text-gray-500" /> {p.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CO2 & Fuel */}
                    <div className="bg-gray-900 rounded-lg p-3 text-white flex justify-around text-center">
                      <div>
                        <div className="text-gray-400 text-xs">Est. Fuel Cost</div>
                        <div className="font-bold text-lg">₹{routeStats?.fuelCost}</div>
                      </div>
                      <div className="w-px bg-gray-700"></div>
                      <div>
                        <div className="text-gray-400 text-xs">CO₂ Emission</div>
                        <div className="font-bold text-lg">{routeStats?.co2Emission}g</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* RIGHT/BOTTOM - MAP AREA */}
        <div className="flex-1 h-[50vh] lg:h-full relative order-1 lg:order-2">
          {/* Map Container */}
          {MAPBOX_ACCESS_TOKEN ? (
            <div className="w-full h-full relative">
              <div ref={mapRef} className="w-full h-full" />

              {/* Floating Map Controls */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hidden lg:flex items-center justify-center text-gray-600 dark:text-gray-300"
                    title="Open Sidebar"
                  >
                    <FaChevronRight size={18} />
                  </button>
                )}
                <button
                  onClick={() => setShowMapStyles(!showMapStyles)}
                  className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-600 dark:text-gray-300"
                  title="Change Map Style"
                >
                  <FaLayerGroup size={18} />
                </button>

                <AnimatePresence>
                  {showMapStyles && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                    >
                      {Object.entries(mapStyles).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => {
                            changeMapStyle(key);
                            setShowMapStyles(false);
                          }}
                          className={`p-2 px-3 text-xs font-medium text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${mapStyle === key ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
                          title={key}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </button>
                      ))}
                      <button onClick={toggleTraffic} className={`p-2 px-3 text-xs font-medium text-left border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${showTraffic ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-gray-600 dark:text-gray-300'}`}>
                        Traffic {showTraffic ? 'On' : 'Off'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="absolute top-4 right-14 z-10">
                <button
                  onClick={() => {
                    const newFullscreen = !isFullscreen;
                    setIsFullscreen(newFullscreen);
                    if (newFullscreen) hideHeader(); else showHeader();
                  }}
                  className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-lg transition-all"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
              </div>

              {/* Error Overlay */}
              {mapError && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="text-center p-6 bg-white rounded-xl shadow-2xl">
                    <FaRoute className="text-4xl text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium mb-2">{mapError}</p>
                    <button onClick={() => { setMapError(null); setMapReady(false); setTimeout(() => setMapReady(true), 100); }} className="text-blue-600 hover:underline text-sm">Retry Connection</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center p-8">
                <FaRoute className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Map Unavailable</h3>
                <p className="text-gray-500 dark:text-gray-400">Please configure your Mapbox Access Token to view the map.</p>
              </div>
            </div>
          )}
        </div>

        {/* Saved Routes Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              >
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FaBookmark className="text-blue-600" /> Saved Routes & History
                  </h2>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-8">
                  {/* Saved Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><div className="w-2 h-6 bg-blue-500 rounded-full"></div> Saved Routes</h3>
                      {savedRoutes.length > 0 && <button onClick={deleteAllSavedRoutes} className="text-xs text-red-600 hover:underline">Clear All</button>}
                    </div>
                    {savedRoutes.length > 0 ? (
                      <div className="grid gap-3">
                        {savedRoutes.map((route) => (
                          <div key={route._id || route.id} className="bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-xl p-4 hover:shadow-md transition-shadow flex justify-between items-center group">
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-white">{route.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{new Date(route.timestamp).toLocaleDateString()} • {route.travelMode}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { loadRoute(route); setShowSettings(false); }} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors">Load</button>
                              <button onClick={() => deleteSavedRoute(route._id || route.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><FaTrash /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">No saved routes used yet.</div>
                    )}
                  </div>

                  {/* History Section */}
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4"><div className="w-2 h-6 bg-orange-500 rounded-full"></div> Recent History</h3>
                    <div className="space-y-2">
                      {routeHistory.slice(0, 5).map((route) => (
                        <div key={route.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-600" onClick={() => { loadRoute(route); setShowSettings(false); }}>
                          <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400"><FaHistory /></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{route.stops.map(s => s.address.split(',')[0]).join(' → ')}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{route.timestamp.toLocaleString()}</div>
                          </div>
                          <FaDirections className="text-gray-300 dark:text-gray-500" />
                        </div>
                      ))}
                      {routeHistory.length === 0 && <div className="text-sm text-gray-400 italic">No recent history available.</div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
      />
    </>
  );
}