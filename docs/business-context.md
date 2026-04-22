# Nutricare CRM — Business Context

## Business domain
Nutricare (branded as "Nuycle") sells nutrition and wellness products across Nigerian states through a network of sales agents and delivery agents. Products include: Prosxact, Shred Belly, Trim & Tone, Fonio-Mill, Neuro-Vive Balm, After-Natal, Vitorep, Linix, and Balm. Orders are placed by sales reps on behalf of customers, fulfilled through warehouses, and delivered by agents/drivers. The system tracks full financial flows including agent settlements, remittances, expenses, and inventory valuation.

## Currency
All money is in Nigerian Naira (₦ / NGN).

## Order lifecycle
Order In → Confirm Stock → Pick & Pack → Dispatch → Delivered

## User roles
ADMIN, SALES_REP, DELIVERY_AGENT, DATA_ANALYST, ACCOUNTANT, INVENTORY_MANAGER, WAREHOUSE_MANAGER, LOGISTICS_MANAGER

---

## SALES REP MODULE

### Sidebar navigation
Order, Analytics, History

### Order list view
- Status tabs: All (with count badge), Pending, Confirmed, Delivered, Cancelled, Failed
- Filters: Date, sort toggle
- Status filter pills: Pending, Confirmed, Delivered, Cancelled, Failed
- Search bar
- Table columns: G-Mail (customer email), Name (customer name), Agent (agent name + state), Product, Quantity, Date
- Color-coded status dots per order row (yellow=pending, green=delivered, red=failed, orange=confirmed)

### Add Order form (modal/popup)
- Customer name, phone number, WhatsApp number
- Email (optional), full delivery address, state (dropdown), LGA, landmark
- Source (lead source / how they heard about product)
- Product section: product (dropdown), quantity (dropdown)
- "+ Add Product" button for multiple line items
- "Add Order" submit button

---

## INVENTORY MANAGER MODULE

### Sidebar navigation
Dashboard, Stock, Incoming Stock, Outgoing Stock, Returned Stock, Stock Transfer, Stock Left in Office, Stock Left with Agent, Stock Adjustment, Notification, Settings

### Dashboard
- Order lifecycle stepper: Order in → Confirm stock → Pick & Pack → Dispatch → Delivered
- Stats cards: Total SKUs (active count), Low Stock Alerts (reorder count), Expiring 7 Days (review count), Open POs (pending count)
- Stock Levels table: category code, product name, quantity, minimum level, status (OK / Low / Watch)
- "Full Report" link
- Stock Movement chart (7 days): Received count, Dispatched count, Net count — bar chart by day of week
- Reorder & Purchase Orders table: PO#, supplier, items/product, time, status (In Transit / Pending)
- "+ New PO" button
- Alerts section: reorder alerts, expiry warnings, audit schedule alerts (with timestamps)

### Stock page (5 tabs)

#### Agents tab
- Table columns: ID, Company/Agent Name, States, Address, Phone Numbers (multiple), Status (Active), Review, Added By, Action (Created)
- Search, Add New, Excel export, Edit buttons
- Pagination

#### Add Agent form
- Company/Agent name, address, status (dropdown)
- Phone 1 (must be unique), Phone 2, Phone 3
- Does this agent pick product from office stock? (dropdown yes/no)
- Select country (dropdown), select states covered by agent

#### Suppliers tab
- Table with supplier entries

#### Add Supplier form
- Supplier's name, supplier's phone number (must be unique)
- Supplier's phone number 2, state
- Supplier's address (dropdown), select country (dropdown)

#### Product tab
- Product listing table

#### Add Product form
- Paste Form Link Here (URL field)
- Country to sell this product (dropdown), product description, product category (dropdown)
- Product name (dropdown), does this product have variations? (yes/no dropdown), do you have an offer? (yes/no dropdown)
- Text to show (display text), link to file download for successful delivery (URL — appears on invoice email)
- Low Stock Alert Quantity (Agents) *, Low Stock Alert Quantity (Total) *, Email(s) to receive low stock alert (comma separated) *
- Cost Price (1 Unit) — how much YOU are buying from supplier/manufacturer
- Offer section: Offer Name, Offer Quantity (Piece/Unit/Pack/Bottle), Recurring (dropdown), Offer Unit, Selling Price, Show Quantity & Unit (dropdown)
- Combo products: up to 6 combo products, each with product (dropdown) + quantity
- Free gift products: up to 6 free gift products, each with product (dropdown) + quantity
- "Add more" button

