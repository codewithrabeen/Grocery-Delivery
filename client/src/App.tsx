import {Toaster} from 'react-hot-toast'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import AppLayout from './pages/AppLayout'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductPage from './pages/ProductPage'
import SearchResults from './pages/SearchResuts'
import FlashDeals from './pages/FlashDeals'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import OrderTracking from './pages/OrderTracking'
import Addresses from './pages/Addresses'
import ProtectedRoute from './components/ProtectedRoute'
import { AppProvider } from './context/AppContext'

const App = () => {
  return (
    <AppProvider>
      <Toaster  position='top-right' toastOptions={{ duration: 3000, style: { backgroundColor: '#1B3022', color: '#FFF', borderRadius: '12px', fontSize: '14px' } }} />

      <Routes>
       { /* Auth pages no navbar/ footer */ }
       <Route path='/login' element={<Login /> } />
        { /* AppLayout with navbar/ footer */ }
        <Route path='/' element={<AppLayout />}>
             <Route index element={<Home />} />
             <Route path="products" element={<Products/>} />
             <Route path="products/:id" element={<ProductPage/>} />
             <Route path="search" element={<SearchResults/>} />
             <Route path="deals" element={<FlashDeals/>} />
             <Route element={<ProtectedRoute/>}>
               <Route path="checkout" element={<Checkout/>} />
               <Route path="orders" element={<MyOrders/>} />
               <Route path="orders/:id" element={<OrderTracking/>} />
               <Route path="addresses" element={<Addresses/>} />
             </Route>
        </Route>

          
      </Routes>
    </AppProvider>
  )
}

export default App
