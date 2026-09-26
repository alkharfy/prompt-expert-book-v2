import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(url, key);

const migrations = [
    { file: 'supabase_lead_magnet.sql', verifyTable: 'lead_magnet_subscribers' },
    { file: 'supabase_payment_intents.sql', verifyTable: 'payment_intents' },
    { file: 'supabase_email_upgrade_columns.sql', verifyTable: null },
];

const ENDPOINTS = [
    { name: 'pg/query', url: `${url}/pg/query`, body: (sql) => JSON.stringify({ query: sql }) },
    { name: 'rest/v1/rpc/exec_raw_sql', url: `${url}/rest/v1/rpc/exec_raw_sql`, body: (sql) => JSON.stringify({ sql_text: sql }) },
];

async function runSQL(sql, label) {
    console.log(`\n--- Running: ${label} ---`);

    // Split into individual statements for sequential execution
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 5 && !s.startsWith('--'));

    for (const ep of ENDPOINTS) {
        console.log(`  Trying ${ep.name}...`);
        const response = await fetch(ep.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': `Bearer ${key}`,
            },
            body: ep.body(sql),
        });

        if (response.ok) {
            console.log(`  ✅ ${label}: SUCCESS via ${ep.name}`);
            return true;
        }
        const text = await response.text();
        console.log(`  ↳ ${ep.name} returned ${response.status}: ${text.substring(0, 200)}`);
    }

    // Fallback: run statements one by one via PostgREST rpc
    console.log(`  Trying statement-by-statement via rpc...`);
    let allOk = true;
    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        console.log(`  [${i+1}/${statements.length}] ${stmt.substring(0, 60)}...`);
        const res = await fetch(`${url}/rest/v1/rpc/exec_raw_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({ sql_text: stmt }),
        });
        if (!res.ok) {
            const t = await res.text();
            console.log(`    ❌ ${res.status}: ${t.substring(0, 200)}`);
            allOk = false;
        } else {
            console.log(`    ✅ OK`);
        }
    }
    return allOk;
}

async function main() {
    console.log('=== Phase 1 Supabase Migrations ===');
    console.log(`Target: ${url}\n`);

    for (const m of migrations) {
        const sql = readFileSync(m.file, 'utf8');
        const ok = await runSQL(sql, m.file);

        if (ok && m.verifyTable) {
            const { data, error } = await supabase.from(m.verifyTable).select('id').limit(1);
            if (error) {
                console.log(`  ⚠️  Verify ${m.verifyTable}: ${error.message}`);
            } else {
                console.log(`  ✅ Table ${m.verifyTable} exists (${data?.length || 0} rows)`);
            }
        }
    }

    // Verify email_preferences columns
    const { data: ep, error: epErr } = await supabase
        .from('email_preferences')
        .select('upgrade_emails, cart_recovery_emails')
        .limit(1);
    if (epErr) {
        console.log(`\n⚠️  email_preferences columns check: ${epErr.message}`);
    } else {
        console.log(`\n✅ email_preferences columns verified (upgrade_emails, cart_recovery_emails)`);
    }

    console.log('\n=== Done ===');
}

main().catch(console.error);
