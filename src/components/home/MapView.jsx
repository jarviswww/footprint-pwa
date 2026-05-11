import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
import { currentPosition, todayPoints, isFollowingMap } from '../../store/signals';
import { getGapSegments } from '../../services/gapFill';

const osmLayer = () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, minZoom: 12 });
const satelliteLayer = () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, minZoom: 12 });

export function MapView() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineRef = useRef(null);
  const posMarkerRef = useRef(null);
  const gapLinesRef = useRef([]);
  const currentLayerRef = useRef(null);
  const layerTypeRef = useRef('osm');

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([39.9, 116.4], 15);

    currentLayerRef.current = osmLayer().addTo(map);
    map.on('dragstart', () => { isFollowingMap.value = false; });

    mapInstance.current = map;
    polylineRef.current = L.polyline([], {
      color: '#FF8C42',
      weight: 4,
      opacity: 0.8
    }).addTo(map);

    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    const pos = currentPosition.value;
    if (!pos || !mapInstance.current) return;

    if (!posMarkerRef.current) {
      posMarkerRef.current = L.circleMarker([pos.lat, pos.lng], {
        radius: 8,
        fillColor: '#FF8C42',
        fillOpacity: 1,
        color: '#FFFFFF',
        weight: 3
      }).addTo(mapInstance.current);
    } else {
      posMarkerRef.current.setLatLng([pos.lat, pos.lng]);
    }

    if (isFollowingMap.value) {
      mapInstance.current.setView([pos.lat, pos.lng]);
    }
  }, [currentPosition.value]);

  useEffect(() => {
    const points = todayPoints.value;
    if (!polylineRef.current || !mapInstance.current) return;
    const latlngs = points.map(p => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latlngs);

    // Draw gap lines
    gapLinesRef.current.forEach(l => l.remove());
    gapLinesRef.current = [];
    const gaps = getGapSegments();
    gaps.forEach(gap => {
      const line = L.polyline(
        [[gap.from.lat, gap.from.lng], [gap.to.lat, gap.to.lng]],
        { color: '#9CA3AF', weight: 2, dashArray: '8, 8', opacity: 0.6 }
      ).addTo(mapInstance.current);
      gapLinesRef.current.push(line);
    });
  }, [todayPoints.value]);

  const toggleLayer = () => {
    if (!mapInstance.current || !currentLayerRef.current) return;
    mapInstance.current.removeLayer(currentLayerRef.current);
    if (layerTypeRef.current === 'osm') {
      currentLayerRef.current = satelliteLayer().addTo(mapInstance.current);
      layerTypeRef.current = 'satellite';
    } else {
      currentLayerRef.current = osmLayer().addTo(mapInstance.current);
      layerTypeRef.current = 'osm';
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />
      <button onClick={toggleLayer} style={{
        position: 'absolute',
        top: 'calc(120px + env(safe-area-inset-top))',
        right: '16px',
        zIndex: 1000,
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: 'none',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        🗺
      </button>
    </div>
  );
}
