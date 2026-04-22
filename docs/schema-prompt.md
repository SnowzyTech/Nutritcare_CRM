# Schema Generation Prompt for Claude Code

Paste everything below the line into Claude Code:

---

Read `docs/business-context.md` thoroughly — it contains every data field extracted from all Figma designs across every module (sales rep, inventory manager, warehouse manager, logistics manager, accountant, admin, data analyst). Also read the current `prisma/schema.prisma` to understand the existing User model and UserRole enum.

Design the complete Prisma database schema that supports every screen, table, form, and dashboard described in the business context document. Here are the specific entities and their fields based on what appears in the designs:

## Core entities

**1. User** (extend existing model)
- Keep existing fields (id, name, email, password, role, createdAt, updatedAt)
- Add: phone, whatsappNumber, avatarUrl, isActive (default true), teamId (relation to Team), isTeamLead (default false)
- The role enum already has: ADMIN, SALES_REP, DELIVERY_AGENT, DATA_ANALYST, ACCOUNTANT, INVENTORY_MANAGER, WAREHOUSE_MANAGER, LOGISTICS_MANAGER
- Admin confirms/rejects signups — add an accountActivationStatus field (PENDING, APPROVED, REJECTED) defaulting to PENDING

**2. Team**
- name (e.g. "Team 1", "Team 2"), department (enum: SALES, INVENTORY_LOGISTICS, ACCOUNTING, DATA)
- Teams have multiple users, each team can have a team lead

**3. Customer**
- name, phone, whatsappNumber, email (optional), deliveryAddress, state, lga, landmark, source (lead source)
- Customers can have multiple orders
- softDelete: deletedAt DateTime?

**4. Product**
- name, description, costPrice (Decimal), sellingPrice (Decimal), categoryId (relation)
- country, hasVariations (Boolean), hasOffer (Boolean)
- displayText, fileDownloadLink (for post-delivery email)
- lowStockAlertQtyAgent (Int), lowStockAlertQtyTotal (Int), alertEmails (String — comma separated)
- sku/productCode (unique, auto-generated like CAT-0077)
- isActive (default true), softDelete: deletedAt DateTime?

**5. ProductCategory**
- categoryName, brandName, brandPhone, brandWhatsappNumber, brandEmail, smsSenderId
- Has many products

**6. ProductOffer** (one-to-one or one-to-many with Product)
- productId, offerName, offerQuantity (Int), offerUnit (String — Piece/Unit/Pack/Bottle), recurring (Boolean/String), sellingPrice (Decimal), showQuantityAndUnit (Boolean)

**7. ProductCombo** (many per product)
- productId (the parent product), comboProductId (the linked product), quantity (Int)

**8. ProductGift** (many per product)
- productId (the parent product), giftProductId (the linked product), quantity (Int)

**9. Supplier**
- name, phone1, phone2, state, address, country
- softDelete: deletedAt DateTime?

**10. Agent** (external entities — NOT system users)
- companyName, state, address, phone1, phone2, phone3
- status (enum: ACTIVE, INACTIVE), statesCovered (String or JSON array)
- picksFromOfficeStock (Boolean), country
- reviewStatus, addedById (User who created), softDelete: deletedAt DateTime?

**11. Warehouse**
- name, address, phone, email, country, additionalInfo
- managerName, managerPhone, managerEmail
- Has many WarehouseLocations

**12. WarehouseLocation** (shelf grid system)
- warehouseId, locationCode (String — e.g. "A1", "B3", "D6")
- occupancyStatus (enum: FULL, PARTIAL, RESERVED, EMPTY, DAMAGE)
- zone (String — e.g. "ZONE_A", "ZONE_B")

**13. Order**
- orderNumber (unique, auto-generated like ORD-1001)
- customerId (relation), salesRepId (User relation), agentId (Agent relation, nullable)
- status (enum: PENDING, CONFIRMED, DELIVERED, CANCELLED, FAILED)
- totalAmount, discountAmount, discountPercent, netAmount, deliveryFee (all Decimal)
- notes, date
- Has many OrderItems
- softDelete: deletedAt DateTime?

**14. OrderItem**
- orderId, productId, quantity (Int), unitPrice (Decimal), lineTotal (Decimal)

**15. StockMovement** (covers incoming, outgoing, returns — use type enum)
- referenceNumber (unique, auto-generated — SI-XXXXXX for incoming, etc.)
- type (enum: INCOMING, OUTGOING, RETURN)
- status (enum: DRAFT, RECORDED, RECEIVED, NOT_RECEIVED, QC_CHECK, SHELVED)
- warehouseId (nullable), supplierId (nullable), agentId (nullable)
- supplierReference, date, notes
- state, country
- For returns: damaged (Boolean), remarks, quantity
- For outgoing: quantitySent, isAgentToAgentTransfer (Boolean), toAgentId (nullable)
- createdById (User who created)
- Has many StockMovementItems

**16. StockMovementItem** (line items for stock in vouchers)
- stockMovementId, productId, productCode, quantity (Int)

**17. StockTransfer**
- referenceNumber (unique, auto-generated)
- sourceType (enum: WAREHOUSE, AGENT), sourceId
- targetType (enum: WAREHOUSE, AGENT), targetId
- date, status (enum: DRAFT, SUBMITTED, COMPLETED), notes
- createdById (User)
- Has many StockTransferItems

**18. StockTransferItem**
- stockTransferId, productId, quantity (Int)

