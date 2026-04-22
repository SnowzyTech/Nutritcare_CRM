# Schema Notes — Nutricare CRM

## Overview

37 models across 8 domain areas. All models have `id String @id @default(cuid())`, `createdAt`, and `updatedAt`. All monetary fields use `Decimal @db.Decimal(10, 2)`. All percentage fields use `Decimal @db.Decimal(5, 2)`. All tables are mapped to `snake_case` names via `@@map`.

---

## Enums

| Enum | Values | Used By |
|------|--------|---------|
| `UserRole` | ADMIN, SALES_REP, DELIVERY_AGENT, DATA_ANALYST, ACCOUNTANT, INVENTORY_MANAGER, WAREHOUSE_MANAGER, LOGISTICS_MANAGER | User |
| `AccountActivationStatus` | PENDING, APPROVED, REJECTED | User |
| `Department` | SALES, INVENTORY_LOGISTICS, ACCOUNTING, DATA | Team |
| `AgentStatus` | ACTIVE, INACTIVE | Agent |
| `OccupancyStatus` | FULL, PARTIAL, RESERVED, EMPTY, DAMAGE | WarehouseLocation |
| `OrderStatus` | PENDING, CONFIRMED, DELIVERED, CANCELLED, FAILED | Order |
| `StockMovementType` | INCOMING, OUTGOING, RETURN | StockMovement |
| `StockMovementStatus` | DRAFT, RECORDED, RECEIVED, NOT_RECEIVED, QC_CHECK, SHELVED | StockMovement |
| `StockTransferNodeType` | WAREHOUSE, AGENT | StockTransfer (sourceType, targetType) |
| `StockTransferStatus` | DRAFT, SUBMITTED, COMPLETED | StockTransfer |
| `PurchaseOrderStatus` | PENDING, IN_TRANSIT, DELIVERED, CANCELLED | PurchaseOrder |
| `PickPackStatus` | QUEUED, PACKING, PACKED, DISPATCHED | PickPack |
| `QCStatus` | PENDING, PASSED, FAILED | GoodsReceiving |
| `ShelvingStatus` | QC_CHECK, SHELVED | GoodsReceiving |
| `DeliveryStatus` | PENDING_DISPATCH, IN_TRANSIT, DELIVERED, FAILED | Delivery |
| `VehicleType` | TRUCK, VAN, MOTORCYCLE | Vehicle |
| `DamageReportStatus` | OPEN, RESOLVED | DamageReport |
| `InvoiceStatus` | DRAFT, SENT, PAID, OVERDUE, CANCELLED | Invoice |
| `InvoiceType` | INVOICE, SALES_RECEIPT, REFUND_RECEIPT | Invoice |
| `AgentLedgerRefType` | REMITTANCE, DELIVERY_FEE, ADJUSTMENT | AgentLedgerEntry |
| `AdjustmentType` | PAYMENT, OVERPAYMENT, CORRECTION | SettlementAdjustment |

---

## Models

### User
**Purpose:** System accounts for all staff roles.  
**Module:** All modules (auth, admin staff management, per-rep analytics).  
**Key fields:**
- `role` — determines which sidebar/module the user sees
- `accountActivationStatus` — admin must APPROVE before the account can log in (PENDING default)
- `isTeamLead` — flags the team lead without a separate join table
- `teamId` — links user to a Team

**Relations:** belongs to Team; creates Orders (as salesRep), Agents, StockMovements, StockTransfers, PurchaseOrders, PickPacks (as picker), Deliveries (as driver), Invoices, Expenses, SettlementAdjustments, DamageReports; receives Notifications; generates AuditLogs.

---

### Team
**Purpose:** Organises staff into named teams per department (Team 1, Team 2, etc.).  
**Module:** Admin → Manage Account (Team Leads section), Data Analyst → Team Analytics.  
**Key fields:**
- `department` — SALES | INVENTORY_LOGISTICS | ACCOUNTING | DATA
- `name` — "Team 1", "Team 2", etc.

**Relations:** has many Users.

---

### Customer
**Purpose:** End consumers who receive orders. Captured by the sales rep at order creation time.  
**Module:** Sales Rep → Add Order, Accountant → Sales Record, Invoice.  
**Key fields:**
- `state`, `lga`, `landmark` — Nigerian address components
- `source` — lead source (how they heard about the product)
- `deletedAt` — soft delete

**Relations:** has many Orders, many Invoices.

---

