// backend/src/db/seed_products.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const seedProducts = async () => {
  try {
    console.log("Connecting to database to seed loan products...");

    const products = [
      {
        name: "Standard Business Loan",
        desc: "12-month flat rate loan for small businesses",
        rate: 10,
        method: "flat",
        term: 12,
        min: 1000,
        max: 50000
      },
      {
        name: "Emergency Loan",
        desc: "6-month flat rate quick loan",
        rate: 5,
        method: "flat",
        term: 6,
        min: 500,
        max: 10000
      },
      {
        name: "Declining Balance Loan",
        desc: "24-month loan with declining interest",
        rate: 12,
        method: "declining",
        term: 24,
        min: 5000,
        max: 100000
      }
    ];

    for (const p of products) {
      await pool.query(
        `INSERT INTO loan_products 
        (name, description, interest_rate, calculation_method, term_months, min_amount, max_amount, penalty_rate, grace_period_days) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, 2.0, 3)`,
        [p.name, p.desc, p.rate, p.method, p.term, p.min, p.max]
      );
    }

    console.log("✅ Successfully inserted 3 loan products into the database!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
};

seedProducts();