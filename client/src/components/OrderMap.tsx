import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveLocation, ShippingAddress } from "../types";

type OrderMapProps = {
  shippingAddress: ShippingAddress;
  liveLocation?: LiveLocation | null;
  status?: string;
};

const defaultIcon = L.Icon.Default as typeof L.Icon.Default & {
  prototype: { _getIconUrl?: unknown };
};

delete defaultIcon.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const warehouseIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/679/679720.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const riderIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const customerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const warehouse: LatLngTuple = [27.7172, 85.324];

const toPosition = (lat?: number, lng?: number, fallback: LatLngTuple = warehouse): LatLngTuple => {
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [Number(lat), Number(lng)];
  }

  return fallback;
};

const fallbackRiderPosition = (status: string | undefined, customer: LatLngTuple): LatLngTuple => {
  if (status === "Delivered") return customer;
  if (status === "Placed" || status === "Confirmed" || status === "Packed") return warehouse;

  return [
    warehouse[0] + (customer[0] - warehouse[0]) * 0.58,
    warehouse[1] + (customer[1] - warehouse[1]) * 0.58,
  ];
};

const OrderMap = ({ shippingAddress, liveLocation, status }: OrderMapProps) => {
  const customer = toPosition(shippingAddress.lat, shippingAddress.lng, [27.703, 85.335]);
  const rider = liveLocation
    ? toPosition(liveLocation.lat, liveLocation.lng, fallbackRiderPosition(status, customer))
    : fallbackRiderPosition(status, customer);
  const route: LatLngExpression[] = [warehouse, rider, customer];
  const mapKey = `${rider[0]}-${rider[1]}-${customer[0]}-${customer[1]}`;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <MapContainer
        key={mapKey}
        center={rider}
        zoom={14}
        scrollWheelZoom
        style={{
          height: "450px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={warehouse} icon={warehouseIcon}>
          <Popup>
            <strong>Warehouse</strong>
            <br />
            Order packed here
          </Popup>
        </Marker>

        <Marker position={rider} icon={riderIcon}>
          <Popup>
            <strong>Delivery rider</strong>
            <br />
            {liveLocation?.updatedAt ? `Updated ${new Date(liveLocation.updatedAt).toLocaleTimeString()}` : "Estimated position"}
          </Popup>
        </Marker>

        <Marker position={customer} icon={customerIcon}>
          <Popup>
            <strong>Delivery address</strong>
            <br />
            {shippingAddress.label || "Customer location"}
            <br />
            {shippingAddress.address}
          </Popup>
        </Marker>

        <Polyline
          positions={route}
          pathOptions={{
            color: "#16a34a",
            weight: 5,
            opacity: 0.8,
          }}
        />
      </MapContainer>
    </div>
  );
};

export default OrderMap;
