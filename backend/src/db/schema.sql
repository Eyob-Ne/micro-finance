-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'loan_officer', 'cashier')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    national_id VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    dob DATE,
    gender VARCHAR(20),
    kyc_id_url TEXT,
    kyc_photo_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 3. Loan Products Table
CREATE TABLE IF NOT EXISTS loan_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interest_rate NUMERIC NOT NULL,
    calculation_method VARCHAR(20) NOT NULL CHECK (calculation_method IN ('flat', 'declining')),
    term_months INT NOT NULL,
    min_amount NUMERIC NOT NULL,
    max_amount NUMERIC NOT NULL,
    penalty_rate NUMERIC DEFAULT 2.0,
    grace_period_days INT DEFAULT 3,
    is_active BOOLEAN DEFAULT true
);

-- 4. Loans Table
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    product_id UUID REFERENCES loan_products(id) ON DELETE RESTRICT,
    principal NUMERIC NOT NULL,
    interest_amount NUMERIC NOT NULL,
    total_repayable NUMERIC NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'closed')) DEFAULT 'pending',
    applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    disbursed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    applied_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    disbursed_at TIMESTAMP
);

-- 5. Loan Schedules Table
CREATE TABLE IF NOT EXISTS loan_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_no INT NOT NULL,
    due_date DATE NOT NULL,
    principal_due NUMERIC NOT NULL,
    interest_due NUMERIC NOT NULL,
    total_due NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    penalty_accrued NUMERIC DEFAULT 0,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'partial')) DEFAULT 'pending'
);

-- 6. Repayments Table
CREATE TABLE IF NOT EXISTS repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES loan_schedules(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    payment_method VARCHAR(50),
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Savings Accounts Table
CREATE TABLE IF NOT EXISTS savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Savings Transactions Table
CREATE TABLE IF NOT EXISTS savings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES savings_accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount NUMERIC NOT NULL,
    payment_method VARCHAR(50),
    balance_after NUMERIC NOT NULL,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_national_id ON clients(national_id);
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loan_schedules_loan_id ON loan_schedules(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_client_id ON savings_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_account ON savings_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