#### Product Categories tab

#### Add Product Categories form
- Category Name
- Brand Name (shown on invoices) — all products under this category carry this brand name
- Brand Phone Number (shown on invoices)
- Brand Business WhatsApp Number — for automatic messaging
- Brand Email (shown on invoices)
- SMS Sender ID — used for SMS to customers

#### Warehouse tab

#### Add Warehouse form
- Warehouse name, warehouse address
- Warehouse phone number, warehouse email
- More information (dropdown), select country (dropdown)
- Warehouse manager's name, warehouse manager's telephone, warehouse manager's email

### Stock Transfer page
- Filter and sort controls
- Stock Transfer Voucher form:
  - Source Warehouse/Agent * (dropdown)
  - Target Warehouse/Agent * (dropdown)
  - Date *
  - Transfer Reference * (dropdown)
  - Notes text area
  - Save Draft / Submit buttons

---

## WAREHOUSE MANAGER MODULE

### Sidebar navigation
Dashboard, Pick & Pack (with badge count), Location Mgmt, Incoming Goods, Outgoing, Returns (with badge count)

### Dashboard
- Order lifecycle stepper (same as inventory)
- Stats cards: Orders to Pick (Queued), In Packing (Active), Ready for Dispatch (Ready), Damage Reports (Open)
- Pick & Pack Queue table: Order ID, Items count, Picker (user name), Location (shelf code like A3-B2, B1-C4), Status (Packing / Packed / Queued)
- "Assign Picker" button
- Location Map panel (Zone A & B): shelf occupancy grid showing slots A1-A6, B1-B6, C1-C6, D1-D6
  - Occupancy statuses: Full (green), Partial (orange), Reserved (red), Empty (purple/light), Damage (gray)
- Goods Receiving table: INC ID, Units, Supplier, QC status (Pending/Passed), Status (QC Check / Shelved)
- "+ Incoming Goods" button
- Alerts: damage flags, overdue picks, QC requirements

### Incoming Goods list
- Filter, Add New, sort, search
- Table columns: Date, SI-ID, Supplier, Warehouse, Supplier Ref, Product, Status (Recorded / Draft), Created Time, Added By, Action (Created)
- Pagination, Back button

### Stock In Voucher (Incoming Goods form)
- Warehouse * (dropdown), Supplier (dropdown), Supplier Reference (text), Date * (date picker)
- Product line items table: #, Product (search dropdown), Product Code, Quantity
- Notes text area
- Save as Draft / Submit buttons

### Outgoing Stock list
- Filter, Add New, sort, search
- Bulk action dropdown with Go button
- Table columns: ID, Date, Product Name, State, Agent (clickable link), Other Info (phone), QTY Sent, Status (Received / Not Received), Added By
- Search, pagination, Back button

### Stock Out Voucher (Outgoing form)
- State * (dropdown), Country * (dropdown), Date * (date picker), Product * (dropdown)
- Checkbox: "Are you sending this product from one Agent to another Agent?"
- Supplier Reference, To Agent (dropdown), Quantity to Send
- "+ Add Bulks" option
- Notes text area
- Cancel / Submit buttons

### Returned Stock list
- Filter, Add New, sort, search
- Bulk action dropdown with Go button
- Table columns: ID, Date, Product Name, State, Agent/Warehouse, Qty Returned, Damaged (Yes/No), Remarks, Added By
- Search, pagination, Back button

### Returned Stock Voucher form
- State *, Country *, Date *, Product * (all dropdowns/date pickers)
- Damaged checkbox
- Quantity, Agent/Warehouse (dropdown), Remarks
- Notes text area
- Cancel / Submit buttons

---

## LOGISTICS MANAGER MODULE

### Sidebar navigation
Dashboard, Deliveries (with badge count), Dispatch, Live Tracking, Route Planner, Returns (with badge count), Agents/Drivers, Orders (with badge count)

