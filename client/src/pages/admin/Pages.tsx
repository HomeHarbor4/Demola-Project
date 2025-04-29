import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PagesManagement } from "@/components/admin/PagesManagement";

export default function PagesPage() {
  return (
    <AdminLayout>
      <PagesManagement />
    </AdminLayout>
  );
}