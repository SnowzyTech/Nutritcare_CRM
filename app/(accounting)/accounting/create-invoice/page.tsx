import { CreateInvoiceClient } from './CreateInvoiceClient';
import {
  listCustomers,
  listProductsForInvoice,
  nextInvoiceNumber,
} from '@/modules/finance/services/invoices.service';

export default async function CreateInvoicePage() {
  const [customers, products, invoiceNumber] = await Promise.all([
    listCustomers(),
    listProductsForInvoice(),
    nextInvoiceNumber(),
  ]);
  return (
    <CreateInvoiceClient
      customers={customers}
      products={products.map(p => ({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice) }))}
      invoiceNumber={invoiceNumber}
    />
  );
}
