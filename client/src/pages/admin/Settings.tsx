import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { SettingsManagement } from "../../components/admin/SettingsManagement";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <SettingsManagement />
    </AdminLayout>
  );
}