### ProductCategory
**Purpose:** Groups products under a brand identity used on invoices and communications.  
**Module:** Inventory Manager → Product Categories tab, Accountant → Invoice.  
**Key fields:**
- `brandName`, `brandPhone`, `brandEmail` — printed on invoices for products in this category
- `brandWhatsappNumber` — used for WhatsApp auto-messaging
- `smsSenderId` — used for SMS to customers

**Relations:** has many Products.

---

### Product
**Purpose:** The central product catalogue. Tracks cost price vs selling price for margin calculation.  
**Module:** Inventory Manager → Product tab, all order/stock screens.  
**Key fields:**
- `sku` — unique product code (e.g. CAT-0077), unique constraint; auto-generated in service layer
- `costPrice` vs `sellingPrice` — margin tracking
- `hasVariations`, `hasOffer` — drives UI branching in the add product form
- `lowStockAlertQtyAgent`, `lowStockAlertQtyTotal`, `alertEmails` — inventory alert configuration
- `fileDownloadLink` — URL included in post-delivery email
- `deletedAt` — soft delete

**Relations:** belongs to ProductCategory; has many ProductOffers, ProductCombos (as parent and as combo product), ProductGifts (as parent and as gift product), OrderItems, StockMovementItems, StockTransferItems, PurchaseOrderItems, InvoiceItems.

---

### ProductOffer
**Purpose:** "Buy X get Y" type offer configuration attached to a product.  
**Module:** Inventory Manager → Add Product form (Offer section).  
**Design decision:** One-to-many (not one-to-one) so that multiple offer configurations can be stored historically or toggled; the service layer enforces which one is active. `offerUnit` is a plain String (Piece/Unit/Pack/Bottle) rather than an enum because the values are user-supplied.

---

### ProductCombo
**Purpose:** Links a parent product to a combo product with a quantity (e.g. "buy Product A, get 2x Product B").  
**Module:** Inventory Manager → Add Product form (Combo section, up to 6 combos).  
**Design decision:** Self-referential through two named relations on Product (`ParentProductCombos` / `ComboProduct`) to distinguish which side is the "bundle" parent vs the included product.

---

### ProductGift
**Purpose:** Same pattern as ProductCombo but for free gift products.  
**Module:** Inventory Manager → Add Product form (Free Gifts section).

---

### Supplier
**Purpose:** Companies/individuals who supply products. Used on purchase orders and stock-in vouchers.  
**Module:** Inventory Manager → Suppliers tab, Accountant → Expenses & Purchases.  
**Key fields:**
- `phone1` — unique constraint (business rule: "must be unique")
- `deletedAt` — soft delete

**Relations:** has many StockMovements, PurchaseOrders, GoodsReceivings.

---

### Agent
**Purpose:** External delivery/distribution agents (companies or individuals) — NOT system users. They hold stock, deliver orders, and remit collected payments.  
**Module:** Inventory Manager → Agents tab, Accountant → Agent Settlement, Logistics Manager → Agents/Drivers.  
**Key fields:**
- `phone1` — unique constraint
- `statesCovered` — `Json` array of Nigerian state names (e.g. `["Lagos","Ogun"]`)
- `picksFromOfficeStock` — whether agent collects from office rather than warehouse
- `reviewStatus` — freeform string, shown in the "Review" column of the agents table
- `addedById` — "Added By" column tracking
- `deletedAt` — soft delete

**Design decision:** Agents are a completely separate model from User. The old `DeliveryAgent` model (which extended User) has been removed because external agents are not system users and have entirely different fields.

**Relations:** added by User; has many Orders, StockMovements (as sender and as receiver for agent-to-agent transfers), Deliveries, AgentSettlements, AgentLedgerEntries, SettlementAdjustments.

---

### Warehouse
**Purpose:** Physical storage locations with manager contact information.  
**Module:** Inventory Manager → Warehouse tab, Warehouse Manager (all screens).

**Relations:** has many WarehouseLocations, StockMovements.

---

### WarehouseLocation
**Purpose:** Individual shelf/slot within a warehouse (grid system A1–D6).  
**Module:** Warehouse Manager → Location Map panel.  
**Key fields:**
- `locationCode` — e.g. "A1", "B3", "D6"
- `zone` — e.g. "ZONE_A", "ZONE_B"
- `occupancyStatus` — drives the color-coded grid (Full=green, Partial=orange, Reserved=red, Empty=purple, Damage=gray)

**Relations:** belongs to Warehouse; has many DamageReports.

---

