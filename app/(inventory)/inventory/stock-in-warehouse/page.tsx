import React from "react";
import { getWarehousesWithStock } from "@/modules/inventory/services/inventory.service";
import { StockInWarehouseClient } from "./stock-in-warehouse-client";

export default async function StockInWarehousePage() {
  const warehouses = await getWarehousesWithStock();
  return <StockInWarehouseClient warehouses={warehouses} />;
}
