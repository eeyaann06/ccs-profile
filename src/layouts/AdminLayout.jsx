import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/AdminLayout.css";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="admin-main" style={{ marginLeft: collapsed ? 68 : 260 }}>
        <Header sidebarCollapsed={collapsed} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