### Order
**Purpose:** A sales order placed by a sales rep on behalf of a customer.  
**Module:** Sales Rep → Order list, Admin → Order Assignment, Accountant → Sales Record, all dashboards.  
**Key fields:**
- `orderNumber` — unique, auto-generated (ORD-1001 pattern), unique index
- `agentId` — nullable; agent is assigned at or after order confirmation
- `discountAmount`, `discountPercent`, `netAmount`, `deliveryFee` — full financial breakdown
- `deletedAt` — soft delete

**Relations:** belongs to Customer, User (salesRep), Agent; has many OrderItems, PickPacks, Deliveries, Invoices.

---

### OrderItem
**Purpose:** Individual product line within an order.  
**Module:** Order detail views, invoice generation.

**Relations:** belongs to Order (cascade delete), Product.

---

### StockMovement
**Purpose:** Single model covering all three stock movement types: Incoming (from supplier), Outgoing (to agent/state), Return (from agent). Fields are shared across types with nullable fields used only by relevant types.  
**Module:** Warehouse Manager → Incoming Goods, Outgoing, Returns; Inventory Manager → Incoming/Outgoing/Returned Stock.  
**Key fields:**
- `referenceNumber` — unique; SI-XXXXXX for incoming, auto-generated in service layer
- `type` — INCOMING | OUTGOING | RETURN
- `isAgentToAgentTransfer`, `toAgentId` — used only for outgoing agent-to-agent transfers
- `damaged`, `remarks` — used only for returns
- `quantitySent` — used only for outgoing

**Design decision:** A single model rather than three separate models because the shared fields (warehouse, supplier, date, notes, state, country, createdBy, items) are identical across all types. The type enum and nullable type-specific fields keep the model manageable.

**Relations:** belongs to Warehouse, Supplier, Agent (two: as origin agent and as destination agent for transfers), User (createdBy); has many StockMovementItems, GoodsReceivings.

---

### StockMovementItem
**Purpose:** Line items for a stock movement voucher (product + quantity).  
**Module:** Stock In Voucher form (product line items table).

---

### StockTransfer
**Purpose:** Tracks stock transferred between warehouses or between agents.  
**Module:** Inventory Manager → Stock Transfer page.  
**Key fields:**
- `sourceType` / `targetType` — WAREHOUSE | AGENT
- `sourceId` / `targetId` — the ID of the source/target warehouse or agent (polymorphic by convention; Prisma does not support native polymorphic relations)

**Design decision:** `sourceId`/`targetId` are plain String FKs without a Prisma `@relation` because the target model (Warehouse or Agent) varies by `sourceType`/`targetType`. The service layer resolves the correct model. This avoids duplicate nullable FK columns for each possible target type.

---

### StockTransferItem
**Purpose:** Line items for a stock transfer voucher.

---

### PurchaseOrder
**Purpose:** Formal purchase order sent to a supplier for restocking.  
**Module:** Inventory Manager → Reorder & POs table, Accountant → Expenses & Purchases → Purchase Order.  
**Key fields:**
- `poNumber` — unique, auto-generated (PO-1092 pattern)

**Relations:** belongs to Supplier, User (createdBy); has many PurchaseOrderItems.

---

### PurchaseOrderItem
**Purpose:** Line items for a purchase order (product + quantity + unit cost).

---

### PickPack
**Purpose:** Warehouse workflow record for picking and packing an order before dispatch.  
**Module:** Warehouse Manager → Pick & Pack Queue, Dashboard stats.  
**Key fields:**
- `locationCode` — shelf code where items are located (e.g. "A3-B2")
- `itemsCount` — total items to pick
- `pickerId` — nullable until a picker is assigned via "Assign Picker"

**Relations:** belongs to Order, User (picker).

---

### GoodsReceiving
**Purpose:** QC tracking record created when incoming stock arrives at the warehouse.  
**Module:** Warehouse Manager → Goods Receiving table, Incoming Goods list.  
**Key fields:**
- `incId` — unique display ID shown in the UI (e.g. "#SI-4821")
- `qcStatus` — PENDING → PASSED | FAILED
- `shelvingStatus` — QC_CHECK → SHELVED

**Relations:** belongs to StockMovement (the corresponding incoming voucher), Supplier.

---

### Delivery
**Purpose:** Tracks the physical delivery of an order to the customer.  
**Module:** Logistics Manager → Delivery Queue, Dispatch, Live Tracking.  
**Key fields:**
- `driverId` — nullable; references a system User with DELIVERY_AGENT role
- `agentId` — nullable; references an external Agent entity
- `failureReason` — captured when status = FAILED

