# DMMS API Verification Tests

This document contains instructions and `curl` commands to test the Authentication, User Management, and Client KYC Management endpoints for the Digital Microfinance Management System (DMMS).

Base URL: `http://localhost:5000/api`

---

## 1. Login as Admin

Authenticate using the default seeded system admin credentials.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dmms.com",
    "password": "Admin@123"
  }'
```

**Expected Response (`200 OK`):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
  "user": {
    "id": "13dbe314-5c04-48bb-8265-a5850f01ecba",
    "full_name": "System Admin",
    "email": "admin@dmms.com",
    "role": "admin"
  }
}
```

> **Note:** Copy the `token` from the response and export it for subsequent authenticated requests:
> ```bash
> export TOKEN="<your_jwt_token_here>"
> ```
> *(Or in Windows PowerShell: `$TOKEN = "<your_jwt_token_here>"`)*

---

## 2. Get Profile Using Token

Retrieve the authenticated profile details for the active session.

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (`200 OK`):**
```json
{
  "user": {
    "id": "13dbe314-5c04-48bb-8265-a5850f01ecba",
    "full_name": "System Admin",
    "email": "admin@dmms.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-10-18T13:31:29.317Z"
  }
}
```

---

## 3. Create a New Loan Officer Staff User

As an administrator, create a new staff member with the `loan_officer` role.

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe",
    "email": "jane.doe@dmms.com",
    "password": "Password@123",
    "role": "loan_officer"
  }'
```

**Expected Response (`201 Created`):**
```json
{
  "message": "Staff user created successfully",
  "user": {
    "id": "<new-user-uuid>",
    "full_name": "Jane Doe",
    "email": "jane.doe@dmms.com",
    "role": "loan_officer",
    "is_active": true,
    "created_at": "2026-10-18T13:40:00.000Z"
  }
}
```

---

## 4. Get All Users (Admin Only)

Retrieve a list of all staff accounts. Password hashes are excluded for security.

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Client Management & KYC File Uploads

### A. Create Client with KYC Documents (`multipart/form-data`)

Create a borrower client record, uploading their National ID document and facial photo to Supabase Storage (`kyc-docs` bucket).

```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -F "first_name=John" \
  -F "last_name=Kariuki" \
  -F "national_id=ID-987654321" \
  -F "phone=+254712345678" \
  -F "email=john.kariuki@example.com" \
  -F "address=123 Financial Way, Nairobi" \
  -F "dob=1990-05-15" \
  -F "gender=male" \
  -F "kyc_id=@./test_id.jpg;type=image/jpeg" \
  -F "kyc_photo=@./test_photo.jpg;type=image/jpeg"
```

> **Tip:** If testing without physical image files, you can omit the `-F "kyc_id=..."` flags or create quick dummy test files:
> ```bash
> echo "test id dummy data" > test_id.jpg
> echo "test photo dummy data" > test_photo.jpg
> ```

**Expected Response (`201 Created`):**
```json
{
  "message": "Client created successfully",
  "client": {
    "id": "e4f2b1d3-6c8a-49e0-81f2-7a5d91c28b34",
    "first_name": "John",
    "last_name": "Kariuki",
    "phone": "+254712345678",
    "email": "john.kariuki@example.com",
    "national_id": "ID-987654321",
    "address": "123 Financial Way, Nairobi",
    "dob": "1990-05-15T00:00:00.000Z",
    "gender": "male",
    "kyc_id_url": "https://wpehfapzzrtkrrbertin.supabase.co/storage/v1/object/public/kyc-docs/ID-987654321_kyc_id_1792330000000.jpg",
    "kyc_photo_url": "https://wpehfapzzrtkrrbertin.supabase.co/storage/v1/object/public/kyc-docs/ID-987654321_kyc_photo_1792330000000.jpg",
    "created_by": "13dbe314-5c04-48bb-8265-a5850f01ecba",
    "is_active": true,
    "created_at": "2026-10-18T13:45:00.000Z"
  },
  "savings_account": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "balance": "0",
    "created_at": "2026-10-18T13:45:00.000Z"
  }
}
```

---

### B. List Clients (with Search & Pagination)

Search clients by name, phone, or national ID with pagination.

```bash
# Search with pagination
curl -X GET "http://localhost:5000/api/clients?search=Kariuki&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (`200 OK`):**
```json
{
  "total": 1,
  "limit": 10,
  "offset": 0,
  "page": 1,
  "total_pages": 1,
  "clients": [
    {
      "id": "e4f2b1d3-6c8a-49e0-81f2-7a5d91c28b34",
      "first_name": "John",
      "last_name": "Kariuki",
      "phone": "+254712345678",
      "email": "john.kariuki@example.com",
      "national_id": "ID-987654321",
      "savings_balance": "0",
      "is_active": true
    }
  ]
}
```

