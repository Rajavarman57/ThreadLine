# Everest Textile Mills - Seeded User Accounts

The following test user accounts are provisioned in the system for testing different roles and access tiers.

> [!NOTE]
> Passwords for all accounts are set by the `SEED_PASSWORD` environment variable (default: `Demo@12345`).

---

### Internal Mill Staff Accounts

| Role | Email Address | Access Level & Scope |
| :--- | :--- | :--- |
| **ADMIN** | `admin@everestmills.test` | Full administrative control, master data management, system configuration |
| **STORE** | `store@everestmills.test` | Yarn receipt, inventory balances, stock movements, and goods inwards |
| **SUPERVISOR** | `supervisor@everestmills.test` | Work orders, machine assignments, and shift production logs |
| **QC** | `qc@everestmills.test` | Fabric roll inspection, 4-point defect scoring, QC approvals |
| **ACCOUNTS** | `accounts@everestmills.test` | Invoicing, dispatches, commercial payments, and operational expenses |

---

### External Buyer Portal Accounts

Each buyer account is linked to its respective commercial apparel client:

| Account Email | Commercial Client / Brand Organization |
| :--- | :--- |
| `buyer1@buyers.test` | Raymond Lifestyle Apparel |
| `buyer2@buyers.test` | Arvind Mills Garments Div |
| `buyer3@buyers.test` | Madura Fashion & Brands (Aditya Birla) |
| `buyer4@buyers.test` | Page Industries (Jockey India) |
| `buyer5@buyers.test` | Zodiac Clothing Company |
| `buyer6@buyers.test` | Eastman Exports Global |