### Dashboard
- Order lifecycle stepper (same)
- Stats cards: Pending Dispatch (Awaiting), In Transit (Live count), Delivered Today (On Track), Failed/Returns (Action Needed)
- Delivery Queue table: Order ID, Customer, Driver, Time, Status (In Transit / Pending / Delivered / Failed)
- "+ Dispatch" button
- Driver Assignments table: Driver, Vehicle (e.g. Truck A3, Van B1), Stops count (e.g. 6/8), Load bar (visual progress)
- "+ Manage" button
- Route Queue panel: route info (Route A3 - 6 stops - 42km - click to open), Zone buttons (Zone A, Zone B, Zone C)
- "Optimise" button
- Alerts: delivery failures (customer not home), delays (traffic), unassigned orders

---

## ACCOUNTANT MODULE

### Sidebar navigation
Dashboard, Sales Record, Agent Settlement, Inventory, Expenses & Purchases, Accounting, Reports

### Dashboard
- Financial Summary cards: Total Revenue (with period dropdown + % vs last month), Net Profit (highlighted), Total Expenses, Delivery Expenses, Tax Payable (percentage)
- Inventory Snapshot: Total Inventory Value (₦ + product count), then per-product cards showing value + count for each product (Prosxact, Shred Belly, Linix, Neuro-Vive Balm, After-Natal, Fonio-Mill, Vitorep)
- Stock with Agents (count + products across N delivery agents), Stock in Warehouse (count + products across N warehouses)
- Sales chart: yearly view with daily/weekly/monthly toggle, line chart
- Agent Settlement summary: Total Pending Remittance (₦), Total Overpayments (count), Company Owing Agents (₦), Top Performing Agent (name + location)
- Activity charts: Sales by Product (bar chart), Sales by State (bar chart) — both with period dropdown

### Sales Record
- Filters: Product, State, Agent, Payment Status, Date Range dropdowns
- Search bar
- Table columns: Order ID (with color status badge), Customer, State, Product(s), Qty (packs), Total (₦), Discount (₦ + percentage), Net Amount (₦), Delivery Fee (₦), Rem. Status (Paid / Pending / Not Paid), Agent, Date

### Agent Settlement (4 tabs)

#### Agent List tab
- Filters: State, Agent Type, Payment Status, Date Range
- Search bar
- Table columns: Agent Name, State, Total Sales Value (₦), Del. Fees Earned (₦), Total Remitted (₦), Balance (₦), Overpayment (₦), Underpayment (₦), Date

#### Agent Ledger tab
- Per-agent ledger with date, reference type (Remittance / Delivery Fee / Adjustment), reference ID, debit, credit, running balance

#### Remittance Entry tab
- Form for recording agent remittances

#### Settlement Adjustment tab
- Agent Name (dropdown), Date (date picker)
- Adjustment Type (dropdown: Payment / OverPayment / Correction), Linked Reference ID
- Payment Type (dropdown: WayBill / etc.), Amount (₦)
- Note text area with Save button
- Right panel shows: Referenced remittance ID, agent name, date, orders covered (list of order IDs with "Add Order" button), Amount Remitted, Auto Running Balance
- Continue button
- Recent Remittance table: Date, Reference ID, Amount, Running Balance
- Adjustment History timeline: entries showing type (Remittance Entry, Payment - Delivery Fee, OverPayment) with reference IDs and dates

### Agent Account Profile
- Tabs: Product List, Inventory Location View, Inventory Transfer
- Agent profile card: avatar, name, role, location, online status, phone, WhatsApp, email, state, "See Full Profile" link
- Sales chart (yearly with daily/weekly/monthly toggle)
- Agent Ledger table: Date, Reference Type, Reference ID, Debit, Credit, Running Balance (with payment status and date range filters)
- Agent Inventory table: same columns plus Amount
- Agent Inventory Transfer History: same ledger format

### Inventory view (Accountant perspective)
- Tabs: Product List, Inventory Location View
- State filter, search
- Warehouse table: rows per warehouse location (Lagos, Owerri, Abuja), columns per product (Prosxact, Neuro-Vive, Trim & Tone, Shred Belly, After-Natal, Vitorep, Fonio-Mill, Linix), Total column, Total row
- Agent table below: same product columns per agent

