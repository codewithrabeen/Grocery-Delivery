import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { PageLoader } from "./components/ui/Skeleton";
import { AppProvider } from "./context/AppContext";
import AppLayout from "./pages/AppLayout";
import Login from "./pages/Login";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const SearchResults = lazy(() => import("./pages/SearchResuts"));
const FlashDeals = lazy(() => import("./pages/FlashDeals"));
const Checkout = lazy(() => import("./pages/Checkout"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <ErrorBoundary>
    <AppProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            backgroundColor: "#1B3022",
            color: "#FFF",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductPage />} />
            <Route path="search" element={<SearchResults />} />
            <Route path="deals" element={<FlashDeals />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />

            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="orders/:id" element={<OrderTracking />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </AppProvider>
  </ErrorBoundary>
);

export default App;
