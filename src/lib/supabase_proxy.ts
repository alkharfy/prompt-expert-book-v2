/**
 * Server-side Supabase proxy
 * Replaces direct client-side Supabase calls that fail due to REVOKE ALL on anon role.
 * Routes all DB operations through /api/auth/db-operation which uses service_role.
 */

interface Filter {
    op: 'eq' | 'neq' | 'in' | 'gte' | 'lte' | 'gt' | 'lt' | 'like'
    column: string
    value: any
}

interface QueryBuilder {
    select: (fields?: string) => QueryBuilder
    eq: (column: string, value: any) => QueryBuilder
    gte: (column: string, value: any) => QueryBuilder
    lte: (column: string, value: any) => QueryBuilder
    gt: (column: string, value: any) => QueryBuilder
    lt: (column: string, value: any) => QueryBuilder
    like: (column: string, value: any) => QueryBuilder
    neq: (column: string, value: any) => QueryBuilder
    in: (column: string, values: any[]) => QueryBuilder
    order: (column: string, options?: { ascending?: boolean }) => QueryBuilder
    limit: (count: number) => QueryBuilder
    single: () => Promise<{ data: any; error: any }>
    maybeSingle: () => Promise<{ data: any; error: any }>
    then: (resolve: (value: { data: any; error: any }) => void) => void
    insert: (data: any) => InsertBuilder
    update: (data: any) => UpdateBuilder
    delete: () => DeleteBuilder
}

interface InsertBuilder {
    select: () => InsertBuilder
    single: () => Promise<{ data: any; error: any }>
    then: (resolve: (value: { data: any; error: any }) => void) => void
}

interface UpdateBuilder {
    eq: (column: string, value: any) => UpdateBuilder
    select: () => UpdateBuilder
    single: () => Promise<{ data: any; error: any }>
    then: (resolve: (value: { data: any; error: any }) => void) => void
}

interface DeleteBuilder {
    eq: (column: string, value: any) => DeleteBuilder
    then: (resolve: (value: { data: any; error: any }) => void) => void
}

