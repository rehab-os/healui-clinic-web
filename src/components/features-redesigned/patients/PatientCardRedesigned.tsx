'use client';

import React from 'react';
import {
  User, Phone, Mail, Calendar, Activity,
  Sparkles, Edit, MoreVertical
} from 'lucide-react';
import '../design-system.css';

/**
 * Redesigned Patient Card
 *
 * IMPROVEMENTS:
 * 1. Solid card (not glass) - Better readability for daily use
 * 2. Teal accent on left - Brand identity
 * 3. Better typography hierarchy
 * 4. Smoother hover effects
 * 5. Works in BOTH light and dark modes
 * 6. More breathing room (spacing)
 */

interface PatientCardProps {
  patient: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    age?: number;
    gender?: string;
    last_visit?: string;
    conditions_count?: number;
    status?: 'active' | 'inactive';
  };
  onView?: () => void;
  onEdit?: () => void;
  onGenerateProtocol?: () => void;
}

export default function PatientCardRedesigned({ patient, onView, onEdit, onGenerateProtocol }: PatientCardProps) {
  return (
    <div
      className="card card-teal-accent animate-fade-in-up"
      style={{
        cursor: onView ? 'pointer' : 'default',
      }}
      onClick={onView}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--teal-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            flexShrink: 0,
          }}>
            {patient.full_name.charAt(0).toUpperCase()}
          </div>

          {/* Name & Status */}
          <div>
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-1)',
            }}>
              {patient.full_name}
            </h3>
            <div className="flex items-center gap-2">
              {patient.status === 'active' && (
                <span className="badge badge-success">Active</span>
              )}
              {patient.age && patient.gender && (
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-tertiary)',
                }}>
                  {patient.age}y • {patient.gender}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="btn-icon btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            title="Edit Patient"
          >
            <Edit size={18} />
          </button>
          <button
            className="btn-icon btn-sparkles"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateProtocol?.();
            }}
            title="Generate AI Protocol"
          >
            <Sparkles size={18} />
          </button>
          <button
            className="btn-icon btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Phone size={16} />
          <span style={{ fontSize: 'var(--text-sm)' }}>{patient.phone}</span>
        </div>
        {patient.email && (
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Mail size={16} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{patient.email}</span>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-4)',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--border-primary)',
      }}>
        {patient.last_visit && (
          <div>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--space-1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Last Visit
            </div>
            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Calendar size={14} />
              <span style={{ fontSize: 'var(--text-sm)' }}>{patient.last_visit}</span>
            </div>
          </div>
        )}
        {patient.conditions_count !== undefined && (
          <div>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--space-1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Conditions
            </div>
            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Activity size={14} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                {patient.conditions_count}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
