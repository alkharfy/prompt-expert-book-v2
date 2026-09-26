const { readFileSync } = require('fs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

async function run() {
  const migration = readFileSync('supabase_learning_plan.sql', 'utf8');

  // Attempt 1: Try the /pg/query endpoint (pg-meta)
  console.log('Attempt 1: /pg/query endpoint...');
  const res1 = await fetch(`${url}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ query: migration })
  });
  
  if (res1.ok) {
    console.log('✅ Migration succeeded via /pg/query!');
    await verify();
    return;
  }
  console.log(`  /pg/query: ${res1.status}`);

  // Attempt 2: Try /rest/v1/rpc/exec_raw_sql
  console.log('\nAttempt 2: /rest/v1/rpc/exec_raw_sql...');
  const res2 = await fetch(`${url}/rest/v1/rpc/exec_raw_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ sql_text: migration })
  });
  
  if (res2.ok) {
    console.log('✅ Migration succeeded via exec_raw_sql!');
    await verify();
    return;
  }
  console.log(`  exec_raw_sql: ${res2.status}`);

  // Attempt 3: Direct connection with postgres.js using different host formats
  console.log('\nAttempt 3: Direct postgres connection...');
  const postgres = (await import('postgres')).default;
  
  // Optional direct connection fallback; keep credentials in the environment.
  const databaseUrl = process.env.SUPABASE_DB_URL;
  const connectionStrings = databaseUrl ? [databaseUrl] : [];
  if (!databaseUrl) {
    console.log('Skipping direct postgres connection: SUPABASE_DB_URL is not configured.');
  }

  for (const connStr of connectionStrings) {
    const maskedUrl = new URL(connStr);
    if (maskedUrl.password) maskedUrl.password = '***';
    const masked = maskedUrl.toString();
    console.log(`\n  Trying: ${masked}`);
    
    const sql = postgres(connStr, {
      ssl: 'require',
      prepare: false,
      connect_timeout: 15,
      idle_timeout: 10,
    });
    
    try {
      const test = await sql`SELECT 1 as ok`;
      console.log('  ✅ Connected!');
      
      // Run migration
      await sql.unsafe(migration);
      console.log('  ✅ Migration executed!');
      
      // Verify
      const r1 = await sql`SELECT count(*) FROM information_schema.tables WHERE table_name = 'learning_plan_tasks'`;
      console.log('  learning_plan_tasks:', r1[0].count > 0 ? 'EXISTS ✅' : 'MISSING ❌');
      const r2 = await sql`SELECT count(*) FROM information_schema.tables WHERE table_name = 'learning_plan_summary'`;
      console.log('  learning_plan_summary:', r2[0].count > 0 ? 'EXISTS ✅' : 'MISSING ❌');
      
      await sql.end();
      return;
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}`);
      try { await sql.end(); } catch(_) {}
    }
  }

  // All attempts failed — show manual instructions
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  All automated migration attempts failed.');
  console.log('Please run the SQL manually in the Supabase Dashboard:');
  console.log('  URL: https://supabase.com/dashboard/project/pqqaupbkamtfjweajkjo/sql/new');
  console.log('='.repeat(70));
  console.log('\nSQL to copy:\n');
  console.log(migration);
}

async function verify() {
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(url, key);
  
  const { data: d1, error: e1 } = await sb.from('learning_plan_tasks').select('id').limit(1);
  console.log('learning_plan_tasks:', e1 ? `❌ ${e1.message}` : '✅ EXISTS');
  
  const { data: d2, error: e2 } = await sb.from('learning_plan_summary').select('id').limit(1);
  console.log('learning_plan_summary:', e2 ? `❌ ${e2.message}` : '✅ EXISTS');
}

run().catch(e => console.error(e));
