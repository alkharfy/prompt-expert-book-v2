const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

// Read the SQL file
const fullSql = fs.readFileSync('supabase_user_notes.sql', 'utf8');

async function runMigration() {
    // Step 1: First, create a helper function via the Supabase Management API
    // We'll use the direct connection approach via fetch
    
    const statements = [
        // CREATE TABLE
        `CREATE TABLE IF NOT EXISTS user_notes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            section_id TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            highlighted_text TEXT,
            text_start_offset INTEGER,
            text_end_offset INTEGER,
            content_block_index INTEGER,
            note_text TEXT,
            highlight_color TEXT DEFAULT 'orange' CHECK (highlight_color IN ('orange','yellow','green','blue','purple')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        // Indexes
        `CREATE INDEX IF NOT EXISTS idx_user_notes_user ON user_notes(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_user_notes_section ON user_notes(user_id, section_id, page_number)`,
        `CREATE INDEX IF NOT EXISTS idx_user_notes_created ON user_notes(created_at DESC)`,
        // RLS
        `ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY`,
        // Policies - use DO block to handle IF NOT EXISTS
        `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_select' AND tablename = 'user_notes') THEN
                CREATE POLICY "user_notes_select" ON user_notes FOR SELECT USING (auth.uid()::text = user_id::text);
            END IF;
        END $$`,
        `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_insert' AND tablename = 'user_notes') THEN
                CREATE POLICY "user_notes_insert" ON user_notes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
            END IF;
        END $$`,
        `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_update' AND tablename = 'user_notes') THEN
                CREATE POLICY "user_notes_update" ON user_notes FOR UPDATE USING (auth.uid()::text = user_id::text);
            END IF;
        END $$`,
        `DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_notes_delete' AND tablename = 'user_notes') THEN
                CREATE POLICY "user_notes_delete" ON user_notes FOR DELETE USING (auth.uid()::text = user_id::text);
            END IF;
        END $$`,
        // Trigger function
        `CREATE OR REPLACE FUNCTION update_user_notes_timestamp()
        RETURNS TRIGGER AS $fn$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $fn$ LANGUAGE plpgsql`,
        // Trigger
        `DROP TRIGGER IF EXISTS trigger_user_notes_updated ON user_notes`,
        `CREATE TRIGGER trigger_user_notes_updated
            BEFORE UPDATE ON user_notes
            FOR EACH ROW
            EXECUTE FUNCTION update_user_notes_timestamp()`,
    ];

    // Try via the Supabase Management API
    console.log('Trying Supabase Management API...');
    
    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
        
        try {
            const res = await fetch(`${url}/rest/v1/rpc/exec_raw_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify({ sql_text: stmt })
            });
            
            const text = await res.text();
            if (res.ok) {
                console.log(`  ✅ [${i + 1}] ${preview}...`);
            } else {
                console.log(`  ❌ [${i + 1}] ${preview}... (${res.status})`);
                if (i === 0) {
                    // First statement failed - RPC doesn't exist
                    console.log('  RPC not available, need to use Supabase Dashboard');
                    console.log('\n📋 Copy and paste this SQL into your Supabase Dashboard SQL Editor:');
                    console.log('   URL: https://supabase.com/dashboard/project/pqqaupbkamtfjweajkjo/sql/new');
                    console.log('\n' + fullSql);
                    return;
                }
            }
        } catch (err) {
            console.log(`  ❌ [${i + 1}] Error: ${err.message}`);
        }
    }
    
    // Verify
    console.log('\nVerifying table...');
    const { data, error } = await supabase.from('user_notes').select('id').limit(1);
    if (error) {
        console.log('❌ Table does not exist:', error.message);
    } else {
        console.log('✅ Table created successfully!');
    }
}

runMigration().catch(console.error);