**Design decision:** Both `driverId` (User) and `agentId` (Agent) are nullable because a delivery can be handled either by an internal system user acting as driver, or by an external agent company. Only one should be set per record.

---

### Vehicle
**Purpose:** Vehicles used for deliveries (Truck A3, Van B1, etc.).  
**Module:** Logistics Manager → Driver Assignments table.

---

### DeliveryZone
**Purpose:** Geographic zones used for route planning (Zone A, Zone B, Zone C).  
**Module:** Logistics Manager → Route Queue panel, Zone buttons.

**Relations:** has many Deliveries, Routes.

---

### Route
**Purpose:** A named delivery route within a zone with stop count and distance.  
**Module:** Logistics Manager → Route Queue panel, "Optimise" button.  
**Key fields:**
- `optimizedAt` — timestamp of last route optimisation

---

### DamageReport
**Purpose:** Flags damage at a specific warehouse shelf location.  
**Module:** Warehouse Manager → Dashboard (Damage Reports stat), Alerts section.  
**Key fields:**
- `status` — OPEN | RESOLVED
- `resolvedAt` — set when status transitions to RESOLVED

---

### Invoice
**Purpose:** Financial document (invoice, sales receipt, or refund receipt) generated for a customer.  
**Module:** Accountant → Invoice, Sales Receipt, Refund Receipt screens.  
**Key fields:**
- `invoiceNumber` — unique, auto-generated
- `type` — INVOICE | SALES_RECEIPT | REFUND_RECEIPT (shared template in UI)
- `showLogo`…`showTerms` — seven Boolean toggles for customising the printed/displayed document
- `orderId` — nullable because an invoice can be standalone (not tied to an order)

---

### InvoiceItem
**Purpose:** Line items for an invoice with optional VAT rate per line.  
**Key fields:**
- `productId` — nullable (service lines may not reference a product)
- `vatRate` — nullable per-line VAT percentage

---

### AgentSettlement
**Purpose:** Periodic financial summary for an agent showing their total sales, remittances, and balance.  
**Module:** Accountant → Agent Settlement → Agent List tab.  
**Key fields:**
- `overpayment`, `underpayment` — computed amounts; both default to 0

**Relations:** belongs to Agent; has many AgentLedgerEntries.

---

### AgentLedgerEntry
**Purpose:** Individual ledger line showing each remittance, delivery fee credit, or adjustment for an agent.  
**Module:** Accountant → Agent Settlement → Agent Ledger tab, Agent Account Profile.  
**Key fields:**
- `referenceType` — REMITTANCE | DELIVERY_FEE | ADJUSTMENT
- `referenceId` — display reference (e.g. REM-1023, DF-204, ADJ-001)
- `debit`, `credit`, `runningBalance` — double-entry style columns
- `settlementId` — optional FK to AgentSettlement to group entries under a settlement period

---

### SettlementAdjustment
**Purpose:** Manual corrections to agent account balances (payments, overpayments, corrections).  
**Module:** Accountant → Agent Settlement → Settlement Adjustment tab.  
**Key fields:**
- `ordersJson` — `Json` array of order IDs linked to this adjustment (shown in the "Orders Covered" list)
- `autoRunningBalance` — system-calculated running balance after this adjustment
- `linkedReferenceId` — the remittance reference this adjustment relates to

---

### Expense
**Purpose:** Business expense entries with category, payment account, and attachment.  
**Module:** Accountant → Expenses & Purchases → New Expense Entry form, Expense History.  
**Key fields:**
- `referenceNumber` — unique, auto-generated (EXP 1023 pattern)
- `tax` — tax amount (in NGN, not a percentage)

---

### ExpenseCategory
**Purpose:** User-defined expense categories (created via "Add New Category" in the expense form).  
**Key fields:**
- `name` — unique constraint

---

### PaymentAccount
**Purpose:** Payment accounts for the "Paid From Account" dropdown on expense forms.  
**Key fields:**
- `type` — freeform string (bank account type, cash, etc.)
- `isActive` — controls visibility in dropdowns

---

### Notification
**Purpose:** In-app notifications for all users with type-based routing and read tracking.  
**Module:** Every module sidebar (Notification link with badge count).  
**Key fields:**
- `type` — String (REORDER_ALERT, DELIVERY_FAILED, QC_REQUIRED, ACCOUNT_REQUEST, etc.) — kept as String rather than enum because notification types may be extended without schema changes
- `link` — optional route to the related entity in the UI
- `entityType`, `entityId` — loose reference to the entity that triggered the notification

