# Inventory Management - Generic Process Documentation

> **Demo content only.** Sample inventory workflows for public demos. Replace with internal documentation in production.

## Overview

Inventory Management (IM) tracks stock levels, warehouse operations, and replenishment. Integrates with order and shipment systems for pick, pack, and availability checks.

---

## Modules

| Module | Purpose |
|--------|---------|
| **inventory-api** | Stock queries and adjustments |
| **wms-service** | Warehouse management operations |
| **replenishment-engine** | Reorder point and PO suggestions |
| **supplier-portal** | Supplier catalog and lead times |
| **valuation-service** | Inventory cost and valuation reports |

---

## Stock Management

### Track inventory levels

View on-hand, allocated, and available quantities by SKU and warehouse in **Inventory → Stock Levels**. Available = on-hand minus allocated.

### Stock adjustments

**Inventory → Adjustments → New**:

- Reasons: cycle count, damage, shrinkage, correction
- Requires approver role for adjustments above threshold
- Audit log stores user, reason, and before/after quantities

### Low stock alerts

Configure reorder point per SKU-warehouse. Alert fires when available quantity falls at or below reorder point. Notifications via email or dashboard widget.

### Stock valuation

Methods supported: FIFO, weighted average. **valuation-service** runs monthly snapshot for finance. Report under **Inventory → Valuation Report**.

---

## Warehouse Operations

### Warehouse setup

1. **Admin → Warehouses → Add**
2. Define code, address, timezone, and operating hours
3. Create zones and bin locations
4. Assign users and pick paths

### Pick and pack

1. Fulfilment order released to WMS
2. Pick list grouped by zone or wave
3. Picker scans bin and SKU
4. Pack station verifies items and weight
5. Shipment handoff to Shipment Management

### Bin management

Bins have location code (aisle-rack-level). SKUs assigned to primary and overflow bins. Cycle counts can target bin or SKU.

### Transfer orders

Move stock between warehouses:

1. **Inventory → Transfers → Create**
2. Select source and destination warehouse
3. Add line items and quantities
4. Source picks and ships; destination receives and confirms
5. Quantities update on both sides upon confirmation

---

## Replenishment

### Auto replenishment

**replenishment-engine** runs daily (configurable):

1. Compare available stock to reorder point
2. Calculate suggested order quantity (EOQ or min-max)
3. Create draft purchase order for approval

### Reorder points

Set per SKU: reorder point, reorder quantity, and safety stock. Bulk import via CSV template.

### Supplier management

Maintain supplier master: lead time, minimum order quantity, preferred flag. Link SKUs to primary and alternate suppliers.

### Purchase orders

**Procurement → Purchase Orders → Create** — Select supplier, add lines, submit for approval. On receipt, WMS inbound puts stock into available inventory.

---

## Integration with other systems

- **Order Management** — Allocation reserved at order acceptance; released on cancel
- **Shipment Management** — Pick/pack consumes allocated stock
- **Billing** — Optional cost-of-goods for margin reporting

---

*Last updated: Demo documentation — replace with internal sources.*
