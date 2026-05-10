import React from 'react';
import OrderDetailsClient from './OrderDetailsClient';
import { notFound } from 'next/navigation';
import { getSalesRecordById } from '@/modules/finance/services/sales-record.service';

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getSalesRecordById(orderId);
  if (!order) return notFound();
  const { raw, ...record } = order;
  return <OrderDetailsClient order={record as any} />;
}
