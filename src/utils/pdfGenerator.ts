interface Exercise {
  name: string;
  description: string;
  sets: string;
  frequency: string;
  customReps?: number;
  customSets?: number;
  customTime?: number;
  customNotes?: string;
}

interface AffectedArea {
  category: 'muscles' | 'joints' | 'tendons' | 'neural';
  id: string;
  name: string;
  selected: boolean;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
  address?: string;
}

interface Clinic {
  name?: string;
  address?: string;
  contact_phone?: string;
  email?: string;
}

interface TreatmentProtocol {
  patient: Patient;
  clinic: Clinic;
  protocolTitle: string;
  selectedAreas: AffectedArea[];
  selectedExercises: Exercise[];
  nutritionRecommendations: string;
  generalNotes: string;
  editedNutritionData?: {
    bloodTests: string[];
    recommendedFoods: string[];
    foodsToAvoid: string[];
    supplements: string[];
    generalAdvice: string[];
    precautions: string[];
    hydration?: string;
    generalGuidelines?: string[];
  };
  showExplanations?: boolean;
  visitHistory?: any[];
  currentComplaint?: string;
  createdDate: string;
}

export const generateTreatmentProtocolHTML = (protocol: TreatmentProtocol): string => {
  const { patient, clinic, protocolTitle, selectedAreas, selectedExercises, nutritionRecommendations, generalNotes, editedNutritionData, showExplanations, visitHistory, currentComplaint, createdDate } = protocol;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Treatment Protocol - ${patient.full_name}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 3px solid #22c55e;
            }
            
            .clinic-logo {
                font-size: 28px;
                font-weight: bold;
                color: #22c55e;
                margin-bottom: 10px;
            }
            
            .clinic-info {
                color: #666;
                font-size: 14px;
                margin-bottom: 20px;
            }
            
            .protocol-title {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
            }
            
            .patient-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
                padding: 20px;
                background: #f8fafc;
                border-radius: 8px;
            }
            
            .info-section h3 {
                color: #374151;
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .info-item {
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .info-label {
                font-weight: bold;
                color: #4b5563;
            }
            
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #22c55e;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 2px solid #22c55e;
            }
            
            .affected-areas {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .area-tag {
                background: #22c55e;
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .area-tag.muscles { background: #ef4444; }
            .area-tag.joints { background: #3b82f6; }
            .area-tag.tendons { background: #22c55e; }
            .area-tag.neural { background: #8b5cf6; }
            
            .exercise {
                margin-bottom: 25px;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                page-break-inside: avoid;
            }
            
            .exercise-name {
                font-size: 16px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 8px;
            }
            
            .exercise-description {
                color: #4b5563;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .exercise-params {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 10px;
                margin-bottom: 10px;
                padding: 10px;
                background: #f8fafc;
                border-radius: 4px;
            }
            
            .param {
                text-align: center;
                font-size: 12px;
            }
            
            .param-value {
                font-weight: bold;
                font-size: 16px;
                color: #22c55e;
            }
            
            .param-label {
                color: #6b7280;
                text-transform: uppercase;
                font-size: 10px;
            }
            
            .exercise-notes {
                color: #6b7280;
                font-style: italic;
                font-size: 13px;
                margin-top: 10px;
                padding: 8px;
                background: #fef3c7;
                border-left: 3px solid #f59e0b;
            }
            
            .nutrition {
                background: #f0f9ff;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #0ea5e9;
            }
            
            .nutrition-content {
                white-space: pre-line;
                color: #374151;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .nutrition-section {
                margin-bottom: 25px;
                padding: 15px;
                border-radius: 8px;
                page-break-inside: avoid;
            }
            
            .nutrition-section.blood-tests {
                background: #fefce8;
                border-left: 4px solid #eab308;
            }
            
            .nutrition-section.recommended-foods {
                background: #f0fdf4;
                border-left: 4px solid #22c55e;
            }
            
            .nutrition-section.avoid-foods {
                background: #fef2f2;
                border-left: 4px solid #ef4444;
            }
            
            .nutrition-section.supplements {
                background: #faf5ff;
                border-left: 4px solid #a855f7;
            }
            
            .nutrition-section.general-advice {
                background: #ecfdf5;
                border-left: 4px solid #10b981;
            }
            
            .nutrition-section.precautions {
                background: #fff7ed;
                border-left: 4px solid #f97316;
            }
            
            .nutrition-section-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 12px;
                color: #1f2937;
            }
            
            .nutrition-list {
                list-style: none;
                padding: 0;
            }
            
            .nutrition-list li {
                margin-bottom: 8px;
                padding-left: 15px;
                position: relative;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .nutrition-list li:before {
                content: '•';
                position: absolute;
                left: 0;
                color: #6b7280;
                font-weight: bold;
            }
            
            .general-notes {
                background: #fef7ff;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #a855f7;
            }
            
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            
            .signature-section {
                margin-top: 40px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
            }
            
            .signature-box {
                text-align: center;
                padding-top: 30px;
                border-top: 1px solid #9ca3af;
            }
            
            .signature-label {
                color: #6b7280;
                font-size: 12px;
            }
            
            @media print {
                body {
                    padding: 0;
                }
                
                .no-print {
                    display: none;
                }
                
                .page-break {
                    page-break-before: always;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="clinic-logo">${clinic?.name || 'PhysioRehab Clinic'}</div>
            <div class="clinic-info">
                ${clinic?.address || 'Clinic Address'}<br>
                Phone: ${clinic?.contact_phone || 'N/A'} | Email: ${clinic?.email || 'N/A'}
            </div>
            <div class="protocol-title">${protocolTitle || 'Treatment Protocol'}</div>
        </div>

        <div class="patient-info">
            <div class="info-section">
                <h3>Patient Information</h3>
                <div class="info-item"><span class="info-label">Name:</span> ${patient.full_name}</div>
                <div class="info-item"><span class="info-label">Phone:</span> ${patient.phone}</div>
                <div class="info-item"><span class="info-label">Email:</span> ${patient.email || 'Not provided'}</div>
                <div class="info-item"><span class="info-label">DOB:</span> ${patient.date_of_birth}</div>
                <div class="info-item"><span class="info-label">Gender:</span> ${patient.gender}</div>
                ${currentComplaint ? `<div class="info-item"><span class="info-label">Chief Complaint:</span> ${currentComplaint}</div>` : ''}
            </div>
            <div class="info-section">
                <h3>Protocol Information</h3>
                <div class="info-item"><span class="info-label">Created:</span> ${createdDate}</div>
                <div class="info-item"><span class="info-label">Areas Addressed:</span> ${selectedAreas.length}</div>
                <div class="info-item"><span class="info-label">Exercises:</span> ${selectedExercises.length}</div>
                <div class="info-item"><span class="info-label">Protocol ID:</span> TP-${Date.now()}</div>
                <div class="info-item"><span class="info-label">Visit History:</span> ${visitHistory?.length || 0} visits</div>
            </div>
        </div>

        ${selectedAreas.length > 0 ? `
        <div class="section">
            <div class="section-title">Affected Areas</div>
            <div class="affected-areas">
                ${selectedAreas.map(area => 
                    `<span class="area-tag ${area.category}">${area.name}</span>`
                ).join('')}
            </div>
        </div>
        ` : ''}

        ${selectedExercises.length > 0 ? `
        <div class="section">
            <div class="section-title">Exercise Protocol</div>
            ${selectedExercises.map((exercise, index) => `
                <div class="exercise">
                    <div class="exercise-name">${index + 1}. ${exercise.name}</div>
                    <div class="exercise-description">${exercise.description}</div>
                    <div class="exercise-params">
                        <div class="param">
                            <div class="param-value">${exercise.customReps || 10}</div>
                            <div class="param-label">Repetitions</div>
                        </div>
                        <div class="param">
                            <div class="param-value">${exercise.customSets || 3}</div>
                            <div class="param-label">Sets</div>
                        </div>
                        <div class="param">
                            <div class="param-value">${exercise.customTime || 30}s</div>
                            <div class="param-label">Duration</div>
                        </div>
                        <div class="param">
                            <div class="param-value">${exercise.frequency}</div>
                            <div class="param-label">Frequency</div>
                        </div>
                    </div>
                    ${exercise.customNotes ? `
                    <div class="exercise-notes">
                        <strong>Special Instructions:</strong> ${exercise.customNotes}
                    </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${editedNutritionData || nutritionRecommendations ? `
        <div class="section">
            <div class="section-title">Treatment Recommendations</div>
            
            ${editedNutritionData?.bloodTests?.length > 0 ? `
            <div class="nutrition-section blood-tests">
                <div class="nutrition-section-title">📋 Recommended Blood Tests</div>
                <ul class="nutrition-list">
                    ${editedNutritionData.bloodTests.map(test => `<li>${test}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${editedNutritionData?.recommendedFoods?.length > 0 ? `
            <div class="nutrition-section recommended-foods">
                <div class="nutrition-section-title">🥗 Recommended Foods for Recovery</div>
                <ul class="nutrition-list">
                    ${editedNutritionData.recommendedFoods.map(food => `<li>${food}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${editedNutritionData?.foodsToAvoid?.length > 0 ? `
            <div class="nutrition-section avoid-foods">
                <div class="nutrition-section-title">🚫 Foods to Avoid</div>
                <ul class="nutrition-list">
                    ${editedNutritionData.foodsToAvoid.map(food => `<li>${food}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${editedNutritionData?.supplements?.length > 0 ? `
            <div class="nutrition-section supplements">
                <div class="nutrition-section-title">💊 Recommended Supplements</div>
                <ul class="nutrition-list">
                    ${editedNutritionData.supplements.map(supplement => `<li>${supplement}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${editedNutritionData?.generalAdvice?.length > 0 ? `
            <div class="nutrition-section general-advice">
                <div class="nutrition-section-title">💡 General Recovery Advice</div>
                <ul class="nutrition-list">
                    ${editedNutritionData.generalAdvice.map(advice => `<li>${advice}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${editedNutritionData?.precautions?.length > 0 ? `
            <div class="nutrition-section precautions">
                <div class="nutrition-section-title">⚠️ Important Precautions</div>
                <ul class="nutrition-list">
                    ${editedNutritionData.precautions.map(precaution => `<li>${precaution}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${editedNutritionData?.hydration ? `
            <div class="nutrition-section" style="background: #f0f9ff; border-left: 4px solid #06b6d4;">
                <div class="nutrition-section-title">💧 Hydration Guidelines</div>
                <div class="nutrition-content">${editedNutritionData.hydration}</div>
            </div>
            ` : ''}
            
            ${editedNutritionData?.generalGuidelines?.length > 0 ? `
            <div class="nutrition-section" style="background: #f8fafc; border-left: 4px solid #64748b;">
                <div class="nutrition-section-title">📋 General Guidelines</div>
                <ul class="nutrition-list">
                    ${editedNutritionData.generalGuidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${nutritionRecommendations ? `
            <div class="nutrition-section" style="background: #f0f9ff; border-left: 4px solid #0ea5e9;">
                <div class="nutrition-section-title">📝 Additional Manual Notes</div>
                <div class="nutrition-content">${nutritionRecommendations}</div>
            </div>
            ` : ''}
        </div>
        ` : ''}

        ${generalNotes ? `
        <div class="section">
            <div class="section-title">General Notes & Instructions</div>
            <div class="general-notes">
                <div class="nutrition-content">${generalNotes}</div>
            </div>
        </div>
        ` : ''}

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-label">Physiotherapist Signature</div>
            </div>
            <div class="signature-box">
                <div class="signature-label">Date</div>
            </div>
        </div>

        <div class="footer">
            <p>This treatment protocol is personalized for ${patient.full_name} and should be followed under professional guidance.</p>
            <p>Generated on ${createdDate} | ${clinic?.name || 'PhysioRehab Clinic'}</p>
        </div>
    </body>
    </html>
  `;

  return html;
};

export const downloadTreatmentProtocolPDF = async (protocol: TreatmentProtocol) => {
  try {
    // Debug: Log the protocol data to ensure all information is present
    console.log('PDF Protocol Data:', {
      patient: protocol.patient.full_name,
      areas: protocol.selectedAreas.length,
      exercises: protocol.selectedExercises.length,
      editedNutritionData: protocol.editedNutritionData,
      nutritionRecommendations: protocol.nutritionRecommendations,
      generalNotes: protocol.generalNotes,
      currentComplaint: protocol.currentComplaint,
      visitHistory: protocol.visitHistory?.length
    });

    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;
    
    const html = generateTreatmentProtocolHTML(protocol);
    
    // Create a temporary div to hold the HTML content
    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.width = '210mm'; // A4 width
    element.style.minHeight = '297mm'; // A4 height
    
    // PDF options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${protocol.patient.full_name.replace(/\s+/g, '_')}_Treatment_Protocol_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        width: 800,
        height: 1130
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };
    
    // Generate and download PDF
    await html2pdf().set(opt).from(element).save();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to HTML download
    const html = generateTreatmentProtocolHTML(protocol);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${protocol.patient.full_name}_Treatment_Protocol_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    alert('PDF generation failed. Downloaded as HTML file instead. You can open it in a browser and print to PDF.');
  }
};

export const printTreatmentProtocol = (protocol: TreatmentProtocol) => {
  const html = generateTreatmentProtocolHTML(protocol);
  
  // Open a new window with the protocol content for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
};