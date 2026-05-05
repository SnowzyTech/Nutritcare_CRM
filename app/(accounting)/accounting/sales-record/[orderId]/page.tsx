import React from 'react';
import { salesRecordsData } from '@/lib/mock-data/sales-records';
import OrderDetailsClient from './OrderDetailsClient';
import { notFound } from 'next/navigation';

export default async function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const { orderId } = await params;
  const order = salesRecordsData.find(r => r.id === orderId);

  if (!order) {
    return notFound();
  }

  return <OrderDetailsClient order={order} />;
}
