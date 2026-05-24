Read the current prisma/schema.prisma and make the following changes:

Warehouse model — add a referenceCode field (String, unique) for warehouse reference codes
Product model — add imageUrl field (String, nullable) and quantity field (Int, default 0) for tracking product stock quantity
Agent model — add deliveryFee field (Decimal @db.Decimal(10, 2), nullable) for the delivery fee associated with the agent
User model — add avatarUrl field (String, nullable) for profile pictures, add warehouseId field (String, nullable, relation to Warehouse) for warehouse managers to indicate which warehouse they manage, add teamId field (String, nullable, relation to Team) if not already present
Team model — if it doesn't exist, create it with: id, name (String),
WarehouseLocation model — add currentStock field (Int, default 0) to track how much stock a shelf location currently holds, and maxCapacity field (Int, nullable)
StockMovement model (Incoming type) — add shelfLocationId field (String, nullable, relation to WarehouseLocation), shelfQuantity field (Int, nullable), isReserved field (Boolean, default false), isDamaged field (Boolean, default false)

After making all schema changes, run npx prisma db push to sync with the database. Then briefly list what was added or changed.