---

### AuditLog
**Purpose:** Immutable record of every significant action for compliance and debugging.  
**Module:** Admin → View Log in History.  
**Key fields:**
- `details` — `Json` metadata capturing what changed (before/after values, etc.)
- `ipAddress` — nullable; available when the action comes from a web request

---

## Key Relationships (summary)

```
User ──────────────── Team (many-to-one)
Customer ──────────── Order (one-to-many)
Order ─────────────── OrderItem (one-to-many)
Order ─────────────── User / salesRep (many-to-one)
Order ─────────────── Agent (many-to-one, nullable)
Product ───────────── ProductCategory (many-to-one)
Product ───────────── ProductOffer (one-to-many)
Product ───────────── ProductCombo / ProductGift (self-referential)
StockMovement ─────── StockMovementItem (one-to-many)
StockMovement ─────── GoodsReceiving (one-to-many)
StockTransfer ─────── StockTransferItem (one-to-many)
PurchaseOrder ─────── PurchaseOrderItem (one-to-many)
Warehouse ─────────── WarehouseLocation (one-to-many)
WarehouseLocation ─── DamageReport (one-to-many)
Order ─────────────── PickPack (one-to-many)
Order ─────────────── Delivery (one-to-many)
Delivery ──────────── Vehicle / DeliveryZone (many-to-one)
DeliveryZone ──────── Route (one-to-many)
Invoice ───────────── InvoiceItem (one-to-many)
Agent ─────────────── AgentSettlement (one-to-many)
Agent ─────────────── AgentLedgerEntry (one-to-many)
AgentSettlement ───── AgentLedgerEntry (one-to-many)
Agent ─────────────── SettlementAdjustment (one-to-many)
Expense ───────────── ExpenseCategory / PaymentAccount (many-to-one)
User ──────────────── Notification (one-to-many, as recipient)
User ──────────────── AuditLog (one-to-many)
```

---

## Removed models from initial schema

The initial stub schema had three models that have been replaced:

- **`DeliveryAgent`** — removed. External delivery agents are now the `Agent` model. Internal staff with a delivery role use `UserRole.DELIVERY_AGENT` directly on `User`.
- **`Transaction`** — removed. Financial tracking is now handled by `Invoice`, `AgentSettlement`, `AgentLedgerEntry`, `SettlementAdjustment`, and `Expense`.
- Old **`OrderStatus`** values (`CREATED`, `ASSIGNED`, `COMPLETED`) — replaced with the design-accurate values (`PENDING`, `CONFIRMED`, `DELIVERED`, `CANCELLED`, `FAILED`).

---

## Design decisions

1. **Single `StockMovement` model for all movement types.** Incoming, outgoing, and returns share the same voucher structure (warehouse, supplier, date, line items). Type-specific fields (damaged, quantitySent, isAgentToAgentTransfer) are nullable and only relevant for their respective types. This keeps the service layer for stock history queries simple — one table to query rather than three.

2. **Polymorphic StockTransfer source/target as String + enum.** Prisma has no native polymorphic relations. Rather than adding nullable `sourceWarehouseId` and `sourceAgentId` columns, `sourceId`/`targetId` are plain Strings resolved by the service layer using `sourceType`/`targetType`. This is the idiomatic Prisma pattern for this use case.

3. **Agent is separate from User.** Agents are external business entities (companies/individuals) with coverage areas, multiple phone numbers, and financial ledgers. They are not system users and do not log in. Conflating them with `User` would require too many nullable fields and break auth assumptions.

4. **ProductCombo and ProductGift are separate models with named self-relations.** Prisma requires named relations when a model references itself more than once. Separate models for combos vs gifts also make queries and the UI form logic cleaner.

5. **`Notification.type` is String, not enum.** Notification types are expected to grow as features are added. A String avoids repeated schema migrations when new notification types are introduced.

6. **`AgentLedgerEntry` has an optional `settlementId`.** The spec says AgentSettlement "has many" AgentLedgerEntries. Adding `settlementId` as a nullable FK enables grouping ledger entries by settlement period without requiring all entries to belong to a settlement (entries may be created before a settlement is calculated).

7. **`statesCovered` on Agent is `Json`.** Nigerian state names are a known finite set but storing them as a JSON array avoids a junction table for a simple multi-select. The service layer handles serialisation/deserialisation.
