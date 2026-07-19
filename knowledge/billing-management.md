# Billing Management - Generic Process Documentation

> **Demo content only.** Sample billing workflows for public demos. Replace with internal documentation in production.

## Overview

Billing Management (BM) handles invoice generation, payment collection, billing cycles, and financial reporting. Triggered when shipments complete or on scheduled billing runs.

---

## Modules

| Module | Purpose |
|--------|---------|
| **billing-api** | Core billing REST API |
| **invoice-service** | Creates and stores invoices |
| **payment-gateway-adapter** | Processes card and ACH payments |
| **billing-scheduler** | Runs periodic billing jobs |
| **erp-export** | Sends invoices to external ERP |
| **reporting-service** | Financial and aging reports |

---

## Billing Trigger Flow

When a shipment is marked **DELIVERED**:

1. Shipment completion event published
2. **billing-api** receives notification
3. Pricing lines aggregated from order and accessorials
4. **invoice-service** generates draft invoice
5. Invoice approved (auto or manual per customer config)
6. Invoice sent to customer and **erp-export**

### Trigger failures

| Failure | Handling |
|---------|----------|
| Billing API unavailable | Retry queue; alert after 3 failures |
| Missing pricing data | Invoice held; operations notified |
| Invoice generation error | Logged; manual correction required |
| ERP export failure | Retry; invoice remains in **PENDING_EXPORT** |

---

## Invoice Generation

### Manual invoice

**Billing → Invoices → Create** — Select customer, line items, tax rules, and due date.

### Invoice templates

Customize logo, footer, payment terms, and line item layout in **Settings → Invoice Templates**.

### Automatic invoicing

Enabled per customer:

- **On shipment complete** — One invoice per shipment
- **Consolidated** — Weekly or monthly rollup
- **Subscription** — Fixed recurring charges

### Invoice corrections

- **Credit memo** — Reverse or partially credit an invoice
- **Reissue** — Cancel incorrect invoice and create corrected copy
- Audit trail retained for all adjustments

---

## Payment Processing

### Supported payment methods

- Credit and debit cards
- ACH / bank transfer
- Wire transfer (manual reconciliation)
- Purchase order / net terms (invoice only, no auto-charge)

### Payment failures

Card declined or ACH rejected → invoice status **PAYMENT_FAILED**. Customer notified; retry according to policy.

### Retry failed payments

Automatic retries: day 1, day 3, day 7 (configurable). Manual retry from invoice detail → **Retry Payment**.

### Payment reconciliation

Nightly job matches gateway settlements to open invoices. Unmatched payments appear in **Reconciliation Exceptions** for finance review.

---

## Billing Cycles

### Setup

Define cycle per customer: frequency (weekly, monthly, quarterly), anchor day, and timezone.

### Proration rules

Mid-cycle plan changes prorate by day count. Formula: `(monthly_rate / days_in_period) × remaining_days`.

### Change billing cycle

Update in customer profile → **Billing Settings**. Takes effect next cycle; current period completes on old schedule.

### Billing reminders

Automated emails: invoice issued, payment due in 7 days, overdue notices at 1, 7, and 14 days past due.

---

## Financial Reports

### Revenue reports

Filter by date range, customer, product line. Export CSV/PDF.

### Tax reports

Summarize tax collected by jurisdiction for filing periods.

### Aging report

Buckets open invoices: current, 1–30, 31–60, 61–90, 90+ days overdue.

### Export financial data

**Reports → Export** — Select report type and format. Scheduled exports supported via billing-scheduler.

---

*Last updated: Demo documentation — replace with internal sources.*
