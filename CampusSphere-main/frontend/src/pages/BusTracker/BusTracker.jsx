import { useState, useEffect, useRef, useCallback } from "react";
import { Bus, Circle, Navigation, Clock, MapPin } from "lucide-react";

// VIT Vellore center
const VIT_CENTER = { lat: 12.9698, lng: 79.1559 };

// Campus bus routes (real VIT Vellore area coords)
const BUS_ROUTES = [
  {
    id: "R1", name: "Route 1 — Main Gate Loop", color: "#5483B3",
    coords: [
      {lat:12.9698,lng:79.1559},{lat:12.9710,lng:79.1570},{lat:12.9720,lng:79.1560},
      {lat:12.9715,lng:79.1545},{lat:12.9705,lng:79.1535},{lat:12.9695,lng:79.1540},
      {lat:12.9688,lng:79.1552},{lat:12.9690,lng:79.1565},{lat:12.9698,lng:79.1559},
    ],
  },
  {
    id: "R2", name: "Route 2 — Hostel Circuit", color: "#7DA0CA",
    coords: [
      {lat:12.9698,lng:79.1559},{lat:12.9685,lng:79.1565},{lat:12.9675,lng:79.1558},
      {lat:12.9672,lng:79.1545},{lat:12.9680,lng:79.1535},{lat:12.9690,lng:79.1530},
      {lat:12.9700,lng:79.1538},{lat:12.9705,lng:79.1550},{lat:12.9698,lng:79.1559},
    ],
  },
  {
    id: "R3", name: "Route 3 — Academic Block", color: "#C1E8FF",
    coords: [
      {lat:12.9698,lng:79.1559},{lat:12.9708,lng:79.1548},{lat:12.9718,lng:79.1540},
      {lat:12.9725,lng:79.1550},{lat:12.9720,lng:79.1565},{lat:12.9710,lng:79.1570},
      {lat:12.9700,lng:79.1572},{lat:12.9695,lng:79.1563},{lat:12.9698,lng:79.1559},
    ],
  },
];

// Interpolate position between two points
function interpolate(p1, p2, t) {
  return { lat: p1.lat + (p2.lat - p1.lat) * t, lng: p1.lng + (p2.lng - p1.lng) * t };
}

// Initial bus states — each on a different route, different progress
const initBuses = () => BUS_ROUTES.map((route, i) => ({
  id: `BUS-${101 + i}`,
  routeId: route.id,
  routeName: route.name,
  color: route.color,
  segIndex: i % (route.coords.length - 1),
  progress: i * 0.3,
  speed: 0.015 + i * 0.005,
  pos: route.coords[i % route.coords.length],
  status: "Running",
}));