---

### C. Get Client by ID (Includes Savings Balance & Active Loans)

Retrieve the complete 360-degree client profile.

```bash
curl -X GET http://localhost:5000/api/clients/<client_id> \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (`200 OK`):**
```json
{
  "client": {
    "id": "<client_id>",
    "first_name": "John",
    "last_name": "Kariuki",
    "national_id": "ID-987654321",
    "phone": "+254712345678",
    "kyc_id_url": "https://...",
    "kyc_photo_url": "https://...",
    "created_by_name": "System Admin"
  },
  "savings_account": {
    "id": "<savings_account_id>",
    "balance": "0",
    "created_at": "..."
  },
  "active_loans": []
}
```

---

### D. Update Client Details

Update client information or replace KYC documents.

```bash
curl -X PUT http://localhost:5000/api/clients/<client_id> \
  -H "Authorization: Bearer $TOKEN" \
  -F "phone=+254799999999" \
  -F "address=456 New Commercial Ave, Nairobi"
```

---

### E. Soft Delete Client

Deactivate a client account.

```bash
curl -X DELETE http://localhost:5000/api/clients/<client_id> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Loan Products Management (Admin)

### A. Create a Flat Rate Loan Product

```bash
curl -X POST http://localhost:5000/api/loans/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Boda Boda SME Loan",
    "description": "Short-term flat interest loan for small transport entrepreneurs",
    "interest_rate": 10,
    "calculation_method": "flat",
    "term_months": 6,
    "min_amount": 10000,
    "max_amount": 100000,
    "penalty_rate": 2.5,
    "grace_period_days": 3
  }'
```

### B. Create a Declining Balance Loan Product

```bash
curl -X POST http://localhost:5000/api/loans/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agribusiness Growth Loan",
    "description": "Medium-term amortized reducing balance loan for farmers",
    "interest_rate": 14,
    "calculation_method": "declining",
    "term_months": 12,
    "min_amount": 50000,
    "max_amount": 500000,
    "penalty_rate": 2.0,
    "grace_period_days": 5
  }'
```

### C. List All Active Loan Products

```bash
curl -X GET http://localhost:5000/api/loans/products \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Loan Lifecycle (Apply, Approve, Disburse)

### A. Apply for a Loan (Loan Officer / Admin)

Apply for a loan on behalf of a registered client with principal amount. Automatically generates all `loan_schedules` records in a DB transaction.

```bash
curl -X POST http://localhost:5000/api/loans/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "<client_id>",
    "product_id": "<product_id>",
    "principal": 50000
  }'
```

**Expected Response (`201 Created`):**
```json
{
  "message": "Loan application submitted and schedule generated successfully",
  "loan": {
    "id": "<loan_id>",
    "client_id": "<client_id>",
    "product_id": "<product_id>",
    "principal": "50000.00",
    "interest_amount": "30000.00",
    "total_repayable": "80000.00",
    "status": "pending",
    "applied_at": "2026-10-18T13:50:00.000Z"
  },
  "schedules": [
    {
      "id": "<schedule_1_id>",
      "installment_no": 1,
      "due_date": "2026-11-18",
      "principal_due": "8333.33",
      "interest_due": "5000.00",
      "total_due": "13333.33",
      "amount_paid": "0",
      "penalty_accrued": "0",
      "status": "pending"
    }
  ]
}
```

### B. Approve Loan (Manager / Admin)

```bash
curl -X PUT http://localhost:5000/api/loans/<loan_id>/approve \
  -H "Authorization: Bearer $TOKEN"
```

### C. Disburse Loan (Cashier / Admin)

```bash
curl -X PUT http://localhost:5000/api/loans/<loan_id>/disburse \
  -H "Authorization: Bearer $TOKEN"
```

### D. Get Loan Details with Schedule & Repayments

```bash
curl -X GET http://localhost:5000/api/loans/<loan_id> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. Repayments & Overdue Management

### A. Record a Repayment (FIFO Allocation)

Records a borrower payment. Payments are automatically allocated to the earliest due schedules first (FIFO). If all schedules reach paid status, the loan is automatically closed.

```bash
curl -X POST http://localhost:5000/api/repayments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": "<loan_id>",
    "amount": 13333.33,
    "payment_method": "mobile_money"
  }'
```

