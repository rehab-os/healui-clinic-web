'use client';

import React from 'react';
import {
  Activity, Calendar, Sparkles, Edit,
  LogOut, Trash2, TrendingUp
} from 'lucide-react';
import '../design-system.css';

/**
 * Redesigned Condition Card
 *
 * IMPROVEMENTS:
 * 1. Progress bar showing healing progress (visual feedback)
 * 2. Clearer action buttons with tooltips
 * 3. Better badge styling
 * 4. Teal accent for brand consistency
 * 5. Smooth animations on hover
 * 6. Works in both light and dark modes
 */

interface ConditionCardProps {
  condition: {
    id: string;
    condition_name: string;
    body_region?: string;
    severity_level?: 'mild' | 'moderate' | 'severe';
    status?: string;
    onset_date?: string;
    progress?: number; // 0-100
    vas_score?: number;
  };
  onEdit?: () => void;
  onGenerateProtocol?: () => void;
  onDischarge?: () => void;
  onDelete?: () => void;
}

export default function ConditionCardRedesigned({
  condition,
  onEdit,
  onGenerateProtocol,
  onDischarge,
  onDelete
}: ConditionCardProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'mild': return 'badge-success';
      case 'moderate': return 'badge-warning';
      case 'severe': return 'badge-error';
      default: return 'badge-teal';
    }
  };

  return (
    <div className="card card-teal-accent animate-fade-in-up" style={{ position: 'relative' }}>
      {/* Progress Bar (if available) */}
      {condition.progress !== undefined && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          overflow: 'hidden',
        }}>
          <div
            className="animate-shimmer"
            style={{
              height: '100%',
              width: `${condition.progress}%`,
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4" style={{ marginTop: condition.progress !== undefined ? 'var(--space-2)' : 0 }}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={20} style={{ color: 'var(--teal-500)' }} />
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
            }}>
              {condition.condition_name}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {condition.status && (
              <span className="badge badge-teal">{condition.status}</span>
            )}
            {condition.severity_level && (
              <span className={`badge ${getSeverityColor(condition.severity_level)}`}>
                {condition.severity_level}
              </span>
            )}
            {condition.body_region && (
              <span className="badge" style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}>
                {condition.body_region}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-6 mb-4" style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
      }}>
        {condition.onset_date && (
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>Onset: {condition.onset_date}</span>
          </div>
        )}
        {condition.vas_score !== undefined && (
          <div className="flex items-center gap-1">
            <TrendingUp size={14} />
            <span>Pain: {condition.vas_score}/10</span>
          </div>
        )}
        {condition.progress !== undefined && (
          <div className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <Activity size={14} />
            <span style={{ fontWeight: 'var(--font-semibold)' }}>
              {condition.progress}% Progress
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--border-primary)',
      }}>
        <button
          className="btn-icon btn-secondary"
          onClick={onEdit}
          title="Edit Condition"
        >
          <Edit size={16} />
        </button>
        <button
          className="btn-icon btn-sparkles"
          onClick={onGenerateProtocol}
          title="Generate AI Protocol"
        >
          <Sparkles size={16} />
        </button>
        <button
          className="btn-icon btn-ghost"
          onClick={onDischarge}
          title="Discharge"
          style={{ color: 'var(--warning)' }}
        >
          <LogOut size={16} />
        </button>
        <button
          className="btn-icon btn-ghost"
          onClick={onDelete}
          title="Delete"
          style={{ color: 'var(--error)' }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
