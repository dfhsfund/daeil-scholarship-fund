import { Route, Routes } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import ApplyPage from "./pages/ApplyPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplyPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<ApplyPage />} />
    </Routes>
  );
}
