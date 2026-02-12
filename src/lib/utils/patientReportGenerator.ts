import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

interface ReportData {
  // Patient Info
  patient: {
    full_name: string
    date_of_birth?: string
    gender?: string
    phone?: string
    email?: string
    allergies?: string[]
    current_medications?: string[]
    medical_history?: string[]
  }

  // Visit Info
  appointment: {
    scheduled_date: string
    scheduled_time: string
    visit_type: string
    status: string
    chief_complaint?: string
  }

  // Clinic & Provider Info
  clinic: {
    name: string
    address?: string
    phone?: string
    email?: string
  }

  physiotherapist: {
    full_name: string
    license_number?: string
  }

  // Clinical Data
  visitConditions: Array<{
    condition_name: string
    body_region?: string
    treatment_focus?: string
    chief_complaint?: string
    condition?: {
      status: string
    }
  }>

  clinicalInsights?: Array<{
    insight_text: string
    insight_type: string
    pain_level?: number
    rom_measurements?: Record<string, number>
    functional_status?: string
    current_goals?: string[]
    created_at: string
  }>

  // Treatment Protocols
  protocols: Record<string, {
    home?: {
      protocol_title: string
      goals?: string[]
      exercises?: Array<{
        exercise_name: string
        exercise_description?: string
        custom_sets: number
        custom_reps: number
        custom_duration_seconds: number
        frequency?: string
      }>
      program_duration_weeks?: number
    }
    clinical?: {
      protocol_title: string
      goals?: string[]
      exercises?: Array<{
        exercise_name: string
        exercise_description?: string
        custom_sets: number
        custom_reps: number
        custom_duration_seconds: number
        frequency?: string
      }>
      program_duration_weeks?: number
    }
  }>

  // Nutrition
  dietaryProfile?: {
    recommended_foods?: Array<{
      item: string
      quantity?: string
      frequency?: string
      reason: string
    }>
    foods_to_avoid?: Array<{
      item: string
      reason: string
    }>
    supplements?: Array<{
      item: string
      quantity?: string
      frequency?: string
      reason: string
    }>
    hydration_guidelines?: string
    general_guidelines?: string
  }

  contraindications?: Array<{
    item: string
    type: string
    reason: string
    severity: string
  }>
}