**Expected Response (`201 Created`):**
```json
{
  "message": "Repayment applied successfully.",
  "allocated_amount": 13333.33,
  "unallocated_excess": 0,
  "loan_status": "disbursed",
  "repayments": [
    {
      "id": "<repayment_id>",
      "loan_id": "<loan_id>",
      "schedule_id": "<schedule_1_id>",
      "amount": "13333.33",
      "payment_method": "mobile_money"
    }
  ],
  "updated_schedules": [
    {
      "id": "<schedule_1_id>",
      "installment_no": 1,
      "total_due": "13333.33",
      "amount_paid": "13333.33",
      "status": "paid"
    }
  ]
}
```

### B. Get Overdue Loans List

Retrieve all loans containing overdue installments along with total overdue amount and penalties.

```bash
curl -X GET http://localhost:5000/api/repayments/overdue \
  -H "Authorization: Bearer $TOKEN"
```

### C. Evaluate and Apply Penalties Batch

Audit-logged scheduled utility to evaluate all past-grace-period schedules, accrue penalty rates, and flag schedules as overdue.

```bash
curl -X POST http://localhost:5000/api/repayments/apply-penalties \
  -H "Authorization: Bearer $TOKEN"
```

---

## 9. Savings Management (Deposits & Withdrawals)

### A. Open Savings Account for Client

Open a savings account for an active client (if one does not already exist).

```bash
curl -X POST http://localhost:5000/api/savings/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "<client_id>"
  }'
```

### B. Make a Savings Deposit

Performs an atomic transaction crediting the client's account balance and recording a deposit transaction.

```bash
curl -X POST http://localhost:5000/api/savings/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "<savings_account_id>",
    "amount": 5000,
    "payment_method": "mobile_money"
  }'
```

**Expected Response (`200 OK`):**
```json
{
  "message": "Deposit completed successfully",
  "account": {
    "id": "<savings_account_id>",
    "client_id": "<client_id>",
    "balance": "5000.00"
  },
  "transaction": {
    "id": "<transaction_id>",
    "account_id": "<savings_account_id>",
    "type": "deposit",
    "amount": "5000.00",
    "balance_after": "5000.00",
    "payment_method": "mobile_money"
  }
}
```

### C. Make a Savings Withdrawal

Performs an atomic transaction validating sufficient funds, debiting the balance, and recording a withdrawal transaction.

```bash
curl -X POST http://localhost:5000/api/savings/withdraw \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "<savings_account_id>",
    "amount": 1500,
    "payment_method": "cash"
  }'
```

**Expected Response (`200 OK`):**
```json
{
  "message": "Withdrawal completed successfully",
  "account": {
    "id": "<savings_account_id>",
    "balance": "3500.00"
  },
  "transaction": {
    "id": "<transaction_id>",
    "type": "withdrawal",
    "amount": "1500.00",
    "balance_after": "3500.00"
  }
}
```

### D. Get Client Savings Profile & Transactions

```bash
curl -X GET http://localhost:5000/api/savings/client/<client_id> \
  -H "Authorization: Bearer $TOKEN"
```

### E. Get Paginated Transaction History

```bash
curl -X GET "http://localhost:5000/api/savings/transactions/<account_id>?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Executive Reports & Analytics

### A. Executive Dashboard KPI Stats

Returns high-level microfinance metrics: active loans count, total disbursed amount, overdue portfolio value, and total savings under management.

```bash
curl -X GET http://localhost:5000/api/reports/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (`200 OK`):**
```json
{
  "total_disbursed_amount": 50000.00,
  "active_loans_count": 1,
  "total_loans_count": 1,
  "total_overdue_amount": 0.00,
  "overdue_loans_count": 0,
  "total_savings_balance": 3500.00,
  "total_savings_accounts": 1,
  "total_clients": 1,
  "active_clients": 1,
  "total_repayments_collected": 13333.33
}
```

### B. Loan Portfolio Distribution Report

```bash
curl -X GET http://localhost:5000/api/reports/portfolio \
  -H "Authorization: Bearer $TOKEN"
```

### C. Repayment Schedule Intelligence (Upcoming & Overdue)

```bash
curl -X GET http://localhost:5000/api/reports/schedule \
  -H "Authorization: Bearer $TOKEN"
```

### D. Cash Collection Performance (Daily Trend & Methods)

```bash
curl -X GET http://localhost:5000/api/reports/collections \
  -H "Authorization: Bearer $TOKEN"
```

### E. Loan Officer Performance & Origination Metrics

```bash
curl -X GET http://localhost:5000/api/reports/officer-performance \
  -H "Authorization: Bearer $TOKEN"
```
