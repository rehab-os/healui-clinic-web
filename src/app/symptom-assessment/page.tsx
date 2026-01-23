import SymptomAssessmentChat from '@/components/molecule/SymptomAssessmentChat';

export const metadata = {
  title: 'Symptom Assessment | HealUI',
  description: 'Complete your symptom assessment to help your physiotherapist understand your condition better.',
};

export default function SymptomAssessmentPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <SymptomAssessmentChat />
    </main>
  );
}
