import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminUsers } from "@/components/admin/AdminUsers";

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <AdminUsers />
    </AdminLayout>
  );
}