import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import { CheckoutPage } from "./pages/CheckoutPage";
import { JoinUsPage } from "./pages/JoinUsPage";
import { HomePage } from "./pages/HomePage";
import { OrderInvoicePage } from "./pages/OrderInvoicePage";
import { PartnerActivatePage } from "./pages/PartnerActivatePage";
import { PartnerDashboardPage } from "./pages/PartnerDashboardPage";
import { PartnerLoginPage } from "./pages/PartnerLoginPage";
import { PartnerResetPasswordPage } from "./pages/PartnerResetPasswordPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { PortalDashboardPage } from "./pages/PortalDashboardPage";
import { PortalLoginPage } from "./pages/PortalLoginPage";
import { ShopPage } from "./pages/ShopPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/join-us" element={<JoinUsPage />} />
        <Route path="/portal/login" element={<PortalLoginPage />} />
        <Route path="/portal/*" element={<PortalDashboardPage />} />
        <Route path="/partner/login" element={<PartnerLoginPage />} />
        <Route path="/partner/activate" element={<PartnerActivatePage />} />
        <Route path="/partner/reset-password" element={<PartnerResetPasswordPage />} />
        <Route path="/partner" element={<PartnerDashboardPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/investor" element={<Navigate to="/join-us?type=investor" replace />} />
        <Route path="/farmer" element={<Navigate to="/join-us?type=farmer" replace />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:slug" element={<ProductDetailPage />} />
        <Route path="/invoice/:orderNumber" element={<OrderInvoicePage />} />
        <Route path="/order-request" element={<Navigate to="/checkout" replace />} />
        <Route path="/track-order" element={<Navigate to="/portal/login" replace />} />
        <Route path="/products" element={<Navigate to="/shop" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
