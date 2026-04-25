'use client';

import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

export default function StudentDashboardLayout({
  children,
}) {
  return <MainLayout userRole="student">{children || <Outlet />}</MainLayout>;
}
