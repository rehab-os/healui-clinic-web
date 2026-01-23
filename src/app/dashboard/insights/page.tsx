'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../../store/hooks';
import {
  Users,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  Building2,
  BarChart3,
  Loader2,
  Calendar,
} from 'lucide-react';
import {
  KPICard,
  AgeDistributionChart,
  TopConditionsChart,
  GenderChart,
  PeakHoursHeatmap,
  SimpleBarChart,
} from '../../../components/dashboard';
import ApiManager from '../../../services/api';

// Types for API responses
interface AgeDistribution {
  ageGroup: string;
  count: number;
  percentage: number;
}

interface GenderDistribution {
  male: number;
  female: number;
  other: number;
}

interface Demographics {
  ageDistribution: AgeDistribution[];
  genderDistribution: GenderDistribution;
  totalPatients: number;
}

interface TopCondition {
  conditionName: string;
  bodyRegion: string;
  count: number;
  percentage: number;
}

interface ConditionsData {
  topConditions: TopCondition[];
  totalConditions: number;
}

interface PeakHour {
  day: string;
  hour: number;
  appointmentCount: number;
}

interface OperationalMetrics {
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  avgSessionsPerPatient: number;
  avgVisitDuration: number;
}

interface OperationsData {
  peakHours: PeakHour[];
  metrics: OperationalMetrics;
}

interface MonthlyCondition {
  month: string;
  conditionName: string;
  patientCount: number;
}

interface ConditionMonthlyTrend {
  conditions: TopCondition[];
  monthlyBreakdown: MonthlyCondition[];
  totalPatients: number;
  period: string;
}

