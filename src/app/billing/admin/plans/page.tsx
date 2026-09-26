'use client'

/**
 * Admin Plans Management Page
 *
 * Allows admin to:
 * - View all subscription plans
 * - Edit plan prices
 * - Edit plan features
 * - Activate/deactivate plans
 *
 * @module app/billing/admin/plans/page
 */

import { useEffect, useState, useCallback } from 'react'

interface Plan {
  id: string
  name: string
  name_ar: string
  price: number
  currency: string
  features: string[]
  features_ar: string[]
  is_active: boolean
  display_order: number
}

// ألوان الباقات
const planColors: Record<string, { gradient: string; accent: string; glow: string; badge: string }> = {
  basic: {
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1a2d47 100%)',
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.15)',
    badge: '#3b82f6',
  },
  pro: {
    gradient: 'linear-gradient(135deg, #4a1d6a 0%, #2d1548 100%)',
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.15)',
    badge: '#a855f7',
  },
  vip: {
    gradient: 'linear-gradient(135deg, #5c3d1e 0%, #3d2810 100%)',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.15)',
    badge: '#f59e0b',
  },
}

const defaultColor = {
  gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  accent: '#6366f1',
  glow: 'rgba(99, 102, 241, 0.15)',
  badge: '#6366f1',
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/plans')
      const data = await response.json()

      if (data.ok) {
        setPlans(data.plans)
      } else {
        showToast('فشل تحميل الباقات', 'error')
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      showToast('حدث خطأ في تحميل الباقات', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleEdit = (plan: Plan) => {
    setEditingPlan({ ...plan })
  }

  const handleSave = async () => {
    if (!editingPlan) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPlan.name,
          name_ar: editingPlan.name_ar,
          price: editingPlan.price,
          features: editingPlan.features,
          features_ar: editingPlan.features_ar,
          is_active: editingPlan.is_active,
          display_order: editingPlan.display_order,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        showToast('تم حفظ التغييرات بنجاح!', 'success')
        setEditingPlan(null)
        fetchPlans()
      } else {
        showToast('فشل حفظ التغييرات: ' + data.error, 'error')
      }
    } catch (error) {
      console.error('Failed to save plan:', error)
      showToast('حدث خطأ في حفظ التغييرات', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingPlan(null)
  }

  const getColors = (planId: string) => planColors[planId] || defaultColor

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: '#9ca3af' }}>جاري تحميل الباقات...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '0.85rem 1.5rem',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideDown 0.3s ease',
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }`}</style>

      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#f1f5f9',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}>📦</span>
          إدارة الباقات والأسعار
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginRight: '3.5rem' }}>تعديل أسعار ومميزات باقات الاشتراك</p>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'إجمالي الباقات', value: plans.length, icon: '📦', color: '#6366f1' },
          { label: 'باقات نشطة', value: plans.filter(p => p.is_active).length, icon: '✅', color: '#10b981' },
          { label: 'باقات معطلة', value: plans.filter(p => !p.is_active).length, icon: '⏸️', color: '#ef4444' },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: '1',
            minWidth: '160px',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${stat.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {plans.map((plan) => {
          const colors = getColors(plan.id)
          return (
            <div
              key={plan.id}
              style={{
                borderRadius: '18px',
                background: colors.gradient,
                border: `1px solid ${colors.accent}25`,
                padding: '1.75rem',
                position: 'relative',
                overflow: 'hidden',
                opacity: plan.is_active ? 1 : 0.55,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 12px 40px ${colors.glow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Decorative glow */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                left: '-40px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${colors.accent}20 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#f8fafc',
                    marginBottom: '0.25rem',
                  }}>{plan.name_ar}</h3>
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                  }}>ID: {plan.id}</span>
                </div>
                <span style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: plan.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: plan.is_active ? '#34d399' : '#f87171',
                  border: `1px solid ${plan.is_active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                }}>
                  {plan.is_active ? '● نشط' : '○ معطل'}
                </span>
              </div>

              {/* Price */}
              <div style={{
                marginBottom: '1.25rem',
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: colors.accent,
                    lineHeight: 1,
                  }}>{plan.price}</span>
                  <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 500 }}>جنيه</span>
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.75rem' }}>المميزات:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {plan.features_ar.map((feature, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.85rem',
                      color: '#d1d5db',
                    }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: `${colors.accent}20`,
                        color: colors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}>✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => handleEdit(plan)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: `1px solid ${colors.accent}40`,
                  backgroundColor: `${colors.accent}15`,
                  color: colors.accent,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.accent}25`
                  e.currentTarget.style.transform = 'scale(1.01)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.accent}15`
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                ✏️ تعديل الباقة
              </button>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel() }}
        >
          <div
            style={{
              backgroundColor: '#131327',
              borderRadius: '20px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              animation: 'modalIn 0.3s ease',
            }}
          >
            <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }`}</style>

            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.75rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h2 style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>✏️</span>
                تعديل: {editingPlan.name_ar}
              </h2>
              <button
                onClick={handleCancel}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f1f5f9' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Price */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#d1d5db',
                  marginBottom: '0.5rem',
                }}>💰 السعر (جنيه مصري)</label>
                <input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Arabic Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#d1d5db',
                  marginBottom: '0.5rem',
                }}>📝 اسم الباقة بالعربية</label>
                <input
                  type="text"
                  value={editingPlan.name_ar}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name_ar: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Features (Arabic) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#d1d5db',
                  marginBottom: '0.5rem',
                }}>⭐ المميزات (عربي) — سطر لكل ميزة</label>
                <textarea
                  value={editingPlan.features_ar.join('\n')}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features_ar: e.target.value.split('\n').filter((f) => f.trim()),
                    })
                  }
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.8,
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Active Status + Display Order row */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label
                  htmlFor="is_active"
                  style={{
                    flex: '1',
                    minWidth: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: editingPlan.is_active ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${editingPlan.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingPlan.is_active}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, is_active: e.target.checked })
                    }
                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                  <span style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 500 }}>الباقة نشطة</span>
                </label>

                <div style={{ flex: '1', minWidth: '140px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#9ca3af',
                    marginBottom: '0.4rem',
                  }}>ترتيب العرض</label>
                  <input
                    type="number"
                    value={editingPlan.display_order}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, display_order: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f1f5f9',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: '0.8rem',
                  borderRadius: '12px',
                  background: saving ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.transform = 'scale(1.01)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9ca3af',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f1f5f9' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9ca3af' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
