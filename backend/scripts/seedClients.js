import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { query, pool } from '../src/config/db.js';

const FIRST_NAMES = [
  'Abebe', 'Almaz', 'Bekele', 'Chaltu', 'Dawit', 'Eden', 'Fikru', 'Genet',
  'Haile', 'Hiwot', 'Kassahun', 'Lensa', 'Mulugeta', 'Nebiyu', 'Rahel',
  'Samson', 'Sara', 'Tariku', 'Tigist', 'Yared', 'Yohannes', 'Zenebech',
  'Biruk', 'Desta', 'Ermias', 'Fasika', 'Girma', 'Hanna', 'Kalkidan', 'Marta'
];

const LAST_NAMES = [
  'Bikila', 'Kebede', 'Tadesse', 'Alemu', 'Tesfaye', 'Worku', 'Assefa', 'Girma',
  'Haile', 'Mekonnen', 'Desta', 'Kassa', 'Belay', 'Mengistu', 'Abebe',
  'Negash', 'Berhanu', 'Tefera', 'Demisse', 'Lemma', 'Ayalew', 'Wondimu',
  'Getachew', 'Solomon', 'Ayele', 'Shiferaw', 'Fekadu', 'Kassaye', 'Bogale', 'Yilma'
];

const TOWNS = ['Addis Ababa', 'Hawassa', 'Bahir Dar', 'Adama', 'Dire Dawa', 'Mekelle', 'Gondar', 'Jimma'];

async function seedClients() {
  console.log('Seeding 30 realistic Ethiopian clients for DMMS...');

  try {
    for (let i = 0; i < 30; i++) {
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[i % LAST_NAMES.length];
      const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`;
      const nationalId = `ET-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const address = `${TOWNS[i % TOWNS.length]}, Kebele 0${(i % 9) + 1}`;
      const year = 1975 + (i % 25);
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String((i % 28) + 1).padStart(2, '0');
      const dob = `${year}-${month}-${day}`;
      const gender = i % 2 === 0 ? 'male' : 'female';
      const isActive = i % 7 !== 0; // occasionally create inactive client to test reactivate

      // Check if national_id or email exists
      const checkRes = await query(
        'SELECT id FROM clients WHERE national_id = $1 OR email = $2',
        [nationalId, email]
      );

      if (checkRes.rows.length === 0) {
        const insertRes = await query(
          `INSERT INTO clients (first_name, last_name, phone, email, national_id, address, dob, gender, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           RETURNING id`,
          [firstName, lastName, phone, email, nationalId, address, dob, gender, isActive]
        );

        const clientId = insertRes.rows[0].id;

        // Create an initial savings account with a randomized balance
        const initialBalance = (Math.floor(Math.random() * 40) + 5) * 500;
        await query(
          `INSERT INTO savings_accounts (client_id, balance, created_at)
           VALUES ($1, $2, NOW())`,
          [clientId, initialBalance]
        );
      }
    }

    console.log('Successfully seeded 30 clients and savings accounts.');
  } catch (err) {
    console.error('Failed to seed clients:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedClients();
