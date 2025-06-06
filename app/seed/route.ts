import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres("postgres://neondb_owner:npg_WVpLK2f3uDtk@ep-dark-sky-a4pp1eel-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require", { ssl: 'require' });

async function seedUsers(sqlClient: typeof sql) {
  await sqlClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sqlClient`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sqlClient`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedInvoices(sqlClient: typeof sql) {
  await sqlClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sqlClient`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sqlClient`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers(sqlClient: typeof sql) {
  await sqlClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sqlClient`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sqlClient`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue(sqlClient: typeof sql) {
  await sqlClient`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sqlClient`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    await sql.begin(async (sqlClient) => {
      await seedUsers(sqlClient);
      await seedCustomers(sqlClient);
      await seedInvoices(sqlClient);
      await seedRevenue(sqlClient);
    });

    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), { status: 200 });
  } catch (error) {
    console.error('Seeding failed:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
