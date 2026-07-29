import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiGetHeatmap } from '../lib/api';
import type { HeatmapPoint } from '../types';

// PZ map bounds in grid cells (100 squares each). B42 vanilla ~21.000 × 12.000 squares.
const MAP_BOUNDS: L.LatLngBoundsExpression = [[0, 0], [120, 210]];

type EventType = 'kill' | 'death' | 'base';

const TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: [number, number, number] }> = {
  kill:  { label: 'Kill zones',    icon: '⚔️', color: [255, 60,  0]   },
  death: { label: 'Mortes',        icon: '💀', color: [180, 0,  220]  },
  base:  { label: 'Bases',         icon: '🏠', color: [0,   200, 80]  },
};

// ── Canvas heatmap overlay ────────────────────────────────────────────────────

class HeatmapOverlay {
  private map: L.Map;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: HeatmapPoint[] = [];
  private activeTypes: Set<EventType>;
  private maxCount = 1;

  constructor(map: L.Map, activeTypes: Set<EventType>) {
    this.map         = map;
    this.activeTypes = activeTypes;

    this.canvas              = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:450;';
    this.ctx = this.canvas.getContext('2d')!;

    map.getPanes().overlayPane!.appendChild(this.canvas);
    map.on('viewreset moveend zoomend resize', this._draw, this);
  }

  setData(data: HeatmapPoint[]) {
    this.data     = data;
    this.maxCount = Math.max(1, ...data.map(p => p.count));
    this._draw();
  }

  setActiveTypes(types: Set<EventType>) {
    this.activeTypes = types;
    this._draw();
  }

  remove() {
    this.map.off('viewreset moveend zoomend resize', this._draw, this);
    this.canvas.remove();
  }

  private _draw = () => {
    const size = this.map.getSize();
    this.canvas.width  = size.x;
    this.canvas.height = size.y;
    this.ctx.clearRect(0, 0, size.x, size.y);

    const zoom   = this.map.getZoom();
    const radius = Math.max(6, Math.min(40, 14 * Math.pow(2, zoom + 3)));

    for (const p of this.data) {
      if (!this.activeTypes.has(p.event_type)) continue;

      const px = this.map.latLngToContainerPoint([p.grid_y, p.grid_x]);
      const intensity = Math.sqrt(p.count / this.maxCount);
      const [r, g, b] = TYPE_CONFIG[p.event_type].color;

      const grad = this.ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, radius);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${0.85 * intensity})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.4  * intensity})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

      this.ctx.beginPath();
      this.ctx.fillStyle = grad;
      this.ctx.arc(px.x, px.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export function MapPage() {
  const mapDivRef    = useRef<HTMLDivElement>(null);
  const leafletRef   = useRef<L.Map | null>(null);
  const overlayRef   = useRef<HeatmapOverlay | null>(null);

  const [points,      setPoints]      = useState<HeatmapPoint[]>([]);
  const [season,      setSeason]      = useState<{ id: number; name: string } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set(['kill', 'death', 'base']));

  const counts = {
    kill:  points.filter(p => p.event_type === 'kill').reduce((s, p) => s + p.count, 0),
    death: points.filter(p => p.event_type === 'death').reduce((s, p) => s + p.count, 0),
    base:  points.filter(p => p.event_type === 'base').reduce((s, p) => s + p.count, 0),
  };

  // Init Leaflet
  useEffect(() => {
    if (!mapDivRef.current || leafletRef.current) return;

    const map = L.map(mapDivRef.current, {
      crs:             L.CRS.Simple,
      minZoom:         -4,
      maxZoom:         2,
      zoomSnap:        0.5,
      attributionControl: false,
    });

    // Dark background placeholder — replace with actual PZ map image
    // when asset is available: L.imageOverlay('/assets/pz-map.jpg', MAP_BOUNDS).addTo(map)
    L.rectangle(MAP_BOUNDS as L.LatLngBoundsExpression, {
      color:       '#2a3a2a',
      fillColor:   '#0e1a0e',
      fillOpacity: 1,
      weight:      1,
    }).addTo(map);

    // Subtle grid lines every 10 cells (~1000 squares = ~1 km)
    for (let x = 0; x <= 210; x += 10) {
      L.polyline([[0, x], [120, x]] as L.LatLngExpression[], { color: '#1e2e1e', weight: 0.5, opacity: 0.6 }).addTo(map);
    }
    for (let y = 0; y <= 120; y += 10) {
      L.polyline([[y, 0], [y, 210]] as L.LatLngExpression[], { color: '#1e2e1e', weight: 0.5, opacity: 0.6 }).addTo(map);
    }

    map.fitBounds(MAP_BOUNDS);

    const overlay = new HeatmapOverlay(map, new Set(['kill', 'death', 'base']));
    leafletRef.current  = map;
    overlayRef.current  = overlay;

    return () => {
      overlay.remove();
      map.remove();
      leafletRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  // Load data
  useEffect(() => {
    setLoading(true);
    apiGetHeatmap()
      .then(({ points: p, season: s }) => { setPoints(p); setSeason(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Push data to overlay when ready
  useEffect(() => {
    overlayRef.current?.setData(points);
  }, [points]);

  // Toggle event type
  const toggleType = useCallback((type: EventType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      overlayRef.current?.setActiveTypes(next);
      return next;
    });
  }, []);

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="map-title-row">
          <h1 className="map-title"><i className="ti ti-map-2" /> Mapa de Calor</h1>
          {season && <span className="map-season-badge">{season.name}</span>}
        </div>
        <p className="map-subtitle">Concentração de atividade dos sobreviventes durante a temporada ativa.</p>

        <div className="map-filters">
          {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([type, cfg]) => (
            <button
              key={type}
              className={`map-filter-btn map-filter-${type}${activeTypes.has(type) ? ' active' : ''}`}
              onClick={() => toggleType(type)}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="map-filter-count">{counts[type].toLocaleString('pt-BR')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="map-container">
        {loading && (
          <div className="map-loading">
            <i className="ti ti-loader-2" /> Carregando mapa...
          </div>
        )}
        {!loading && points.length === 0 && (
          <div className="map-empty">
            <i className="ti ti-map-off" />
            <p>Nenhum dado de mapa disponível ainda.<br />Os dados começam a aparecer após o próximo sync dos jogadores.</p>
          </div>
        )}
        <div ref={mapDivRef} className="map-leaflet" />
      </div>

      <div className="map-legend">
        <span className="map-legend-title">Intensidade</span>
        <div className="map-legend-bar" />
        <span className="map-legend-low">pouca</span>
        <span className="map-legend-high">muita</span>
        <span className="map-legend-note">Cada célula = 100×100 blocos do jogo</span>
      </div>
    </div>
  );
}
