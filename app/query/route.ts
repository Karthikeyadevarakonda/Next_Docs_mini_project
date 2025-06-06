import postgres from 'postgres';

// Make sure your environment variable POSTGRES_URL is set correctly
const sql = postgres("postgres://neondb_owner:npg_WVpLK2f3uDtk@ep-dark-sky-a4pp1eel-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require", { ssl: 'require' });

async function listInvoices() {
  const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

  return data;
}

export async function GET() {
  try {
    const invoices = await listInvoices();
    return new Response(JSON.stringify(invoices), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error:error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