export const generatePatientReport = (data: ReportData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  // Set default encoding to support proper text rendering
  doc.setLanguage('en')
  doc.setProperties({
    title: 'Clinical Assessment Report',
    subject: 'Patient Treatment Report',
    author: data.clinic.name,
    keywords: 'clinical, physiotherapy, treatment',
    creator: 'HealUI EMR System',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // Helper: Check if we need a new page
  const checkNewPage = (spaceNeeded: number) => {
    if (yPos + spaceNeeded > pageHeight - margin) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Helper: Add section header
  const addSectionHeader = (title: string) => {
    checkNewPage(15)

    // Gradient bar (simulated with rectangles)
    doc.setFillColor(13, 148, 136) // brand-teal
    doc.rect(margin, yPos, 60, 8, 'F')
    doc.setFillColor(20, 184, 166) // lighter teal
    doc.rect(margin + 60, yPos, 60, 8, 'F')
    doc.setFillColor(94, 234, 212) // lightest teal
    doc.rect(margin + 120, yPos, pageWidth - margin * 2 - 120, 8, 'F')

    // Section title - using plain text to avoid encoding issues
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.setCharSpace(0) // Reset character spacing
    doc.text(title, margin + 3, yPos + 5.5, { align: 'left' })

    yPos += 12
  }

  // Helper: Add subheading
  const addSubheading = (text: string) => {
    checkNewPage(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(55, 65, 81) // gray-700
    doc.text(text, margin, yPos, { align: 'left', baseline: 'top' })
    yPos += 6
  }

  // Helper: Add body text
  const addBodyText = (text: string, indent = 0) => {
    checkNewPage(8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99) // gray-600
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent)
    doc.text(lines, margin + indent, yPos)
    yPos += lines.length * 5 + 2
  }

  // ===================
  // HEADER - Elegant
  // ===================
  doc.setFillColor(249, 250, 251) // gray-50
  doc.rect(0, 0, pageWidth, 55, 'F')

  // Clinic Name - Large & Bold
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(17, 24, 39) // gray-900
  doc.text(data.clinic.name.toUpperCase(), margin, 15)

  // Document Title
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128) // gray-500
  doc.text('Clinical Assessment & Treatment Report', margin, 22)

  // Clinic Contact Info
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  let contactY = 28
  if (data.clinic.address) {
    doc.text(`Address: ${data.clinic.address}`, margin, contactY)
    contactY += 4
  }
  if (data.clinic.phone) {
    doc.text(`Phone: ${data.clinic.phone}`, margin, contactY)
    contactY += 4
  }
  if (data.clinic.email) {
    doc.text(`Email: ${data.clinic.email}`, margin, contactY)
  }

  // Date Badge - Top Right
  doc.setFillColor(13, 148, 136) // brand-teal
  doc.roundedRect(pageWidth - margin - 45, 12, 45, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(format(new Date(), 'MMM dd, yyyy'), pageWidth - margin - 42, 17)

  // Physiotherapist Info - Right side
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.text(`Dr. ${data.physiotherapist.full_name}`, pageWidth - margin - 60, 28, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  if (data.physiotherapist.license_number) {
    doc.text(`License: ${data.physiotherapist.license_number}`, pageWidth - margin - 60, 32, { align: 'right' })
  }
  doc.text('Physiotherapist', pageWidth - margin - 60, 36, { align: 'right' })

  // Divider line
  doc.setDrawColor(209, 213, 219) // gray-300
  doc.setLineWidth(0.5)
  doc.line(margin, 50, pageWidth - margin, 50)

  yPos = 65

  // ===================
  // PATIENT INFORMATION
  // ===================
  addSectionHeader('PATIENT INFORMATION')

  // Patient Details Grid
  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years`
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(data.patient.full_name, margin, yPos)
  yPos += 8

  // Patient details in a clean grid
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)

  const patientDetails = [
    ['Age', data.patient.date_of_birth ? calculateAge(data.patient.date_of_birth) : 'N/A'],
    ['Gender', data.patient.gender === 'M' ? 'Male' : data.patient.gender === 'F' ? 'Female' : 'Other'],
    ['Phone', data.patient.phone || 'N/A'],
    ['Email', data.patient.email || 'N/A'],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: patientDetails,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2,
      textColor: [75, 85, 99],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30, textColor: [55, 65, 81] },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  // Medical History
  const medicalHistory = Array.isArray(data.patient.medical_history)
    ? data.patient.medical_history
    : typeof data.patient.medical_history === 'string'
      ? [data.patient.medical_history]
      : []

  if (medicalHistory.length > 0) {
    addSubheading('Medical History')
    medicalHistory.forEach((item) => {
      addBodyText(`• ${item}`, 5)
    })
    yPos += 2
  }

  // Allergies
  const allergies = Array.isArray(data.patient.allergies)
    ? data.patient.allergies
    : typeof data.patient.allergies === 'string'
      ? [data.patient.allergies]
      : []

  if (allergies.length > 0) {
    addSubheading('Allergies')
    doc.setFillColor(254, 243, 199) // amber-100
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 6 + allergies.length * 5, 2, 2, 'F')
    yPos += 4
    allergies.forEach((allergy) => {
      addBodyText(`! ${allergy}`, 5)
    })
  }

  // Current Medications
  const medications = Array.isArray(data.patient.current_medications)
    ? data.patient.current_medications
    : typeof data.patient.current_medications === 'string'
      ? [data.patient.current_medications]
      : []

  if (medications.length > 0) {
    addSubheading('Current Medications')
    medications.forEach((med) => {
      addBodyText(`• ${med}`, 5)
    })
  }

  yPos += 5

  // ===================
  // VISIT DETAILS
  // ===================
  addSectionHeader('VISIT DETAILS')

  const visitDetails = [
    ['Visit Date', format(new Date(data.appointment.scheduled_date), 'MMMM dd, yyyy')],
    ['Visit Time', data.appointment.scheduled_time],
    ['Visit Type', data.appointment.visit_type.replace(/_/g, ' ')],
    ['Status', data.appointment.status.replace(/_/g, ' ')],
  ]

  autoTable(doc, {
    startY: yPos,
    body: visitDetails,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2,
      textColor: [75, 85, 99],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30, textColor: [55, 65, 81] },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 8

  // Chief Complaint
  if (data.appointment.chief_complaint) {
    addSubheading('Chief Complaint')
    doc.setFillColor(254, 243, 199) // amber-100
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F')
    yPos += 4
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    const complaintLines = doc.splitTextToSize(`"${data.appointment.chief_complaint}"`, pageWidth - margin * 2 - 10)
    doc.text(complaintLines, margin + 5, yPos)
    yPos += complaintLines.length * 5 + 6
  }

  // ===================
  // CLINICAL ASSESSMENT
  // ===================
  if (data.clinicalInsights && data.clinicalInsights.length > 0) {
    addSectionHeader('CLINICAL ASSESSMENT')

    data.clinicalInsights.forEach((insight, idx) => {
      checkNewPage(20)

      // Insight box
      doc.setFillColor(249, 250, 251) // gray-50
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 'auto', 2, 2, 'F')
      yPos += 3

      // Insight type badge
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(13, 148, 136) // brand-teal
      doc.text(insight.insight_type.replace(/_/g, ' '), margin + 3, yPos)
      yPos += 5

      // Insight text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(55, 65, 81)
      const insightLines = doc.splitTextToSize(insight.insight_text, pageWidth - margin * 2 - 6)
      doc.text(insightLines, margin + 3, yPos)
      yPos += insightLines.length * 5 + 3

      // Additional assessment data
      if (insight.pain_level !== undefined) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text(`Pain Level: ${insight.pain_level}/10`, margin + 3, yPos)
        yPos += 4
      }

      if (insight.functional_status) {
        doc.text(`Functional Status: ${insight.functional_status}`, margin + 3, yPos)
        yPos += 4
      }

      if (insight.current_goals && insight.current_goals.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(55, 65, 81)
        doc.text('Goals:', margin + 3, yPos)
        yPos += 4
        insight.current_goals.forEach((goal) => {
          doc.setFont('helvetica', 'normal')
          const goalLines = doc.splitTextToSize(`• ${goal}`, pageWidth - margin * 2 - 12)
          doc.text(goalLines, margin + 6, yPos)
          yPos += goalLines.length * 4
        })
      }

      yPos += 5
    })
  }

  // ===================
  // CONDITIONS & TREATMENT
  // ===================
  addSectionHeader('CONDITIONS & TREATMENT PLAN')

  data.visitConditions.forEach((condition, condIdx) => {
    checkNewPage(25)

    // Condition header
    doc.setFillColor(13, 148, 136) // brand-teal
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text(`${condIdx + 1}. ${condition.condition_name}`, margin + 3, yPos + 6.5)

    // Status badge
    if (condition.condition?.status) {
      doc.setFontSize(8)
      doc.text(condition.condition.status, pageWidth - margin - 25, yPos + 6.5)
    }

    yPos += 13

    // Condition details
    if (condition.body_region) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(75, 85, 99)
      doc.text(`Body Region: ${condition.body_region}`, margin + 3, yPos)
      yPos += 5
    }

    if (condition.chief_complaint) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      const complaintLines = doc.splitTextToSize(`"${condition.chief_complaint}"`, pageWidth - margin * 2 - 6)
      doc.text(complaintLines, margin + 3, yPos)
      yPos += complaintLines.length * 4 + 3
    }

    // Find protocols for this condition
    const conditionKey = Object.keys(data.protocols).find(key =>
      data.protocols[key].home || data.protocols[key].clinical
    )

    if (conditionKey && data.protocols[conditionKey]) {
      const protocols = data.protocols[conditionKey]

      // HOME PROTOCOL
      if (protocols.home) {
        checkNewPage(20)
        addSubheading('HOME EXERCISE PROTOCOL')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(55, 65, 81)
        doc.text(protocols.home.protocol_title, margin + 3, yPos)
        yPos += 5

        if (protocols.home.program_duration_weeks) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.text(`Program Duration: ${protocols.home.program_duration_weeks} weeks`, margin + 3, yPos)
          yPos += 5
        }

        // Goals
        if (protocols.home.goals && protocols.home.goals.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(55, 65, 81)
          doc.text('Treatment Goals:', margin + 3, yPos)
          yPos += 4
          protocols.home.goals.forEach((goal) => {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            const goalLines = doc.splitTextToSize(`- ${goal}`, pageWidth - margin * 2 - 10)
            doc.text(goalLines, margin + 6, yPos)
            yPos += goalLines.length * 4 + 1
          })
          yPos += 2
        }

        // Exercises Table
        if (protocols.home.exercises && protocols.home.exercises.length > 0) {
          checkNewPage(30)

          const exerciseData = protocols.home.exercises.map((ex) => [
            ex.exercise_name,
            `${ex.custom_sets} sets`,
            `${ex.custom_reps} reps`,
            `${ex.custom_duration_seconds}s`,
            ex.frequency || 'Daily',
          ])

          autoTable(doc, {
            startY: yPos,
            head: [['Exercise', 'Sets', 'Reps', 'Duration', 'Frequency']],
            body: exerciseData,
            theme: 'grid',
            headStyles: {
              fillColor: [13, 148, 136],
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: 'bold',
            },
            styles: {
              fontSize: 8,
              cellPadding: 2,
              textColor: [55, 65, 81],
            },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 20, halign: 'center' },
              2: { cellWidth: 20, halign: 'center' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 'auto', halign: 'center' },
            },
            margin: { left: margin },
          })

          yPos = (doc as any).lastAutoTable.finalY + 8
        }
      }

      // CLINICAL PROTOCOL
      if (protocols.clinical) {
        checkNewPage(20)
        addSubheading('CLINICAL PROTOCOL')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(55, 65, 81)
        doc.text(protocols.clinical.protocol_title, margin + 3, yPos)
        yPos += 5

        if (protocols.clinical.program_duration_weeks) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.text(`Program Duration: ${protocols.clinical.program_duration_weeks} weeks`, margin + 3, yPos)
          yPos += 5
        }

        // Goals
        if (protocols.clinical.goals && protocols.clinical.goals.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(55, 65, 81)
          doc.text('Treatment Goals:', margin + 3, yPos)
          yPos += 4
          protocols.clinical.goals.forEach((goal) => {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            const goalLines = doc.splitTextToSize(`- ${goal}`, pageWidth - margin * 2 - 10)
            doc.text(goalLines, margin + 6, yPos)
            yPos += goalLines.length * 4 + 1
          })
          yPos += 2
        }

        // Exercises Table
        if (protocols.clinical.exercises && protocols.clinical.exercises.length > 0) {
          checkNewPage(30)

          const exerciseData = protocols.clinical.exercises.map((ex) => [
            ex.exercise_name,
            `${ex.custom_sets} sets`,
            `${ex.custom_reps} reps`,
            `${ex.custom_duration_seconds}s`,
            ex.frequency || 'Per session',
          ])

          autoTable(doc, {
            startY: yPos,
            head: [['Exercise', 'Sets', 'Reps', 'Duration', 'Frequency']],
            body: exerciseData,
            theme: 'grid',
            headStyles: {
              fillColor: [139, 92, 246], // purple
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: 'bold',
            },
            styles: {
              fontSize: 8,
              cellPadding: 2,
              textColor: [55, 65, 81],
            },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 20, halign: 'center' },
              2: { cellWidth: 20, halign: 'center' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 'auto', halign: 'center' },
            },
            margin: { left: margin },
          })

          yPos = (doc as any).lastAutoTable.finalY + 8
        }
      }
    }

    yPos += 5
  })

  // ===================
  // NUTRITION & DIETARY GUIDELINES
  // ===================
  if (data.dietaryProfile) {
    addSectionHeader('NUTRITION & DIETARY GUIDELINES')

    // Recommended Foods
    if (data.dietaryProfile.recommended_foods && data.dietaryProfile.recommended_foods.length > 0) {
      addSubheading('Recommended Foods')

      const foodData = data.dietaryProfile.recommended_foods.map((food) => [
        food.item,
        food.quantity || '-',
        food.frequency || '-',
        food.reason,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Food Item', 'Quantity', 'Frequency', 'Reason']],
        body: foodData,
        theme: 'striped',
        headStyles: {
          fillColor: [16, 185, 129], // emerald
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [55, 65, 81],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' },
        },
        margin: { left: margin },
      })

      yPos = (doc as any).lastAutoTable.finalY + 8
    }

    // Foods to Avoid
    if (data.dietaryProfile.foods_to_avoid && data.dietaryProfile.foods_to_avoid.length > 0) {
      checkNewPage(20)
      addSubheading('Foods to Avoid')

      const avoidData = data.dietaryProfile.foods_to_avoid.map((food) => [
        food.item,
        food.reason,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Food Item', 'Reason']],
        body: avoidData,
        theme: 'striped',
        headStyles: {
          fillColor: [239, 68, 68], // red
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [55, 65, 81],
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 'auto' },
        },
        margin: { left: margin },
      })

      yPos = (doc as any).lastAutoTable.finalY + 8
    }

    // Supplements
    if (data.dietaryProfile.supplements && data.dietaryProfile.supplements.length > 0) {
      checkNewPage(20)
      addSubheading('Recommended Supplements')

      const supplementData = data.dietaryProfile.supplements.map((supp) => [
        supp.item,
        supp.quantity || '-',
        supp.frequency || '-',
        supp.reason,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Supplement', 'Dosage', 'Frequency', 'Reason']],
        body: supplementData,
        theme: 'striped',
        headStyles: {
          fillColor: [168, 85, 247], // purple
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [55, 65, 81],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' },
        },
        margin: { left: margin },
      })

      yPos = (doc as any).lastAutoTable.finalY + 8
    }

    // General Guidelines
    if (data.dietaryProfile.general_guidelines) {
      checkNewPage(15)
      addSubheading('General Guidelines')
      addBodyText(data.dietaryProfile.general_guidelines, 3)
    }

    // Hydration Guidelines
    if (data.dietaryProfile.hydration_guidelines) {
      checkNewPage(10)
      addSubheading('Hydration Guidelines')
      addBodyText(data.dietaryProfile.hydration_guidelines, 3)
    }
  }

  // ===================
  // CONTRAINDICATIONS
  // ===================
  if (data.contraindications && data.contraindications.length > 0) {
    checkNewPage(20)
    addSectionHeader('CONTRAINDICATIONS & PRECAUTIONS')

    const contraindicationData = data.contraindications.map((contra) => [
      contra.item,
      contra.type,
      contra.severity,
      contra.reason,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Item', 'Type', 'Severity', 'Reason']],
      body: contraindicationData,
      theme: 'striped',
      headStyles: {
        fillColor: [245, 158, 11], // amber
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [55, 65, 81],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' },
      },
      margin: { left: margin },
    })

    yPos = (doc as any).lastAutoTable.finalY + 8
  }

  // ===================
  // FOOTER - Professional
  // ===================
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Footer line
    doc.setDrawColor(209, 213, 219)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Footer text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175) // gray-400
    doc.text(
      `${data.clinic.name} • Generated on ${format(new Date(), 'MMMM dd, yyyy')}`,
      margin,
      pageHeight - 10
    )
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )

    // Confidentiality notice
    doc.setFontSize(7)
    doc.setTextColor(156, 163, 175)
    doc.text(
      'CONFIDENTIAL MEDICAL DOCUMENT - This report contains protected health information.',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    )
  }

  // Save the PDF
  const fileName = `${data.patient.full_name.replace(/\s+/g, '_')}_Clinical_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}
