'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../../store/hooks';
import {
  HeartPulse,
  TrendingUp,
  Activity,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Info,
} from 'lucide-react';
import { KPICard, SimpleBarChart } from '../../../components/dashboard';
import ApiManager from '../../../services/api';

// Types for API responses
interface ClinicalOutcomesSummary {
  totalConditionsTreated: number;
  resolvedConditions: number;
  activeConditions: number;
  improvingConditions: number;
  recoveryRate: number;
  avgSessionsToRecovery: number;
  treatmentCompletionRate: number;
  avgTreatmentDurationDays: number;
}

interface ConditionOutcome {
  conditionName: string;
  bodyRegion: string;
  totalPatients: number;
  resolved: number;
  active: number;
  improving: number;
  recoveryRate: number;
  avgSessions: number;
}

interface TherapistOutcome {
  therapistId: string;
  therapistName: string;
  totalPatients: number;
  resolvedConditions: number;
  activeConditions: number;
  recoveryRate: number;
  avgSessionsToRecovery: number;
  completedVisits: number;
}

interface ClinicalOutcomesData {
  summary: ClinicalOutcomesSummary;
  byCondition: ConditionOutcome[];
  byTherapist: TherapistOutcome[];
}

export default function ClinicalOutcomesPage() {
  const { userData } = useAppSelector((state) => state.user);
  const isOrgOwner = userData?.organization?.is_owner;
  const organizationId = userData?.organization?.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClinicalOutcomesData | null>(null);

  // Load clinical outcomes data
  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const response = await ApiManager.getOrgClinicalOutcomes(organizationId);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load clinical outcomes:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId, loadData]);

  // Check access - organization owner only
  if (!isOrgOwner) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">Only organization owners can view clinical outcomes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <HeartPulse className="h-6 w-6 text-brand-teal" />
                Clinical Outcomes
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Track treatment effectiveness across {userData?.organization?.name || 'your organization'}
              </p>
            </div>
            {loading ? (
              <Loader2 className="h-6 w-6 text-brand-teal animate-spin" />
            ) : (
              <div className="text-right">
                <div className="text-2xl font-bold text-brand-teal">
                  {data?.summary.recoveryRate || 0}%
                </div>
                <div className="text-xs text-gray-500">Recovery Rate</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ============ SUMMARY KPIs ============ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-teal" />
            Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Recovery Rate"
              value={`${data?.summary.recoveryRate || 0}%`}
              subtitle="Conditions resolved"
              icon={CheckCircle}
              color="green"
              loading={loading}
            />
            <KPICard
              title="Treatment Completion"
              value={`${data?.summary.treatmentCompletionRate || 0}%`}
              subtitle="Session packs completed"
              icon={Activity}
              color="blue"
              loading={loading}
            />
            <KPICard
              title="Active Conditions"
              value={data?.summary.activeConditions || 0}
              subtitle="Currently being treated"
              icon={Users}
              color="orange"
              loading={loading}
            />
            <KPICard
              title="Avg Sessions"
              value={data?.summary.avgSessionsToRecovery || 0}
              subtitle="To recovery"
              icon={Clock}
              color="purple"
              loading={loading}
            />
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total Conditions Treated</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  data?.summary.totalConditionsTreated || 0
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Resolved</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  data?.summary.resolvedConditions || 0
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Improving</div>
              <div className="text-2xl font-semibold text-blue-600 mt-1">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  data?.summary.improvingConditions || 0
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Avg Treatment Duration</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  `${data?.summary.avgTreatmentDurationDays || 0} days`
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============ OUTCOMES BY CONDITION ============ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-teal" />
            Outcomes by Condition
            <span className="ml-2 group relative">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Treatment success rates grouped by medical condition
              </span>
            </span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recovery Rate Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                Recovery Rate by Condition
                <span className="group relative">
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Percentage of patients recovered per condition
                  </span>
                </span>
              </h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : data?.byCondition && data.byCondition.length > 0 ? (
                <SimpleBarChart
                  data={data.byCondition.slice(0, 8).map(c => ({
                    name: c.conditionName.length > 15 ? c.conditionName.slice(0, 12) + '...' : c.conditionName,
                    value: c.recoveryRate,
                  }))}
                  color="#10B981"
                  height={280}
                  formatValue={(v) => `${v}%`}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  No condition data available
                </div>
              )}
            </div>

            {/* Conditions Table */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                Condition Details
                <span className="group relative">
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Breakdown of treatment outcomes per condition type
                  </span>
                </span>
              </h3>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : data?.byCondition && data.byCondition.length > 0 ? (
                <div className="overflow-auto max-h-[320px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 font-medium text-gray-500">Condition</th>
                        <th className="text-right py-2 font-medium text-gray-500">Patients</th>
                        <th className="text-right py-2 font-medium text-gray-500">Resolved</th>
                        <th className="text-right py-2 font-medium text-gray-500">Rate</th>
                        <th className="text-right py-2 font-medium text-gray-500">Avg Sess.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCondition.map((condition, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2">
                            <div className="font-medium text-gray-900">{condition.conditionName}</div>
                            <div className="text-xs text-gray-500">{condition.bodyRegion}</div>
                          </td>
                          <td className="py-2 text-right text-gray-600">{condition.totalPatients}</td>
                          <td className="py-2 text-right text-green-600 font-medium">{condition.resolved}</td>
                          <td className="py-2 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              condition.recoveryRate >= 70 ? 'bg-green-100 text-green-700' :
                              condition.recoveryRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {condition.recoveryRate}%
                            </span>
                          </td>
                          <td className="py-2 text-right text-gray-600">{condition.avgSessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No condition data available
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ OUTCOMES BY THERAPIST ============ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-teal" />
            Outcomes by Therapist
            <span className="ml-2 group relative">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Treatment outcomes tracked per therapist across all clinics
              </span>
            </span>
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : data?.byTherapist && data.byTherapist.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Therapist</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          Patients
                          <span className="group relative">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Unique patients treated
                            </span>
                          </span>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          Resolved
                          <span className="group relative">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Conditions marked as resolved
                            </span>
                          </span>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          Active
                          <span className="group relative">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Conditions currently being treated
                            </span>
                          </span>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          Recovery Rate
                          <span className="group relative">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              % of conditions resolved vs total
                            </span>
                          </span>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          Avg Sessions
                          <span className="group relative">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Average sessions to resolve a condition
                            </span>
                          </span>
                        </span>
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          Total Visits
                          <span className="group relative">
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                            <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              All completed appointments
                            </span>
                          </span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byTherapist.map((therapist, index) => (
                      <tr key={`${therapist.therapistId}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-medium text-sm">
                              {therapist.therapistName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{therapist.therapistName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600">{therapist.totalPatients}</td>
                        <td className="py-3 px-2 text-right text-green-600 font-medium">{therapist.resolvedConditions}</td>
                        <td className="py-3 px-2 text-right text-orange-600">{therapist.activeConditions}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            therapist.recoveryRate >= 70 ? 'bg-green-100 text-green-700' :
                            therapist.recoveryRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {therapist.recoveryRate}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600">{therapist.avgSessionsToRecovery}</td>
                        <td className="py-3 px-2 text-right text-gray-900 font-medium">{therapist.completedVisits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                No therapist data available
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
