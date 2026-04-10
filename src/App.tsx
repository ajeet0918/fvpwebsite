import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import { HomePage } from "./pages/HomePage";
import { OrderRequestPage } from "./pages/OrderRequestPage";
import { TrackOrderPage } from "./pages/TrackOrderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/order-request" element={<OrderRequestPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/products" element={<Navigate to="/#products" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
