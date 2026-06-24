import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

async function seed() {
  try {
    // Check if admins table exists
    const checkTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admins'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      await query(`
        CREATE TABLE admins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          reset_otp TEXT,
          reset_otp_expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('Created admins table');
    }

    const email = 'admin@stayjazzymultimedia.com';
    const password = 'admin@123';
    const hash = await bcrypt.hash(password, 10);

    const res = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      await query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [email, hash]);
      console.log('Inserted admin user');
    } else {
      await query('UPDATE admins SET password_hash = $2 WHERE email = $1', [email, hash]);
      console.log('Updated admin user password');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
seed();
