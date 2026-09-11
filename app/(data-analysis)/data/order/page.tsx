import { OrdersClient } from "../_components/OrdersClient";
import { getAllOrders, getDeliveryAgents, getSalesRepsForFilter, getSalesTeams, getProductsForFilter } from "@/modules/data-analysis/services/data-analysis.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getManualOrderProductForms } from "@/modules/orders/services/form-packages.service";
import { auth } from "@/lib/auth/auth";



export default async function OrderPage() {
  const [session, orders, deliveryAgents, salesReps, teams, products, catalog, productForms] =
    await Promise.all([
      auth(),
      getAllOrders(),
      getDeliveryAgents(),
      getSalesRepsForFilter(),
      getSalesTeams(),
      getProductsForFilter(),
      // Catalog + per-form package tiers for the manual "Add Order" modal.
      getActiveProducts(),
      getManualOrderProductForms(),
    ]);

  const catalogProducts = catalog.map((p) => ({ id: p.id, name: p.name }));

  return (
    <OrdersClient
      initialOrders={orders}
      deliveryAgents={deliveryAgents}
      salesReps={salesReps}
      teams={teams}
      products={products}
      catalogProducts={catalogProducts}
      productForms={productForms}
      userName={session?.user?.name ?? null}
    />
  );
}
