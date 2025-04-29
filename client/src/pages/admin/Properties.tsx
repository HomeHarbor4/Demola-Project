import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminProperties } from "@/components/admin/AdminProperties";

export default function AdminPropertiesPage() {
  return (
    <AdminLayout>
      <AdminProperties />
    </AdminLayout>
  );
}