### Invoice
- Company info header: email, phone, logo
- Add Customer dropdown
- Invoice No., Terms (dropdown), Invoice Date (date picker), Due Date (date picker)
- Product/Service line items table: #, Date, Product/Service (dropdown), Description, Qty, Rate, Amount, VAT (dropdown)
- "Add Product or Service" button
- Totals: Subtotal, Discount (percentage input), Shipping, Invoice Total
- Add Attachment (max 20MB)
- Customization panel (right side): toggle visibility of Logo, Ship To, Invoice No, Invoice Date, Due Date, Discount, Terms — separate toggles for form view and print view
- Save / Review and Send buttons

### Sales Receipt
- Same structure as Invoice (shared template)

### Refund Receipt
- Same structure as Invoice (shared template)

### Expenses & Purchases
- Sub-navigation: New Expense, Expense History, Supplier, Purchase Order, Purchase Order History
- New Expense Entry form:
  - REF number (auto-generated, e.g. EXP 1023)
  - Expense Category (dropdown + "Add New Category" button)
  - Paid From Account (dropdown + "Add New Category" button)
  - Date
  - Amount (₦), Tax (₦)
  - Notes text area
  - Add Attachment (max 20MB)
  - Cancel / Save & Add Another / Save Expense Entry buttons
- "Import Charts of Accounts" button

### Reports
- Sub-navigation: Profit & Loss, Balance Sheet, Cash Flow, Agent Performance, Delivery Expense, Inventory Valuation, Sales by Product, Sales by State, Tax Report, Aging Report
- Default view (Agent Performance):
  - Agent Performance card: percentage + % vs last month, period dropdown
  - Best Agent card (highlighted): name + percentage, period dropdown
  - Best Agent for Last Month: name + location + percentage
  - Sales Report chart: delivered orders (solid line) vs failed orders (dashed line), 7 days / 30 days / 12 months toggle
  - Agent table: avatar, Name, State, Top Product (count), Performance (percentage)

---

## ADMIN MODULE

### Sidebar navigation
Dashboard, Account, Inventory/Product, Order (expandable: Order Assignment), Staff Management (expandable: Sales Rep, Delivery Agent, Manage Account), Forms, History, Notification, Settings

### Dashboard
- Account section: Total Revenue, Net Profit, Total Expenses (all with period dropdown + % vs last month)
- Two sales charts side by side (yearly, daily/weekly/monthly toggle)
- Product Overview: Total Products Sold, Total Order/Customer, Best Selling Product (with last month comparison), Least Selling Product, Most Damaged Product, Remaining Stock — all with period dropdowns
- Growth Chart (bar chart, weekly)
- Sales Overview: Average Orders/Day, Failed Order Rate, Confirmation Rate, Delivery Rate — all percentages with % vs last month
- Inventory Insight: same KPI cards as Sales Overview

### Order Assignment
- Status tabs: All (with count), Pending, Confirmed, Delivered, Cancelled, Failed
- Filters: Date, Product, State, Team dropdowns
- Status filter pills
- Search bar
- Table columns: G-Mail, Name, Agent (with state), Sales Rep, Product, Quantity, Date, select checkbox
- "Re-Assign Order" button (bottom right)

### Re-Assign Order popup
- Select orders, reassign to different agent

### Staff Management — Sales Rep
- Sales rep listing with analytics drill-down per rep

### Sales Rep Analytics (per-rep view)
- Rep name + "Sales Representatives" label
- Stats: Total Products Sold, Total Order/Customer, Best Selling Product — with period dropdowns + % vs last month
- Performance KPIs: General Performance, Upselling Rate, Confirmation Rate, Delivery Rate, Cancellation Rate, Recovery Rate — all percentages
- KPI card (highlighted): percentage + target for the month + % vs last month

### Staff Management — Delivery Agent
- Similar listing and analytics as Sales Rep

