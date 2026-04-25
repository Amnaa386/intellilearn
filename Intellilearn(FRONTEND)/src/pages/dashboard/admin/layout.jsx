import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

export default function AdminDashboardLayout({
  children,
}) {
  return <MainLayout userRole="admin">{children || <Outlet />}</MainLayout>;
}