export default function InsightsPage() {
  const { userData, currentClinic } = useAppSelector((state) => state.user);

  // Determine if we're viewing org-level or clinic-level insights
  const isOrgLevel = !currentClinic && userData?.organization?.is_owner;
  const organizationId = userData?.organization?.id;
  const clinicId = currentClinic?.id;

  const [loading, setLoading] = useState(true);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [conditions, setConditions] = useState<ConditionsData | null>(null);
  const [operations, setOperations] = useState<OperationsData | null>(null);
  const [conditionsMonthly, setConditionsMonthly] = useState<ConditionMonthlyTrend | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(6);

  // Load insights data - supports both org and clinic level
  const loadInsights = useCallback(async () => {
    // Need either a clinic or org context
    if (!clinicId && !isOrgLevel) return;

    setLoading(true);
    try {
      let demographicsRes, conditionsRes, operationsRes, monthlyRes;

      if (isOrgLevel && organizationId) {
        // Fetch organization-level insights
        [demographicsRes, conditionsRes, operationsRes, monthlyRes] = await Promise.all([
          ApiManager.getOrgInsightsDemographics(organizationId),
          ApiManager.getOrgInsightsConditions(organizationId, 10),
          ApiManager.getOrgInsightsOperations(organizationId),
          ApiManager.getOrgInsightsConditionsMonthly(organizationId, selectedMonths),
        ]);
      } else if (clinicId) {
        // Fetch clinic-level insights
        [demographicsRes, conditionsRes, operationsRes, monthlyRes] = await Promise.all([
          ApiManager.getInsightsDemographics(clinicId),
          ApiManager.getInsightsConditions(clinicId, 10),
          ApiManager.getInsightsOperations(clinicId),
          ApiManager.getInsightsConditionsMonthly(clinicId, selectedMonths),
        ]);
      } else {
        return;
      }

      if (demographicsRes.success) setDemographics(demographicsRes.data);
      if (conditionsRes.success) setConditions(conditionsRes.data);
      if (operationsRes.success) setOperations(operationsRes.data);
      if (monthlyRes.success) setConditionsMonthly(monthlyRes.data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }, [clinicId, isOrgLevel, organizationId, selectedMonths]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Check access - need either clinic selected OR be an org owner
  if (!currentClinic && !isOrgLevel) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Clinic Selected</h2>
          <p className="text-gray-500">Please select a clinic to view insights.</p>
        </div>
      </div>
    );
  }

  // Group conditions by body region for body regions chart
  const bodyRegions = conditions?.topConditions.reduce((acc, cond) => {
    const existing = acc.find(r => r.region === cond.bodyRegion);
    if (existing) {
      existing.count += cond.count;
    } else {
      acc.push({ region: cond.bodyRegion, count: cond.count, percentage: 0 });
    }
    return acc;
  }, [] as { region: string; count: number; percentage: number }[]) || [];

  // Calculate percentages for body regions
  const totalConditionCount = bodyRegions.reduce((sum, r) => sum + r.count, 0);
  bodyRegions.forEach(r => {
    r.percentage = totalConditionCount > 0 ? Math.round((r.count / totalConditionCount) * 100) : 0;
  });
  bodyRegions.sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isOrgLevel
                  ? `${userData?.organization?.name || 'Organization'}-wide analytics`
                  : `${currentClinic?.name || 'Clinic'} analytics`}
              </p>
            </div>
            {loading ? (
              <Loader2 className="h-6 w-6 text-brand-teal animate-spin" />
            ) : (
              <BarChart3 className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ============ PATIENT DEMOGRAPHICS ============ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-teal" />
            Patient Demographics
            {demographics && (
              <span className="text-sm font-normal text-gray-500">
                ({demographics.totalPatients} total patients)
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Age Distribution</h3>
              <AgeDistributionChart
                data={demographics?.ageDistribution.map(a => ({
                  range: a.ageGroup,
                  count: a.count,
                  percentage: a.percentage,
                })) || []}
                loading={loading}
              />
            </div>

            {/* Gender Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Gender Distribution</h3>
              <GenderChart
                data={demographics?.genderDistribution || { male: 0, female: 0, other: 0 }}
                loading={loading}
              />
            </div>
          </div>
        </section>

        {/* ============ CONDITIONS TREATED ============ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-teal" />
            Conditions Treated
            {conditions && (
              <span className="text-sm font-normal text-gray-500">
                ({conditions.totalConditions} total)
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Conditions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Top Conditions</h3>
              <TopConditionsChart
                data={conditions?.topConditions || []}
                loading={loading}
              />
            </div>

            {/* Body Regions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Body Regions</h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : bodyRegions.length > 0 ? (
                <div className="space-y-3">
                  {bodyRegions.slice(0, 5).map((region) => (
                    <div key={region.region} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600">{region.region}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-brand-teal rounded-full transition-all duration-500"
                          style={{ width: `${region.percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm font-medium text-gray-900 text-right">
                        {region.count} ({region.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No body region data available
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ MONTHLY CONDITION TRENDS ============ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-teal" />
              Condition Trends by Month
            </h2>
            <select
              value={selectedMonths}
              onChange={(e) => setSelectedMonths(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Patient Count by Top Conditions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Patients by Condition ({conditionsMonthly?.period || 'Loading...'})</h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : conditionsMonthly?.conditions && conditionsMonthly.conditions.length > 0 ? (
                <SimpleBarChart
                  data={conditionsMonthly.conditions.slice(0, 6).map(c => ({
                    name: c.conditionName.length > 15 ? c.conditionName.slice(0, 12) + '...' : c.conditionName,
                    value: c.count,
                  }))}
                  color="#00897B"
                  height={220}
                  formatValue={(v) => `${v} patients`}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No condition data for this period
                </div>
              )}
            </div>

            {/* Monthly Breakdown Table */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Monthly Breakdown</h3>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : conditionsMonthly?.monthlyBreakdown && conditionsMonthly.monthlyBreakdown.length > 0 ? (
                <div className="overflow-auto max-h-[280px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 font-medium text-gray-500">Month</th>
                        <th className="text-left py-2 font-medium text-gray-500">Condition</th>
                        <th className="text-right py-2 font-medium text-gray-500">Patients</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conditionsMonthly.monthlyBreakdown.slice(0, 20).map((item, index) => (
                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-gray-600">{item.month}</td>
                          <td className="py-2 text-gray-900">{item.conditionName}</td>
                          <td className="py-2 text-right font-medium text-gray-900">{item.patientCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No monthly data available
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ OPERATIONAL INSIGHTS ============ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-teal" />
            Operational Insights
          </h2>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Completion Rate"
              value={`${operations?.metrics.completionRate || 0}%`}
              subtitle="Visits completed"
              icon={TrendingUp}
              color="green"
              loading={loading}
            />
            <KPICard
              title="Cancellation Rate"
              value={`${operations?.metrics.cancellationRate || 0}%`}
              subtitle="Last 3 months"
              icon={AlertCircle}
              color="orange"
              loading={loading}
            />
            <KPICard
              title="No-Show Rate"
              value={`${operations?.metrics.noShowRate || 0}%`}
              subtitle="Last 3 months"
              icon={AlertCircle}
              color="red"
              loading={loading}
            />
            <KPICard
              title="Avg Sessions"
              value={(operations?.metrics.avgSessionsPerPatient || 0).toFixed(1)}
              subtitle="Per patient"
              icon={Activity}
              color="blue"
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Peak Hours</h3>
              <PeakHoursHeatmap
                data={operations?.peakHours || []}
                loading={loading}
              />
            </div>

            {/* Avg Visit Duration */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">Summary</h3>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Average Visit Duration</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {operations?.metrics.avgVisitDuration || 30} mins
                      </div>
                    </div>
                    <Clock className="h-8 w-8 text-brand-teal/50" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Sessions Per Patient</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {(operations?.metrics.avgSessionsPerPatient || 0).toFixed(1)}
                      </div>
                    </div>
                    <Activity className="h-8 w-8 text-blue-400/50" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Treatment Success</div>
                      <div className="text-xl font-semibold text-green-600">
                        {operations?.metrics.completionRate || 0}%
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-400/50" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