**19. PurchaseOrder**
- poNumber (unique, auto-generated like PO-1092)
- supplierId (relation), status (enum: PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
- items/products description, time/date
- createdById (User)

**20. PurchaseOrderItem**
- purchaseOrderId, productId, quantity (Int), unitCost (Decimal)

**21. PickPack** (warehouse workflow)
- orderId (relation), pickerId (User relation, nullable)
- locationCode (String — shelf code like A3-B2)
- itemsCount (Int), status (enum: QUEUED, PACKING, PACKED, DISPATCHED)
- assignedAt, completedAt

**22. GoodsReceiving** (QC tracking for incoming stock)
- stockMovementId (relation to incoming StockMovement)
- incId (unique reference like #SI-4821)
- units (Int), supplierId, qcStatus (enum: PENDING, PASSED, FAILED)
- shelvingStatus (enum: QC_CHECK, SHELVED)

**23. Delivery**
- orderId (relation), driverId (User or Agent relation)
- vehicleId (relation), status (enum: PENDING_DISPATCH, IN_TRANSIT, DELIVERED, FAILED)
- scheduledTime, deliveredTime, zoneId (relation)
- failureReason (nullable)

**24. Vehicle**
- name/identifier (e.g. "Truck A3", "Van B1"), type (enum: TRUCK, VAN, MOTORCYCLE)
- capacity, isAvailable (Boolean)

**25. DeliveryZone**
- name (e.g. "Zone A", "Zone B"), description, coverageArea

**26. Route**
- zoneId (relation), name, stopsCount (Int), distanceKm (Decimal)
- optimizedAt (DateTime nullable)

**27. DamageReport**
- warehouseLocationId (relation), description
- status (enum: OPEN, RESOLVED), reportedById (User), resolvedAt

**28. Invoice**
- invoiceNumber (unique, auto-generated)
- customerId (relation), orderId (nullable relation)
- terms, invoiceDate, dueDate
- subtotal, discountPercent, discountAmount, shipping, invoiceTotal (all Decimal)
- status (enum: DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- attachmentUrl (nullable)
- showLogo, showShipTo, showInvoiceNo, showInvoiceDate, showDueDate, showDiscount, showTerms (all Boolean defaults true — customization toggles)
- type (enum: INVOICE, SALES_RECEIPT, REFUND_RECEIPT)
- createdById (User)
- Has many InvoiceItems

**29. InvoiceItem**
- invoiceId, serviceDate, productId (nullable), description, quantity (Int), rate (Decimal), amount (Decimal), vatRate (Decimal nullable)

**30. AgentSettlement** (tracks agent financial accounts)
- agentId (relation), date
- totalSalesValue, deliveryFeesEarned, totalRemitted, balance, overpayment, underpayment (all Decimal)
- Has many AgentLedgerEntries

**31. AgentLedgerEntry**
- agentId (relation), date
- referenceType (enum: REMITTANCE, DELIVERY_FEE, ADJUSTMENT)
- referenceId (String — e.g. REM-1023, DF-204, ADJ-001)
- debit (Decimal), credit (Decimal), runningBalance (Decimal)

**32. SettlementAdjustment**
- agentId (relation), date
- adjustmentType (enum: PAYMENT, OVERPAYMENT, CORRECTION)
- linkedReferenceId (String), paymentType (String — e.g. WayBill)
- amount (Decimal), note
- ordersJson (JSON — array of linked order IDs)
- amountRemitted (Decimal), autoRunningBalance (Decimal)
- createdById (User)

**33. Expense**
- referenceNumber (unique, auto-generated like EXP 1023)
- expenseCategoryId (relation), paidFromAccountId (relation)
- date, amount (Decimal), tax (Decimal), notes
- attachmentUrl (nullable)
- createdById (User)

**34. ExpenseCategory**
- name (unique)

**35. PaymentAccount** (for "Paid From Account" dropdown)
- name, type, isActive (Boolean default true)

**36. Notification**
- recipientId (User relation), title, message
- type (String — e.g. REORDER_ALERT, DELIVERY_FAILED, QC_REQUIRED, ACCOUNT_REQUEST)
- isRead (Boolean default false), link (nullable — URL or route to related entity)
- entityType (nullable), entityId (nullable)

**37. AuditLog**
- userId (relation), action (String), entityType (String), entityId (String)
- details (JSON — metadata about what changed), ipAddress (nullable)

## Schema rules

- Every model gets `id String @id @default(cuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Use `@@map("snake_case_table_name")` on every model
- Use `Decimal @db.Decimal(10, 2)` for all money fields
- Use `Decimal @db.Decimal(5, 2)` for percentage fields (discount percent, VAT rate, etc.)
- Use proper foreign key relations with `@relation` everywhere — no orphaned models
- Add `@@index` on: all status/type enum fields, all foreign key fields, `createdAt` on high-volume tables (orders, stock_movements, agent_ledger_entries, notifications), email fields, reference number fields
- Use enums for all fixed-value fields listed above
- Add soft delete (`deletedAt DateTime?`) on: Customer, Product, Agent, Supplier, Order
- Preserve the existing User model structure and auth system — extend it, don't break it
- The `createdById` pattern links records to the User who created them (the "Added By" column in designs)
- Reference number fields should be String type (the auto-generation logic will be in the service layer, not the schema)
- Use `@unique` on all reference number fields (orderNumber, invoiceNumber, poNumber, etc.)
- For JSON fields (ordersJson, statesCovered if using JSON), use `Json` type

## Output

1. Write the complete schema to `prisma/schema.prisma`, replacing the current dummy models but keeping the datasource config, generator config, and extending (not replacing) the User model
2. Create `docs/schema-notes.md` explaining:
   - Each model and its purpose
   - Key relationships (which models connect to which)
   - Which module/screen each model supports
   - Which enums exist and their values
   - Any design decisions you made (e.g. why you chose a certain approach for offers/combos)
3. Do NOT run `prisma db push` yet — I want to review the schema first before applying it to the database