// Dark map style JSON
const DARK_MAP_STYLE = [
  {elementType:"geometry",stylers:[{color:"#0a1628"}]},
  {elementType:"labels.text.stroke",stylers:[{color:"#0a1628"}]},
  {elementType:"labels.text.fill",stylers:[{color:"#7DA0CA"}]},
  {featureType:"administrative",elementType:"geometry.stroke",stylers:[{color:"#1a3a6e"}]},
  {featureType:"road",elementType:"geometry",stylers:[{color:"#1a3a6e"}]},
  {featureType:"road",elementType:"labels.text.fill",stylers:[{color:"#5483B3"}]},
  {featureType:"poi",stylers:[{visibility:"off"}]},
  {featureType:"transit",stylers:[{visibility:"off"}]},
  {featureType:"water",elementType:"geometry",stylers:[{color:"#021024"}]},
  {featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#5483B3"}]},
];

export default function BusTracker() {
  const mapRef  = useRef(null);
  const gmap    = useRef(null);
  const markers = useRef({});
  const polys   = useRef([]);
  const [buses, setBuses]       = useState(initBuses);
  const [selected, setSelected] = useState(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Load Google Maps
  useEffect(() => {
    if (window.google?.maps) { setMapsReady(true); return; }
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) { setApiError(true); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=__gmInit`;
    script.async = true;
    window.__gmInit = () => setMapsReady(true);
    script.onerror = () => setApiError(true);
    document.head.appendChild(script);
    return () => { delete window.__gmInit; };
  }, []);

  // Init map
  useEffect(() => {
    if (!mapsReady || !mapRef.current || gmap.current) return;
    gmap.current = new window.google.maps.Map(mapRef.current, {
      center: VIT_CENTER,
      zoom: 16,
      minZoom: 15,
      maxZoom: 19,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      restriction: {
        latLngBounds: { north:12.982, south:12.958, east:79.168, west:79.143 },
        strictBounds: true,
      },
    });

    // Draw routes as polylines
    BUS_ROUTES.forEach(route => {
      const poly = new window.google.maps.Polyline({
        path: route.coords,
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: 0.5,
        strokeWeight: 3,
        map: gmap.current,
      });
      polys.current.push(poly);
    });

    // Create bus markers
    initBuses().forEach(bus => {
      const marker = new window.google.maps.Marker({
        position: bus.pos,
        map: gmap.current,
        title: bus.id,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: bus.color,
          fillOpacity: 1,
          strokeColor: "#021024",
          strokeWeight: 1.5,
        },
        zIndex: 10,
      });
      markers.current[bus.id] = marker;
    });
  }, [mapsReady]);

  // Animate buses
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        const route = BUS_ROUTES.find(r => r.id === bus.routeId);
        let { segIndex, progress } = bus;
        progress += bus.speed;
        if (progress >= 1) { progress = 0; segIndex = (segIndex + 1) % (route.coords.length - 1); }
        const pos = interpolate(route.coords[segIndex], route.coords[segIndex + 1], progress);

        // Update marker position smoothly
        if (markers.current[bus.id] && gmap.current) {
          markers.current[bus.id].setPosition(pos);
        }
        return { ...bus, segIndex, progress, pos };
      }));
    }, 200);
    return () => clearInterval(interval);
  }, [mapsReady]);

  const focusBus = (bus) => {
    setSelected(bus.id === selected ? null : bus.id);
    if (gmap.current) gmap.current.panTo(bus.pos);
  };

  // Fallback simulation view (no API key)
  if (apiError) {
    return <SimulationFallback buses={buses} selected={selected} setSelected={setSelected} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Bus size={20} className="text-accent" /> Bus Tracker</h1>
        <p className="text-soft text-sm mt-0.5">Live campus bus positions — VIT Vellore</p>
      </div>

      <div className="flex gap-4 h-[580px]">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-background relative">
          <div ref={mapRef} className="w-full h-full" />
          {!mapsReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center text-soft">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading map...</p>
              </div>
            </div>
          )}
          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 glass rounded-xl px-3 py-2 space-y-1">
            {BUS_ROUTES.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-0.5 rounded" style={{background:r.color}} />
                <span className="text-soft">{r.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bus list */}
        <div className="w-64 space-y-2 overflow-y-auto">
          <p className="text-xs text-soft font-medium px-1">Active Buses ({buses.length})</p>
          {buses.map(bus => (
            <div key={bus.id} onClick={() => focusBus(bus)}
              className={`bg-primary border rounded-2xl p-3.5 cursor-pointer transition-all card-hover ${selected===bus.id?"border-accent/50 bg-accent/5":"border-white/10"}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${bus.color}20`,border:`1px solid ${bus.color}40`}}>
                  <Bus size={14} style={{color:bus.color}} />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">{bus.id}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-soft" />
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
              </div>
              <p className="text-soft text-[10px] leading-relaxed">{bus.routeName}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-soft">
                <Navigation size={10} />
                <span>{bus.pos.lat.toFixed(4)}°N, {bus.pos.lng.toFixed(4)}°E</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Fallback when no API key — shows animated coordinate display
function SimulationFallback({ buses, selected, setSelected }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Bus size={20} className="text-accent" /> Bus Tracker</h1>
        <p className="text-soft text-sm mt-0.5">Simulation mode — add VITE_GOOGLE_MAPS_KEY to .env for live map</p>
      </div>

      {/* Simulated map area */}
      <div className="h-72 bg-primary border border-white/10 rounded-2xl overflow-hidden relative flex items-center justify-center">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage:"radial-gradient(circle,#5483B3 1px,transparent 1px)",backgroundSize:"32px 32px"}} />
        <div className="relative text-center">
          <MapPin size={32} className="mx-auto text-accent mb-2" />
          <p className="text-white font-semibold">VIT Vellore Campus</p>
          <p className="text-soft text-xs mt-1">12.9698°N, 79.1559°E</p>
        </div>
        {/* Animated bus dots */}
        {buses.map((bus, i) => (
          <div key={bus.id} className="absolute w-4 h-4 rounded-full border-2 flex items-center justify-center pulse-soft"
            style={{
              background:`${bus.color}30`, borderColor:bus.color,
              left:`${25+i*25}%`, top:`${30+Math.sin(bus.progress*Math.PI*2)*20+i*10}%`,
              transition:"top 0.2s ease",
            }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{background:bus.color}} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {buses.map(bus => (
          <div key={bus.id} onClick={() => setSelected(bus.id===selected?null:bus.id)}
            className={`bg-primary border rounded-2xl p-4 cursor-pointer transition-all card-hover ${selected===bus.id?"border-accent/50":"border-white/10"}`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${bus.color}20`,border:`1px solid ${bus.color}40`}}>
                <Bus size={15} style={{color:bus.color}} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">{bus.id}</p>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-soft"/><span className="text-xs text-green-400">Running</span></div>
              </div>
            </div>
            <p className="text-soft text-xs mb-2 leading-relaxed">{bus.routeName}</p>
            <div className="text-[10px] text-soft font-mono">
              <div>LAT: {bus.pos.lat.toFixed(5)}</div>
              <div>LNG: {bus.pos.lng.toFixed(5)}</div>
            </div>
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{width:`${bus.progress*100}%`,background:bus.color}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