async function callApi(body: any): Promise<{ data: any; error: any }> {
    try {
        const res = await fetch('/api/auth/db-operation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        })
        const result = await res.json()
        if (result.error) {
            return { data: result.data || null, error: { message: result.error, code: result.errorCode || undefined } }
        }
        return { data: result.data, error: null }
    } catch (err: any) {
        return { data: null, error: { message: err.message || 'Network error' } }
    }
}

function createSelectBuilder(table: string): QueryBuilder {
    let _select = '*'
    const _filters: Filter[] = []
    let _single = false
    let _maybeSingle = false
    let _order: { column: string; ascending: boolean } | null = null
    let _limit: number | null = null

    const builder: any = {
        select(fields?: string) {
            if (fields) _select = fields
            return builder
        },
        eq(column: string, value: any) {
            _filters.push({ op: 'eq', column, value })
            return builder
        },
        neq(column: string, value: any) {
            _filters.push({ op: 'neq', column, value })
            return builder
        },
        in(column: string, values: any[]) {
            _filters.push({ op: 'in', column, value: values })
            return builder
        },
        gte(column: string, value: any) {
            _filters.push({ op: 'gte', column, value })
            return builder
        },
        lte(column: string, value: any) {
            _filters.push({ op: 'lte', column, value })
            return builder
        },
        gt(column: string, value: any) {
            _filters.push({ op: 'gt', column, value })
            return builder
        },
        lt(column: string, value: any) {
            _filters.push({ op: 'lt', column, value })
            return builder
        },
        like(column: string, value: any) {
            _filters.push({ op: 'like', column, value })
            return builder
        },
        order(column: string, options?: { ascending?: boolean }) {
            _order = { column, ascending: options?.ascending ?? true }
            return builder
        },
        limit(count: number) {
            _limit = count
            return builder
        },
        async single() {
            _single = true
            return callApi({ operation: 'select', table, select: _select, filters: _filters, single: true, order: _order, limit: _limit })
        },
        async maybeSingle() {
            _maybeSingle = true
            return callApi({ operation: 'select', table, select: _select, filters: _filters, maybeSingle: true, order: _order, limit: _limit })
        },
        // For direct awaiting without .single()
        then(resolve: any, reject?: any) {
            callApi({ operation: 'select', table, select: _select, filters: _filters, single: _single, maybeSingle: _maybeSingle, order: _order, limit: _limit })
                .then(resolve, reject)
        },
        // Chainable insert
        insert(data: any) {
            return createInsertBuilder(table, data)
        },
        update(data: any) {
            return createUpdateBuilder(table, data, _filters)
        },
        upsert(data: any, options?: { onConflict?: string }) {
            return createUpsertBuilder(table, data, options)
        },
        delete() {
            return createDeleteBuilder(table, _filters)
        }
    }

    return builder
}

function createInsertBuilder(table: string, data: any) {
    let _returnData = false
    let _single = false

    const builder: any = {
        select() {
            _returnData = true
            return builder
        },
        single() {
            _single = true
            _returnData = true
            return callApi({ operation: 'insert', table, data, returnData: true })
        },
        then(resolve: any, reject?: any) {
            callApi({ operation: 'insert', table, data, returnData: _returnData })
                .then(resolve, reject)
        }
    }

    return builder
}

function createUpdateBuilder(table: string, data: any, initialFilters: Filter[] = []) {
    const _filters = [...initialFilters]
    let _returnData = false

    const builder: any = {
        eq(column: string, value: any) {
            _filters.push({ op: 'eq', column, value })
            return builder
        },
        select() {
            _returnData = true
            return builder
        },
        single() {
            _returnData = true
            return callApi({ operation: 'update', table, data, filters: _filters, returnData: true })
        },
        then(resolve: any, reject?: any) {
            callApi({ operation: 'update', table, data, filters: _filters, returnData: _returnData })
                .then(resolve, reject)
        }
    }

    return builder
}

function createUpsertBuilder(table: string, data: any, options?: { onConflict?: string }) {
    const builder: any = {
        select() {
            return builder
        },
        single() {
            return callApi({ operation: 'upsert', table, data, onConflict: options?.onConflict })
        },
        then(resolve: any, reject?: any) {
            callApi({ operation: 'upsert', table, data, onConflict: options?.onConflict })
                .then(resolve, reject)
        }
    }
    return builder
}

function createDeleteBuilder(table: string, initialFilters: Filter[] = []) {
    const _filters = [...initialFilters]

    const builder: any = {
        eq(column: string, value: any) {
            _filters.push({ op: 'eq', column, value })
            return builder
        },
        then(resolve: any, reject?: any) {
            callApi({ operation: 'delete', table, filters: _filters })
                .then(resolve, reject)
        }
    }

    return builder
}

/**
 * Proxy Supabase client that routes through /api/auth/db-operation
 * Drop-in replacement for the Supabase client used in auth_system.ts
 */
export const supabaseProxy = {
    from(table: string) {
        const builder = createSelectBuilder(table)
        return {
            select: builder.select.bind(builder),
            eq: builder.eq.bind(builder),
            neq: builder.neq.bind(builder),
            in: builder.in.bind(builder),
            gte: builder.gte.bind(builder),
            lte: builder.lte.bind(builder),
            gt: builder.gt.bind(builder),
            lt: builder.lt.bind(builder),
            like: builder.like.bind(builder),
            order: builder.order.bind(builder),
            limit: builder.limit.bind(builder),
            single: builder.single.bind(builder),
            maybeSingle: builder.maybeSingle.bind(builder),
            insert: (data: any) => createInsertBuilder(table, data),
            update: (data: any) => createUpdateBuilder(table, data),
            upsert: (data: any, options?: { onConflict?: string }) => createUpsertBuilder(table, data, options),
            delete: () => createDeleteBuilder(table),
        }
    },
    async rpc(name: string, params?: any): Promise<{ data: any; error: any }> {
        return callApi({ operation: 'rpc', table: '_rpc', rpcName: name, rpcParams: params })
    }
}
