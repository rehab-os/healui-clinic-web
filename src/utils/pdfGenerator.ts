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
  createdDate: string;
}

export const generateTreatmentProtocolHTML = (protocol: TreatmentProtocol): string => {
  const { patient, clinic, protocolTitle, selectedAreas, selectedExercises, nutritionRecommendations, generalNotes, createdDate } = protocol;

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
            </div>
            <div class="info-section">
                <h3>Protocol Information</h3>
                <div class="info-item"><span class="info-label">Created:</span> ${createdDate}</div>
                <div class="info-item"><span class="info-label">Areas Addressed:</span> ${selectedAreas.length}</div>
                <div class="info-item"><span class="info-label">Exercises:</span> ${selectedExercises.length}</div>
                <div class="info-item"><span class="info-label">Protocol ID:</span> TP-${Date.now()}</div>
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

        ${nutritionRecommendations ? `
        <div class="section">
            <div class="section-title">Nutrition Recommendations</div>
            <div class="nutrition">
                <div class="nutrition-content">${nutritionRecommendations}</div>
            </div>
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

export const downloadTreatmentProtocolPDF = (protocol: TreatmentProtocol) => {
  const html = generateTreatmentProtocolHTML(protocol);
  
  // Create a blob with the HTML content
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${protocol.patient.full_name}_Treatment_Protocol_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
  
  // In a real application, you would use a library like puppeteer, jsPDF, or html2pdf
  // to convert HTML to PDF on the server side
  alert('Treatment Protocol downloaded as HTML file. You can open it in a browser and print to PDF.');
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