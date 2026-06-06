import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
const warehouseIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/679/679720.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const riderIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const customerIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const OrderMap = ({ address }) => {
  // Demo coordinates (Kathmandu)
  const warehouse = [27.7172, 85.324];
  const rider = [27.7105, 85.329];
  const customer = [27.703, 85.335];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      <MapContainer
        center={rider}
        zoom={14}
        scrollWheelZoom={true}
        style={{
          height: "450px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Warehouse */}
        <Marker position={warehouse} icon={warehouseIcon}>
          <Popup>
            <strong>Warehouse</strong>
            <br />
            Order packed here
          </Popup>
        </Marker>

        {/* Rider */}
        <Marker position={rider} icon={riderIcon}>
          <Popup>
            <strong>Delivery Rider</strong>
            <br />
            Currently on the way
          </Popup>
        </Marker>

        {/* Customer */}
        <Marker position={customer} icon={customerIcon}>
          <Popup>
            <strong>Delivery Address</strong>
            <br />
            {address || "Customer Location"}
          </Popup>
        </Marker>

        {/* Route */}
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
};

export default OrderMap;