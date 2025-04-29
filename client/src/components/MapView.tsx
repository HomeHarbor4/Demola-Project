import { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Property } from "@shared/schema";
import type { LeafletEvent } from 'leaflet';
import { useCurrency } from "@/lib/formatters";

// Fix for leaflet icons
// Using any type assertion to avoid TypeScript errors with _getIconUrl
// This is a workaround for the leaflet icon issue
// @ts-ignore - Ignore TypeScript errors here as this is a known workaround
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
}

export default function MapView({ properties, onPropertyClick }: MapViewProps) {
  const { formatPrice } = useCurrency();
  // Filter properties with valid coordinates
  const validProperties = properties.filter(
    property => property.latitude && property.longitude
  );
  
  // Calculate center of the map based on property coordinates
  const mapCenter = useMemo(() => {
    if (validProperties.length === 0) return [51.505, -0.09] as [number, number]; // Default center
    
    // Calculate the average lat/lng of all properties
    const sumLat = validProperties.reduce((sum, p) => sum + p.latitude!, 0);
    const sumLng = validProperties.reduce((sum, p) => sum + p.longitude!, 0);
    
    return [
      sumLat / validProperties.length, 
      sumLng / validProperties.length
    ] as [number, number];
  }, [validProperties]);

  // Fit map to markers
  const mapRef = useRef<any>(null);
  useEffect(() => {
    if (mapRef.current && validProperties.length > 0) {
      const group = L.featureGroup(
        validProperties.map(p => L.marker([p.latitude!, p.longitude!]))
      );
      mapRef.current.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 15 });
    }
  }, [validProperties]);

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={11} 
      minZoom={2}
      maxZoom={18}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem", zIndex: 0}}
      whenReady={((event: any) => { mapRef.current = event.target; }) as any}
      maxBounds={[[ -90, -180 ], [ 90, 180 ]]} // Prevent repeated maps
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={true}
      />
      
      {validProperties.map(property => (
        <Marker 
          key={property.id}
          position={[property.latitude!, property.longitude!]}
          eventHandlers={{
            click: () => onPropertyClick && onPropertyClick(property)
          }}
        >
          <Popup>
            <div className="p-1 max-w-[250px]">
              <h3 className="font-semibold text-sm">{property.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{formatPrice(property.price)}</p>
              <p className="text-xs text-slate-600">{property.bedrooms} BHK {property.propertyType} | {property.area} sq.ft</p>
              <p className="text-xs text-slate-600 mt-1">{property.address}, {property.city}</p>
              <button 
                className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onPropertyClick && onPropertyClick(property);
                }}
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}