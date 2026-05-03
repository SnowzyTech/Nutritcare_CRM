import React from "react";
import { getStockInWarehouse } from "@/modules/inventory/services/inventory.service";
import { StockInWarehouseClient } from "./stock-in-warehouse-client";

export default async function StockInWarehousePage() {
  const rows = await getStockInWarehouse();
  return <StockInWarehouseClient initialRows={rows} />;
}
