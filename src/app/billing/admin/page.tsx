import { redirect } from 'next/navigation'

/**
 * Admin Panel Root - Redirects to Dashboard
 * This page redirects /billing/admin to /billing/admin/dashboard
 */
export default function AdminPage() {
  redirect('/billing/admin/dashboard')
}
