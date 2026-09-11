import React from 'react';
import OrderDetailsClient from './OrderDetailsClient';
import { notFound } from 'next/navigation';
import {
  getSalesRecordById,
  getOrderRemittanceInfo,
} from '@/modules/finance/services/sales-record.service';

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const [order, remittance] = await Promise.all([
    getSalesRecordById(orderId),
    getOrderRemittanceInfo(orderId),
  ]);
  if (!order) return notFound();
  return <OrderDetailsClient order={order} remittance={remittance} />;
}
