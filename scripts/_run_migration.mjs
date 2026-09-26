import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(url, key);

// Step 1: Create table via fetch to Supabase SQL endpoint
const sql = readFileSync('supabase_user_notes.sql', 'utf8');

async function runMigration() {
    console.log('Running migration...');
    
    // Use the Supabase SQL API (pg-meta)
    const response = await fetch(`${url}/pg/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log('Migration SUCCESS:', JSON.stringify(data).substring(0, 500));
    } else {
        const text = await response.text();
        console.log('pg/query failed:', response.status, text.substring(0, 500));
        
        // Fallback: try individual statements
        console.log('\nTrying individual SQL statements...');
        
        // Split SQL into statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 10 && !s.startsWith('--'));
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
            console.log(stmt.substring(0, 80) + '...');
            
            const res2 = await fetch(`${url}/rest/v1/rpc/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify({ query: stmt })
            });
            console.log(`  Status: ${res2.status}`);
            const t = await res2.text();
            if (t) console.log(`  Response: ${t.substring(0, 200)}`);
        }
    }
    
    // Verify table exists
    const { data, error } = await supabase.from('user_notes').select('id').limit(1);
    if (error) {
        console.log('\n❌ Table still does not exist:', error.message);
    } else {
        console.log('\n✅ Table exists! Records:', data?.length || 0);
    }
}

runMigration().catch(console.error);
