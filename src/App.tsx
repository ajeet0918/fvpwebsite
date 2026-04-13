import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import { JoinUsPage } from "./pages/JoinUsPage";
import { HomePage } from "./pages/HomePage";
import { OrderInvoicePage } from "./pages/OrderInvoicePage";
import { OrderRequestPage } from "./pages/OrderRequestPage";
import { PortalDashboardPage } from "./pages/PortalDashboardPage";
import { PortalLoginPage } from "./pages/PortalLoginPage";
import { TrackOrderPage } from "./pages/TrackOrderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/join-us" element={<JoinUsPage />} />
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal" element={<PortalDashboardPage />} />
        <Route path="/investor" element={<Navigate to="/join-us?type=investor" replace />} />
        <Route path="/farmer" element={<Navigate to="/join-us?type=farmer" replace />} />
        <Route path="/order-request" element={<OrderRequestPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/invoice/:orderNumber" element={<OrderInvoicePage />} />
        <Route path="/products" element={<Navigate to="/#products" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
