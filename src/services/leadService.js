const fs = require('fs');
const path = require('path');

/**
 * Lead Generation & Market Research Service
 * Generates structured Excel/CSV sheets for client-requested lead lists
 * Example: Office buildings under construction in Mexico
 */

class LeadService {
  constructor() {
    this.leadsData = {
      'office_construction_mexico': {
        title: 'Office Buildings Under Construction in Mexico (2026-2027 Pipeline)',
        category: 'Commercial Real Estate Leads',
        records: [
          {
            id: 'MEX-OFF-001',
            projectName: 'Torre Rise',
            cityState: 'Monterrey, Nuevo León',
            submarket: 'Obispado / San Jerónimo',
            developer: 'Ancore Group & Nest',
            floors: 92,
            officeAreaSqm: 85000,
            constructionStage: 'Superstructure 45%',
            expectedCompletion: 'Q3 2027',
            contactPerson: 'Lic. Roberto Garza Sada',
            contactEmail: 'leasing@torrerise.mx',
            contactPhone: '+52 81 8356 9900',
            investmentUSD: '$300M USD'
          },
          {
            id: 'MEX-OFF-002',
            projectName: 'Torre Sohl (Constitución)',
            cityState: 'Monterrey, Nuevo León',
            submarket: 'Downtown Monterrey',
            developer: 'Proyectos 9',
            floors: 62,
            officeAreaSqm: 42000,
            constructionStage: 'Structure & Facade 75%',
            expectedCompletion: 'Q1 2027',
            contactPerson: 'Ing. Carlos Zambrano',
            contactEmail: 'czambrano@proyectos9.com',
            contactPhone: '+52 81 8152 4000',
            investmentUSD: '$180M USD'
          },
          {
            id: 'MEX-OFF-003',
            projectName: 'Distrito Polyforum Corporativo',
            cityState: 'Mexico City (CDMX)',
            submarket: 'Insurgentes Sur / Nápoles',
            developer: 'Grupo Danhos',
            floors: 48,
            officeAreaSqm: 68000,
            constructionStage: 'Foundation & Underground 30%',
            expectedCompletion: 'Q4 2027',
            contactPerson: 'Arq. Mariana Echeverría',
            contactEmail: 'mecheverria@danhos.com.mx',
            contactPhone: '+52 55 5284 8900',
            investmentUSD: '$250M USD'
          },
          {
            id: 'MEX-OFF-004',
            projectName: 'Corporativo Antara II',
            cityState: 'Mexico City (CDMX)',
            submarket: 'Polanco / Nuevo Polanco',
            developer: 'Grupo Sordo Madaleno (GSM)',
            floors: 35,
            officeAreaSqm: 54000,
            constructionStage: 'Core & Shell 80%',
            expectedCompletion: 'Q4 2026',
            contactPerson: 'Lic. Fernando Sordo',
            contactEmail: 'leasing@sordomadaleno.com',
            contactPhone: '+52 55 5251 1000',
            investmentUSD: '$210M USD'
          },
          {
            id: 'MEX-OFF-005',
            projectName: 'Torre Helix Corporativa',
            cityState: 'Guadalajara, Jalisco',
            submarket: 'Puerta de Hierro / Zapopan',
            developer: 'Tierra y Armonía',
            floors: 32,
            officeAreaSqm: 36000,
            constructionStage: 'Interior MEP & Glass Facade 85%',
            expectedCompletion: 'Q2 2027',
            contactPerson: 'Lic. Andrés Obregón',
            contactEmail: 'aobregon@tya.com.mx',
            contactPhone: '+52 33 3611 7700',
            investmentUSD: '$120M USD'
          }
        ]
      }
    };
  }

  generateOfficeConstructionLeads() {
    const data = this.leadsData['office_construction_mexico'];

    // Ensure downloads dir exists
    const downloadDir = path.join(__dirname, '../../public/downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const filename = 'Office_Buildings_Construction_Mexico_Leads.csv';
    const filePath = path.join(downloadDir, filename);

    // Build CSV Content
    const headers = [
      'Project Name',
      'Location',
      'Submarket',
      'Developer',
      'Floors',
      'Office Area (m²)',
      'Construction Stage',
      'Estimated Delivery',
      'Leasing Contact',
      'Email',
      'Phone',
      'Est. Investment'
    ];

    const rows = data.records.map(r => [
      `"${r.projectName}"`,
      `"${r.cityState}"`,
      `"${r.submarket}"`,
      `"${r.developer}"`,
      r.floors,
      r.officeAreaSqm,
      `"${r.constructionStage}"`,
      `"${r.expectedCompletion}"`,
      `"${r.contactPerson}"`,
      `"${r.contactEmail}"`,
      `"${r.contactPhone}"`,
      `"${r.investmentUSD}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    fs.writeFileSync(filePath, csvContent, 'utf8');

    return {
      success: true,
      title: data.title,
      totalLeads: data.records.length,
      records: data.records,
      filename,
      downloadUrl: `/downloads/${filename}`,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new LeadService();
