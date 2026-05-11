import { useEffect, useRef } from 'preact/hooks';
import L from 'leaflet';
import { currentPosition, todayPoints, isFollowingMap } from '../../store/signals';

export function MapView() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineRef = useRef(null);
  const posMarkerRef = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([39.9, 116.4], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 12
    }).addTo(map);

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
    if (!polylineRef.current) return;
    const latlngs = points.map(p => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latlngs);
  }, [todayPoints.value]);

  return (
    <div ref={mapRef} style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0
    }} />
  );
}
