'use client';

import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import PatientCardRedesigned from '../patients/PatientCardRedesigned';
import ConditionCardRedesigned from '../conditions/ConditionCardRedesigned';
import '../design-system.css';

/**
 * Design Comparison Page
 *
 * This page lets you:
 * 1. See the redesigned components
 * 2. Toggle between light and dark modes
 * 3. Compare with your existing design
 * 4. Judge if this approach works for HealUI
 */

export default function DesignComparison() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Sample data
  const samplePatient = {
    id: '1',
    full_name: 'John Doe',
    phone: '+91 98765 43210',
    email: 'john.doe@example.com',
    age: 42,
    gender: 'Male',
    last_visit: 'Jan 20, 2026',
    conditions_count: 2,
    status: 'active' as const,
  };

  const sampleCondition = {
    id: '1',
    condition_name: 'Lateral Ankle Sprain',
    body_region: 'Ankle',
    severity_level: 'moderate' as const,
    status: 'ACTIVE',
    onset_date: 'Jan 15, 2026',
    progress: 65,
    vas_score: 4,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      transition: 'background 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-primary)',
        padding: 'var(--space-6)',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                HealUI Design System Preview
              </h1>
              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
              }}>
                Practical modern design for daily use • Light mode default + Dark mode option
              </p>
            </div>
            <button
              className="btn-secondary"
              onClick={toggleTheme}
              style={{ minWidth: '140px' }}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={18} />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun size={18} />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--space-8)',
      }}>
        {/* Introduction */}
        <div className="card mb-6">
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
          }}>
            🎨 Design Philosophy
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                ✅ What We Kept
              </h3>
              <ul style={{ paddingLeft: 'var(--space-4)' }}>
                <li>Teal as primary brand color</li>
                <li>Golden ratio spacing (20px, 32px)</li>
                <li>Soft, rounded corners</li>
                <li>Clean, professional feel</li>
              </ul>
            </div>
            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                🎯 What We Changed
              </h3>
              <ul style={{ paddingLeft: 'var(--space-4)' }}>
                <li><strong>Solid cards</strong> (not glass) for readability</li>
                <li><strong>Light mode default</strong> (medical standard)</li>
                <li>Better typography hierarchy</li>
                <li>Smoother micro-interactions</li>
              </ul>
            </div>
            <div>
              <h3 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                💡 Why This Works
              </h3>
              <ul style={{ paddingLeft: 'var(--space-4)' }}>
                <li>Readable for 8+ hour shifts</li>
                <li>Modern but professional</li>
                <li>Distinctive but not gimmicky</li>
                <li>Both light & dark modes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Components Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          {/* Patient Card Example */}
          <div>
            <h3 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-4)',
            }}>
              Patient Card
            </h3>
            <PatientCardRedesigned
              patient={samplePatient}
              onView={() => alert('View patient details')}
              onEdit={() => alert('Edit patient')}
              onGenerateProtocol={() => alert('Generate AI Protocol! ✨')}
            />
          </div>

          {/* Condition Card Example */}
          <div>
            <h3 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-4)',
            }}>
              Condition Card
            </h3>
            <ConditionCardRedesigned
              condition={sampleCondition}
              onEdit={() => alert('Edit condition')}
              onGenerateProtocol={() => alert('Generate AI Protocol! ✨')}
              onDischarge={() => alert('Discharge condition')}
              onDelete={() => alert('Delete condition')}
            />
          </div>
        </div>

        {/* Buttons Showcase */}
        <div className="card mt-6">
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
          }}>
            Button System
          </h3>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary">
              Primary Action
            </button>
            <button className="btn btn-sparkles">
              <span style={{ fontSize: '18px' }}>✨</span>
              Generate Protocol
            </button>
            <button className="btn btn-secondary">
              Secondary Action
            </button>
            <button className="btn btn-ghost">
              Ghost Button
            </button>
          </div>
        </div>

        {/* Badges Showcase */}
        <div className="card mt-6">
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
          }}>
            Badge System
          </h3>
          <div className="flex flex-wrap gap-3">
            <span className="badge badge-success">Active</span>
            <span className="badge badge-warning">Moderate</span>
            <span className="badge badge-error">Severe</span>
            <span className="badge badge-teal">Teal Badge</span>
            <span className="badge badge-teal-solid">Teal Solid</span>
          </div>
        </div>

        {/* Verdict Section */}
        <div className="card-elevated mt-6" style={{
          background: 'var(--teal-50)',
          border: '2px solid var(--teal-100)',
          padding: 'var(--space-8)',
        }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
          }}>
            ⚖️ Honest Assessment
          </h2>
          <div style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              <strong>GLASSMORPHISM:</strong> I recommend using it ONLY for modals and overlays, not daily-use cards.
              Your clinicians need readable content, not trendy blur effects. Solid cards with subtle shadows work better for 8+ hour days.
            </p>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              <strong>DARK MODE:</strong> Offer both modes, but default to light (medical standard). Modern clinicians
              expect dark mode options, especially those who work long shifts. Look at PACS systems - radiologists prefer dark backgrounds.
            </p>
            <p>
              <strong>THIS DESIGN:</strong> Strikes a balance - modern enough to stand out, practical enough for daily use,
              professional enough for healthcare. It's distinctive without being gimmicky.
            </p>
          </div>
        </div>

        {/* Technical Notes */}
        <div className="card mt-6" style={{
          background: 'var(--bg-tertiary)',
        }}>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            📋 Implementation Notes
          </h3>
          <ul style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            paddingLeft: 'var(--space-4)',
          }}>
            <li>All components use CSS variables for easy theming</li>
            <li>Light mode is default (medical standard)</li>
            <li>Dark mode available via [data-theme="dark"]</li>
            <li>Solid cards for content (readable)</li>
            <li>Glass effects only for modals/overlays</li>
            <li>Teal accent for brand consistency</li>
            <li>Smooth transitions (250ms standard)</li>
            <li>Focus indicators for accessibility</li>
            <li>Works on all screen sizes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
