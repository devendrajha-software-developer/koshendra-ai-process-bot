# Shipment Management - Generic Process Documentation

> **Demo content only.** Fictional workflows for public demos. Replace with internal documentation in production.

## Overview

Shipment Management (SM) covers shipment creation, carrier assignment, tracking, delivery confirmation, and returns. Generic module names are used throughout.

---

## Modules

| Module | Purpose |
|--------|---------|
| **shipment-portal** | UI for creating and monitoring shipments |
| **shipment-api** | REST API for shipment operations |
| **carrier-service** | Carrier master data and rate tables |
| **tracking-service** | Ingests carrier tracking events |
| **label-service** | Generates shipping labels and documents |
| **returns-service** | Return authorization and label flow |

---

## Shipment Creation

### How to create a shipment

1. Open **Shipments → Create New**
2. Link to an existing order or enter shipment details manually
3. Select origin warehouse and destination address
4. Choose service level (standard, expedited, overnight)
5. Assign carrier or use **Auto-select**
6. Confirm and generate label

### Requirements

- Valid origin and destination addresses
- At least one line item with weight and dimensions
- Carrier or auto-selection rule configured
- For international: customs description and value

### Multi-item shipments

- Add multiple packages under one shipment header
- Each package can have its own weight and dimensions
- Master tracking number plus child package IDs when supported by carrier

### Shipment labels

Labels generate via **label-service** after carrier assignment. Formats: PDF, ZPL (thermal). Reprint from shipment detail → **Labels** tab.

---

## Fulfilment Flow

```
Order received → Warehouse pick & pack → Shipment created → Label printed → Handed to carrier → Tracking active
```

### Warehouse steps

1. WMS receives fulfilment request
2. Pick list generated for warehouse staff
3. Items packed and scanned
4. Shipment record created in SM
5. Tracking number assigned when carrier accepts

### Common failures

| Issue | Resolution |
|-------|------------|
| Stock missing | Backorder or split shipment |
| Picking delay | Escalate to warehouse supervisor |
| Label failure | Retry or switch carrier |
| Carrier rejection | Reassign carrier |

---

## Carrier Management

### Add a new carrier

1. **Admin → Carriers → Add**
2. Enter carrier code, name, and contact
3. Upload rate table or connect rate API
4. Enable service levels (ground, express, etc.)
5. Test with sample shipment in sandbox

### Carrier selection rules

Rules evaluate in priority order:

1. Customer-specific carrier preference
2. Destination zone and service level
3. Weight and dimension limits
4. Cost optimization (lowest rate)
5. Default fallback carrier

### Rate management

- Import CSV rate cards or sync via carrier API
- Effective dates supported for seasonal rates
- Audit log tracks rate changes

### Carrier performance

Track on-time delivery %, damage rate, and cost per shipment. Reports available under **Analytics → Carrier Scorecard**.

---

## Tracking & Visibility

### Track shipments

Search by tracking number, order ID, or customer reference in **Shipments → Track**.

### Real-time updates

`tracking-service` polls carrier APIs or receives webhooks. Status updates typically every 15–60 minutes depending on carrier.

### Tracking notifications

Configure in **Settings → Notifications**:

- Email or SMS on: shipped, out for delivery, delivered, exception
- Per customer or global defaults

### Delivery confirmation

On delivery, carrier sends POD (proof of delivery). SM status moves to **DELIVERED**. Signature and photo POD stored when available.

---

## Returns Management

### Process a return

1. Customer or agent creates **Return Authorization (RA)**
2. Select original order/shipment and items to return
3. System validates return policy window
4. Return label generated (prepaid or customer-paid)
5. Inbound scan at warehouse triggers refund workflow

### Return policies

Configure per customer or product category: return window (e.g. 30 days), restocking fee, eligible reasons.

### Return labels

Generated from returns-service; same formats as outbound labels. Email link to customer optional.

### Refund processing

After warehouse receives and inspects goods, refund triggers in billing system. Partial refunds supported for partial returns.

---

*Last updated: Demo documentation — replace with internal sources.*
