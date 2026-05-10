import { CreateInvoiceClient } from '../create-invoice/CreateInvoiceClient';
import {
  listCustomers,
  listProductsForInvoice,
  nextInvoiceNumber,
} from '@/modules/finance/services/invoices.service';

export default async function SalesReceiptPage() {
  const [customers, products, invoiceNumber] = await Promise.all([
    listCustomers(),
    listProductsForInvoice(),
    nextInvoiceNumber(),
  ]);
  return (
    <CreateInvoiceClient
      title="Sales Receipt"
      invoiceType="SALES_RECEIPT"
      customers={customers}
      products={products.map(p => ({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice) }))}
      invoiceNumber={invoiceNumber}
    />
  );
}