### Manage Account
- Filter: Department, Team dropdowns
- "See all Staffs" button
- Account Activation Requests: cards showing photo, name, role, date, Confirm/Reject buttons
- Team Leads section organized by department:
  - Sales: Team Lead 1-4
  - Inventory/Logistics: Team Lead 1-3
  - Accounting: Team Lead 1
  - Data: Team Lead 1
- "View Log in History" button

---

## DATA ANALYST MODULE

### Sidebar navigation
Sales Reps (expandable), Order, Analytics, History, Notification, Settings

### Order view
- Same as Admin order view: status tabs, filters (Date, Product, State, Team), status pills, search
- Table columns: G-Mail, Name, Agent (with state), State, Sales Rep, Product, Quantity, Date

### Analytics
- Tabs: Team Analytics, Sales Analytics
- Team selector dropdown (Team 1, Team 2, etc.)
- Stats: Total Products Sold, Total Order/Customer, Best Selling Product — with period dropdowns
- Performance KPIs: General Performance, Upselling Rate, Confirmation Rate, Delivery Rate, Cancellation Rate, Recovery Rate
- KPI card (highlighted)
- Month selectors (two dropdowns)
- Best Selling Product table: Product, Amount Sold
- Upselling Rate table: Product, No of Upsell
- "Generate Weekly Report" button, "Generate Monthly Report" button

### Sales Rep drill-down (instance view)
- Per-rep view showing their specific orders
- Same order table format with all filters
- Per-rep analytics view with same KPI cards

---

## CROSS-MODULE FEATURES

### Notifications
- Every module sidebar shows Notification link (some with badge counts)
- Needs: recipient user, title, message, type/category, read status, link/reference to entity, timestamp

### Settings
- Every module sidebar shows Settings link
- Needs: system-level configuration (company info, branding, SMS/WhatsApp settings, tax rates)

### Common patterns
- All tables support: search, filter, sort, pagination
- All forms support: validation, save as draft (where applicable), submit
- All dashboards support: period selection (This Month dropdown), % vs last month comparisons
- "Added By" column appears on many tables — tracks which user created the record
- Excel export available on stock tables

---

## KEY BUSINESS RULES

1. A single order can contain multiple products (line items with product + quantity)
2. Products have cost price (buying) and selling price — margin is tracked
3. Products can have offers (buy X get Y), combo products, and free gift products
4. Product categories carry brand identity (name, phone, email, WhatsApp, SMS sender ID) for invoicing
5. Agents are external entities (companies or individuals) — not system users. They have coverage areas (states), multiple phone numbers, and can pick from office stock
6. Agents have financial accounts with running balances — they collect money and remit to the company
7. Agent settlement tracks: total sales value, delivery fees earned, total remitted, balance, overpayment, underpayment
8. Settlement adjustments can be: Payment, OverPayment, or Correction — each linked to a remittance reference
9. Inventory is tracked per warehouse AND per agent — the accountant can view stock distribution across both
10. Stock movements have three types: Incoming (from supplier), Outgoing (to agent/state), Returns (back from agent)
11. Stock can be transferred between warehouses and between agents
12. Warehouse has physical shelf locations with grid codes (A1-D6) and occupancy tracking
13. Pick & Pack is a warehouse workflow: orders are queued → assigned to pickers → packed → dispatched
14. QC (quality check) happens on incoming goods before shelving
15. Delivery is zone-based with route optimization — drivers have vehicles and load capacity
16. Invoices support line items with VAT, discount percentages, shipping, and customizable display fields
17. Expenses are categorized and tracked with tax amounts and attachments
18. Reports cover: P&L, balance sheet, cash flow, agent performance, delivery expense, inventory valuation, sales by product, sales by state, tax report, aging report
19. Admin can confirm/reject new account signup requests
20. Staff are organized into Teams (Team 1, Team 2, etc.) with Team Leads per department
21. KPIs tracked per sales rep: general performance, upselling rate, confirmation rate, delivery rate, cancellation rate, recovery rate — all with monthly targets
22. The system auto-generates reference numbers: ORD-XXXX (orders), PO-XXXX (purchase orders), SI-XXXXXX (stock in), EXP XXXX (expenses), REM-XXXX (remittances), ADJ-XXX (adjustments), DF-XXX (delivery fees)
