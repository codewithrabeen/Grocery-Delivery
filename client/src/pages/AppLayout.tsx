
import { Outlet } from "react-router-dom";
import Banner from "../components/Banner";
import CartSidebar from "../components/CartSidebar";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const AppLayout = () => {
  return (
    <>
      <Banner />
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <CartSidebar />
    </>
  );
};

export default AppLayout;
