import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type OrderMapProps = {
  address?: string;
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

const warehouse: LatLngExpression = [27.7172, 85.324];
const rider: LatLngExpression = [27.7105, 85.329];
const customer: LatLngExpression = [27.703, 85.335];

const OrderMap = ({ address }: OrderMapProps) => (
  <div className="overflow-hidden rounded-lg border border-zinc-200">
    <MapContainer
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
          Currently on the way
        </Popup>
      </Marker>

      <Marker position={customer} icon={customerIcon}>
        <Popup>
          <strong>Delivery address</strong>
          <br />
          {address || "Customer location"}
        </Popup>
      </Marker>

      <Polyline
        positions={[warehouse, rider, customer]}
        pathOptions={{
          color: "#16a34a",
          weight: 5,
          opacity: 0.8,
        }}
      />
    </MapContainer>
  </div>
);

export default OrderMap;
