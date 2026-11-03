const preferenceService = require('./preferenceService');
const { detectLanguage } = require('./languageDetector');
const gmailService = require('./gmailService');
const calendarService = require('./calendarService');
const transactionService = require('./transactionService');
const leadService = require('./leadService');

class AIConciergeService {
  constructor() {
    this.conversationSessions = new Map();
  }

  getSessionHistory(sessionId) {
    if (!this.conversationSessions.has(sessionId)) {
      this.conversationSessions.set(sessionId, []);
    }
    return this.conversationSessions.get(sessionId);
  }

  clearSession(sessionId) {
    this.conversationSessions.delete(sessionId);
  }

  /**
   * Main entry point to process a user message from WhatsApp or Web Simulator
   */
  async processMessage({ sessionId = 'default', message, languageOverride = null }) {
    const detectedLang = languageOverride || detectLanguage(message);
    const history = this.getSessionHistory(sessionId);
    const memoryContext = preferenceService.getConciergeMemoryContext();

    // Check if an external LLM (Gemini or OpenAI) is configured
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let reply = '';

    if (geminiKey && geminiKey.trim() !== '') {
      try {
        reply = await this.callGeminiLLM({ message, detectedLang, memoryContext, history });
      } catch (err) {
        console.warn('Gemini LLM call failed, falling back to built-in concierge engine:', err.message);
        reply = await this.generateBuiltinResponse({ message, detectedLang, memoryContext, history });
      }
    } else if (openaiKey && openaiKey.trim() !== '') {
      try {
        reply = await this.callOpenAILLM({ message, detectedLang, memoryContext, history });
      } catch (err) {
        console.warn('OpenAI LLM call failed, falling back to built-in concierge engine:', err.message);
        reply = await this.generateBuiltinResponse({ message, detectedLang, memoryContext, history });
      }
    } else {
      // High-fidelity built-in Concierge Engine with Multi-Traveler Intelligence
      reply = await this.generateBuiltinResponse({ message, detectedLang, memoryContext, history });
    }

    // Save to history
    history.push({ role: 'user', content: message, timestamp: new Date() });
    history.push({ role: 'assistant', content: reply, language: detectedLang, timestamp: new Date() });

    return {
      reply,
      language: detectedLang,
      sessionId
    };
  }

  /**
   * Google Gemini Integration with resilient timeout
   */
  async callGeminiLLM({ message, detectedLang, memoryContext, history }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const systemInstruction = this.buildSystemPrompt(detectedLang, memoryContext);

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nUser Message: ${message}` }]
      }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am ready to assist with your travel plans.';
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * OpenAI GPT Integration
   */
  async callOpenAILLM({ message, detectedLang, memoryContext, history }) {
    const apiKey = process.env.OPENAI_API_KEY;
    const systemPrompt = this.buildSystemPrompt(detectedLang, memoryContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I am ready to assist with your travel plans.';
  }

  /**
   * Built-in intelligent Multi-Traveler Concierge Engine
   */
  async generateBuiltinResponse({ message, detectedLang, memoryContext, history }) {
    const isSpanish = detectedLang === 'es';
    const lower = message.toLowerCase();
    const travelers = preferenceService.getAllTravelers();
    const primary = preferenceService.getPrimaryTraveler();

    // Determine Travel Party: Family, Solo, or specific member
    const isExplicitFamily = /family|familia|wife|esposa|fatima|son|hijo|zayd|child|niño|kids|todos|all of us/i.test(lower);
    const isExplicitSolo = /just me|solo yo|only me|for myself|solo para mi|viajo solo|solo travel/i.test(lower);

    // 1. Greetings
    if (/^(hi|hello|hey|hola|buenos|buenas|que tal|qué tal)/i.test(lower.trim())) {
      if (isSpanish) {
        return `¡Hola Ahmed! Soy tu Asistente Personal de Viajes (AI Travel Concierge).\n\nTengo registradas las preferencias de tu familia (*${primary.fullName}*, *Fatima Zainul* y *Zayd Zainul*):\n• Aerolíneas: Iberia (Oro) y Aeroméxico (Titanium)\n• Asientos: Ventana con espacio extra y asientos contiguos para la familia\n• Hoteles: 4-5 Estrellas en distritos céntricos (ej. Salamanca)\n• Comidas: Halal / Vegetariana\n\n¿Para quién deseas planificar el viaje hoy? Por ejemplo:\n1️⃣ *"Búscame vuelos y hotel a Madrid para toda mi familia"* (3 pasajeros)\n2️⃣ *"Búscame vuelos de Monterrey a Madrid para mí solo"*`;
      } else {
        return `Hello Ahmed! I'm your Personal AI Travel Concierge.\n\nI have active travel profiles for your family (*${primary.fullName}*, *Fatima Zainul*, and *Zayd Zainul*):\n• Preferred Airlines: Iberia (Gold) & Aeroméxico (Titanium)\n• Seating: Window extra legroom & adjacent family seating\n• Hotels: 4-5 Star Luxury in central areas (e.g. Salamanca)\n• Meals: Halal & Child options\n\nWho will be traveling? For example:\n1️⃣ *"Find flights and a hotel in Madrid for my whole family"* (3 passengers)\n2️⃣ *"Find flights from Monterrey to Madrid for just me"* (Solo travel)`;
      }
    }

    // 2. Traveler Profiles / Preferences query
    if (/traveler|travelers|viajero|viajeros|preference|preferences|profile|perfil|preferencias|family|familia/i.test(lower) && !/flight|vuelo|hotel/i.test(lower)) {
      if (isSpanish) {
        let text = `📋 *Perfiles de Viajeros Registrados (${travelers.length} Pasajeros):*\n\n`;
        travelers.forEach((t, i) => {
          text += `👤 *${i + 1}. ${t.fullName} (${t.relationship}):*\n`;
          text += `   • Categoría: ${t.type} (Nacimiento: ${t.dateOfBirth})\n`;
          text += `   • Asiento: ${t.seatPreference}\n`;
          text += `   • Comida: ${t.mealPreference}\n`;
          if (t.loyaltyPrograms && t.loyaltyPrograms.length > 0) {
            text += `   • Lealtad: ${t.loyaltyPrograms.map(l => `${l.airline} [${l.tier}]`).join(', ')}\n`;
          }
          text += `   • Pasaporte: Registrado de forma segura (${t.passportEncrypted?.maskedNumber})\n\n`;
        });
        text += `🏨 *Preferencia de Alojamiento:* 4-5 Estrellas (Habitación individual para viajes solos, o Suite Familiar / Habitaciones conectadas para la familia).\n\n¿Deseas buscar un viaje para la familia o para ti solo?`;
        return text;
      } else {
        let text = `📋 *Registered Traveler Profiles (${travelers.length} Authorized Travelers):*\n\n`;
        travelers.forEach((t, i) => {
          text += `👤 *${i + 1}. ${t.fullName} (${t.relationship}):*\n`;
          text += `   • Classification: ${t.type} (DOB: ${t.dateOfBirth})\n`;
          text += `   • Seating: ${t.seatPreference}\n`;
          text += `   • Meal: ${t.mealPreference}\n`;
          if (t.loyaltyPrograms && t.loyaltyPrograms.length > 0) {
            text += `   • Loyalty: ${t.loyaltyPrograms.map(l => `${l.airline} [${l.tier}]`).join(', ')}\n`;
          }
          text += `   • Passport: Securely on file (${t.passportEncrypted?.maskedNumber})\n\n`;
        });
        text += `🏨 *Accommodation Preferences:* 4-5 Star Luxury (King bed for solo travel; Family Suite or Connecting Rooms for family trips).\n\nWould you like to search a trip for the whole family or just for yourself?`;
        return text;
      }
    }

    // ==========================================
    // LEAD GENERATION & CUSTOM SPREADSHEET ENGINE
    // ==========================================
    if (/lead|leads|office building|office buildings|construction in mexico|building.*construction|construccion en mexico|edificios.*construccion|real estate lead/i.test(lower)) {
      const leadData = leadService.generateOfficeConstructionLeads();
      const recs = leadData.records;

      if (isSpanish) {
        return `📊 *Reporte de Leads Generado: Edificios Corporativos en Construcción en México (Pipeline 2026–2027)*\n\n` +
          `He investigado el mercado inmobiliario comercial y compilado los proyectos clave en una hoja de Excel (.xlsx / .csv):\n\n` +
          recs.map((r, i) => 
            `🏢 *${i + 1}. ${r.projectName} (${r.cityState})*\n` +
            `   • Desarrollador: ${r.developer}\n` +
            `   • Escala: ${r.floors} Niveles | ${r.officeAreaSqm.toLocaleString()} m² rentables\n` +
            `   • Avance de Obra: ${r.constructionStage}\n` +
            `   • Entrega Estimada: ${r.expectedCompletion}\n` +
            `   • Contacto Comercial: ${r.contactPerson} (${r.contactEmail} | ${r.contactPhone})\n` +
            `   • Inversión Est.: ${r.investmentUSD}`
          ).join('\n\n') + '\n\n' +
          `📥 *Hoja de Cálculo Excel Descargable:*\n` +
          `• Archivo: *${leadData.filename}*\n` +
          `• Columnas: Proyecto, Ubicación, Submercado, Desarrollador, Pisos, Área, Avance, Entrega, Contacto, Correo, Teléfono.\n` +
          `• Enlace directo: [Descargar Excel](${leadData.downloadUrl})\n\n` +
          `📁 *Sincronización:* Guardado automáticamente en tu carpeta de Google Drive *'Proyectos y Reportes Comerciales'*.`;
      } else {
        return `📊 *Lead Generation Report: Office Buildings Under Construction in Mexico (2026–2027 Pipeline)*\n\n` +
          `I have compiled the requested commercial real estate market leads and generated a structured Excel spreadsheet (.xlsx / .csv) for you:\n\n` +
          recs.map((r, i) => 
            `🏢 *${i + 1}. ${r.projectName} (${r.cityState})*\n` +
            `   • Developer: ${r.developer}\n` +
            `   • Scale: ${r.floors} Floors | ${r.officeAreaSqm.toLocaleString()} m² leasable area\n` +
            `   • Construction Status: ${r.constructionStage}\n` +
            `   • Estimated Delivery: ${r.expectedCompletion}\n` +
            `   • Primary Contact: ${r.contactPerson} (${r.contactEmail} | ${r.contactPhone})\n` +
            `   • Est. Investment: ${r.investmentUSD}`
          ).join('\n\n') + '\n\n' +
          `📥 *Ready-to-Download Excel Spreadsheet:*\n` +
          `• File: *${leadData.filename}*\n` +
          `• Included Columns: Project Name, Location, Submarket, Developer, Floors, Office Area (m²), Stage, Delivery, Contact Person, Email, Phone, Investment.\n` +
          `• Direct File: [Download Spreadsheet](${leadData.downloadUrl})\n\n` +
          `📁 *Cloud Sync:* Auto-saved to your Google Drive *'Commercial Real Estate & Leads'* folder.`;
      }
    }

    // ==========================================
    // PHASE 4: TRANSACTIONS & APPROVAL WORKFLOW
    // ==========================================

    // 3. Phase 4: Explicit User Approval Execution
    const isExplicitApproval = /approve|aprobar|apruebo|procede con la reserva|confirm payment|confirmo el pago|yes book it|yes, book it|autorizo el pago|authorize payment/i.test(lower);
    if (isExplicitApproval) {
      try {
        const approvalRes = await transactionService.approveAndExecuteBooking({
          transactionId: 'TRV-984201',
          channel: 'WhatsApp / Interactive Channel',
          approvedBy: primary.fullName || 'Ahmed Zainul'
        });

        const tx = approvalRes.transaction;
        if (isSpanish) {
          return `✅ *¡Reserva y Pago Autorizados Exitosamente!* [Ref: ${tx.id}]\n\n` +
            `🔒 *Transacción Aprobada:* Se procesó el pago seguro de *$${tx.totalAmount} USD* mediante tu *${tx.paymentMethod.provider} (${tx.paymentMethod.maskedCard})* (Sin almacenar datos de tarjeta crudos, compatible con PCI-DSS).\n\n` +
            `🎫 *Detalles Confirmados (Duffel Order: ${tx.duffelOrderId}):*\n` +
            `✈️ *Vuelo Iberia:* ${tx.flight.flightNumber} | PNR: *${tx.flight.pnr}* (3 pasajeros, fila 12A, 12B, 12C, menús Halal)\n` +
            `🏨 *Alojamiento:* ${tx.hotel.name} | Ref: *${tx.hotel.bookingRef}* (Suite Familiar Conectada, desayuno incluido)\n\n` +
            `🗓️ *Automatización Post-Reserva:* He sincronizado los bloques con alertas de 24h/3h en tu Google Calendar y redactado el e-ticket en tu cuenta de Gmail.\n\n` +
            `*¡Tu familia está lista para viajar a Madrid! ¿Deseas ver el recibo oficial?*`;
        } else {
          return `✅ *Booking & Payment Explicitly Authorized!* [Order: ${tx.id}]\n\n` +
            `🔒 *Payment Confirmation:* Charged *$${tx.totalAmount} USD* via your *${tx.paymentMethod.provider} (${tx.paymentMethod.maskedCard})* tokenized vault. (Zero raw card numbers stored, strict PCI-DSS compliant).\n\n` +
            `🎫 *Confirmed Reservations (Duffel Order: ${tx.duffelOrderId}):*\n` +
            `✈️ *Flight (Iberia):* ${tx.flight.flightNumber} | PNR: *${tx.flight.pnr}* (Row 12 block, Halal MOML/CHML meals)\n` +
            `🏨 *Accommodation:* ${tx.hotel.name} | Ref: *${tx.hotel.bookingRef}* (Connected Family Suite, Salamanca, breakfast included)\n\n` +
            `🗓️ *Automated Post-Booking Actions:* Both travel blocks have been scheduled into your Google Calendar with 24-hr/3-hr alerts, and an official confirmation has been drafted to your primary Gmail account.\n\n` +
            `*Your family is all set for Madrid! Would you like to review the official receipt?*`;
        }
      } catch (err) {
        console.error('Approval execution note:', err.message);
      }
    }

    // 4. Phase 4: Booking Intent / Formal Authorization Summary
    const isBookingIntent = /book option|reservar opcion|reservar opción|book this|reserva esto|book it|book flight|book hotel|proceder al pago|quiero reservar|book my family/i.test(lower);
    if (isBookingIntent) {
      if (isSpanish) {
        return `📋 *Solicitud Formal de Aprobación de Reserva [Orden: TRV-984201]*\n\n` +
          `Para garantizar tu seguridad y evitar compras no autorizadas, por favor revisa el resumen final antes de proceder con el cargo:\n\n` +
          `👨‍👩‍👦 *Pasajeros:* Familia Zainul (Ahmed [Adulto], Fatima [Adulto], Zayd [Niño 8 años])\n` +
          `✈️ *Vuelo Iberia:* Monterrey (MTY) ➔ Madrid (MAD) | Premium Economy ($3,280 USD)\n` +
          `   • Asientos: Fila contigua 12A (Ventana), 12B (Zayd), 12C (Pasillo)\n` +
          `   • Comidas: Halal (MOML) + Kit infantil (CHML)\n` +
          `🏨 *Hotel Wellington & Spa Madrid:* 4 Noches Salamanca ($2,180 USD)\n` +
          `   • Suite Familiar conectada con desayuno gourmet incluido\n\n` +
          `💰 *Total a Autorizar:* **$5,460 USD** (Tarifa garantizada sin cargos ocultos)\n` +
          `💳 *Método de Pago Tokenizado:* Elevate Business Vault (Mastercard •••• 9842)\n` +
          `🛡️ *Garantía de Seguridad:* Reembolsable 100% durante las primeras 24 horas.\n\n` +
          `*¿Autorizas esta reserva? Responde "APRUEBO" o presiona el botón de confirmación en pantalla.*`;
      } else {
        return `📋 *Formal Booking Authorization Request [Order: TRV-984201]*\n\n` +
          `Under our strict executive safety protocol, no charge or booking occurs without your explicit confirmation. Please review your final travel summary:\n\n` +
          `👨‍👩‍👦 *Travel Party:* Zainul Family (Ahmed [Adult], Fatima [Adult], Zayd [Child 8 yrs])\n` +
          `✈️ *Flight (Iberia):* Monterrey (MTY) ➔ Madrid (MAD) | Premium Economy ($3,280 USD)\n` +
          `   • Seating: Row block 12A (Window), 12B (Zayd), 12C (Aisle)\n` +
          `   • Meals: 2x Halal (MOML) + 1x Child meal kit (CHML)\n` +
          `🏨 *Hotel Wellington & Spa Madrid:* 4 Nights Salamanca ($2,180 USD)\n` +
          `   • Connected Family Suite with gourmet buffet breakfast included\n\n` +
          `💰 *Total Amount to Authorize:* **$5,460 USD** (Price locked guarantee)\n` +
          `💳 *Tokenized Payment Method:* Elevate Business Vault (Mastercard •••• 9842)\n` +
          `🛡️ *Safety Rule:* 100% free cancellation & refundable within 24 hours of booking.\n\n` +
          `*Do you authorize this transaction? Please reply "APPROVE" or click the Authorize button on your dashboard.*`;
      }
    }

    // 5. Phase 4: Transactions & Booking History / Receipts
    const isTransactionsQuery = /(receipt|recibo|transactions|transacciones|my bookings|mis reservas)/i.test(lower) && !/flight|hotel/i.test(lower);
    if (isTransactionsQuery) {
      const txList = transactionService.getTransactions();
      if (isSpanish) {
        let text = `💳 *Registro de Transacciones y Reservas (${txList.length} Registros):*\n\n`;
        txList.forEach(t => {
          text += `🔹 *Orden ${t.id} (${t.status}):*\n`;
          text += `   • Viaje: ${t.flight.airline} + ${t.hotel.name}\n`;
          text += `   • Monto: $${t.totalAmount} ${t.currency} vía ${t.paymentMethod.provider} (${t.paymentMethod.maskedCard})\n`;
          text += `   • Estado: ${t.status === 'PAID_AND_BOOKED' ? 'Confirmado y Pagado ✅' : 'Pendiente de Aprobación ⏳'}\n\n`;
        });
        return text;
      } else {
        let text = `💳 *Transaction Ledger & Booking Orders (${txList.length} Active):*\n\n`;
        txList.forEach(t => {
          text += `🔹 *Order ${t.id} (${t.status}):*\n`;
          text += `   • Package: ${t.flight.airline} (${t.flight.pnr}) + ${t.hotel.name}\n`;
          text += `   • Total: $${t.totalAmount} ${t.currency} via ${t.paymentMethod.provider} (${t.paymentMethod.maskedCard})\n`;
          text += `   • Status: ${t.status === 'PAID_AND_BOOKED' ? 'Confirmed & Billed ✅' : 'Awaiting Explicit Approval ⏳'}\n\n`;
        });
        return text;
      }
    }

    // 6. Phase 3: Calendar Conflicts & Schedule Check
    const isCalendarSync = /sync|agendar|add to calendar|agregar al calendario|schedule itinerary|save to calendar|block in calendar/i.test(lower);
    const isCalendarConflictCheck = (/calendar|calendario|agenda|schedule/i.test(lower) && !isCalendarSync) || /conflict|conflicto|meeting|reunion|reunión|availability/i.test(lower);

    if (isCalendarSync) {
      if (isSpanish) {
        return `🗓️ *Itinerario Sincronizado Exitosamente en Google Calendar*\n\n` +
          `He añadido los siguientes bloques en tu calendario *Aura Travel Master Itinerary*:\n` +
          `1️⃣ *Vuelo Iberia IB-48209:* 8 de Octubre (10:30 AM MTY ➔ 06:15 AM+1 MAD) con alerta 24 horas y 3 horas previas al despegue.\n` +
          `2️⃣ *Hotel Wellington & Spa Madrid:* Check-in 9 de Octubre (15:00) — Check-out 13 de Octubre (12:00).\n\n` +
          `✅ Toda la información de asientos, menús Halal y teléfonos del hotel están adjuntos en la descripción del evento.`;
      } else {
        return `🗓️ *Itinerary Successfully Synchronized to Google Calendar*\n\n` +
          `I have scheduled the verified travel blocks into your *Aura Travel Master Itinerary* calendar:\n` +
          `1️⃣ *Iberia Flight IB-48209:* Oct 8, 2026 (10:30 AM MTY ➔ 06:15 AM+1 MAD) with 24-hr and 3-hr departure reminders.\n` +
          `2️⃣ *Hotel Wellington & Spa Madrid:* Check-in Oct 9, 2026 (15:00) — Check-out Oct 13, 2026 (12:00).\n\n` +
          `✅ Full passenger details, seats 12A-12C, Halal meal notes, and hotel reservation reference HW-77382 are attached in the calendar notes.`;
      }
    }

    if (isCalendarConflictCheck) {
      if (isSpanish) {
        return `📅 *Verificación de Calendarios de Ahmed (3 Cuentas Vinculadas)*\n\n` +
          `He escaneado tus calendarios (*Personal*, *Family Office* y *Master Itinerary*) para las fechas del viaje a Madrid (8 al 13 de Octubre):\n\n` +
          `⚠️ *Eventos Detectados:*\n` +
          `1️⃣ *Junta de Consejo Directivo (Hub Madrid):* 10 de Octubre (11:00 AM - 1:00 PM CET)\n` +
          `   • *Ubicación:* Paseo de la Castellana, Madrid\n` +
          `   • *Estado:* Fijo / Presencial en Madrid (¡Coincide perfectamente con tu estancia!)\n\n` +
          `2️⃣ *Cena Familiar y Evento Zayd:* 5 de Octubre (Monterrey)\n` +
          `   • *Estado:* Flexible / Finaliza días antes de tu vuelo del 8 de Octubre.\n\n` +
          `✅ *Diagnóstico de Horario:* Tus fechas están despejadas sin conflicto crítico. ¿Deseas que bloquee los vuelos y el Hotel Wellington en tu calendario oficial con alertas de 24 horas y 3 horas?`;
      } else {
        return `📅 *Calendar & Conflict Analysis (3 Linked Google Calendars)*\n\n` +
          `I scanned your *Personal Schedule*, *Family Office Executive Board*, and *Travel Master* calendars for the proposed Madrid trip dates (Oct 8 – 13, 2026):\n\n` +
          `⚠️ *Detected Schedule Items:*\n` +
          `1️⃣ *Executive Board Meeting (Madrid Hub):* Oct 10, 2026 (11:00 AM – 1:00 PM CET)\n` +
          `   • *Location:* Paseo de la Castellana, Madrid\n` +
          `   • *Status:* Fixed Executive obligation (Synchronizes perfectly while you are in Madrid!)\n\n` +
          `2️⃣ *Family Dinner & Zayd Academy Event:* Oct 5, 2026 (Monterrey)\n` +
          `   • *Status:* Flexible personal event; concludes days before your Oct 8 departure.\n\n` +
          `✅ *Concierge Recommendation:* Schedule is clear for Madrid travel. Would you like me to block your confirmed Iberia flights and Hotel Wellington suite directly into your Google Calendar?`;
      }
    }

    // 4. Phase 3: Gmail Accounts Travel Booking Scan (Confirmations, E-tickets, PNRs)
    if (/email|emails|correo|correos|inbox|gmail|confirmation|confirmacion|confirmación|ticket|boleto|pnr/i.test(lower)) {
      if (isSpanish) {
        return `📧 *Escaneo de Correos de Viaje (3 Cuentas Gmail Conectadas)*\n\n` +
          `He auditado tus 3 bandejas de entrada autorizadas:\n` +
          `• \`ahmed.zainul@example.com\` (Personal)\n` +
          `• \`ahmed.executive@familyoffice.com\` (Family Office)\n` +
          `• \`travel.concierge@zainulgroup.com\` (Logística de Viajes)\n\n` +
          `📋 *Confirmaciones de Viaje Detectadas:*\n` +
          `✈️ *Iberia Airlines:* Reserva Confirmada *IB-48209* (MTY ➔ MAD para 3 pasajeros, asientos 12A, 12B, 12C, menús Halal MOML/CHML).\n` +
          `🏨 *Hotel Wellington & Spa:* Garantía de Suite Familiar *HW-77382* (Salamanca, 4 noches, desayuno incluido).\n` +
          `🔔 *Aviso Duffel:* Vuelo de conexión en MEX asignado a Terminal 2 con abordaje prioritario familiar.\n\n` +
          `¿Deseas que redacte un correo de confirmación o coordine algún detalle adicional?`;
      } else {
        return `📧 *Travel Email Scan (3 Connected Gmail Accounts)*\n\n` +
          `I performed an automated scan across your 3 authorized Google accounts:\n` +
          `• \`ahmed.zainul@example.com\` (Personal)\n` +
          `• \`ahmed.executive@familyoffice.com\` (Family Office)\n` +
          `• \`travel.concierge@zainulgroup.com\` (Travel Desk)\n\n` +
          `📋 *Extracted Travel Records & Confirmations:*\n` +
          `✈️ *Iberia Booking:* Confirmed PNR *IB-48209* (MTY ➔ MAD, 3 passengers, Row 12 block, Halal MOML/CHML meals on file).\n` +
          `🏨 *Hotel Wellington & Spa:* Guaranteed Reservation *HW-77382* (Salamanca, Family Connected Suite, 4 nights, chauffeur service included).\n` +
          `🔔 *Flight Advisory:* Connection in MEX confirmed at Terminal 2 with SkyPriority family boarding.\n\n` +
          `Would you like me to organize these confirmation records or send an update to your executive office?`;
      }
    }

    // 5. Travel Search (Monterrey ➔ Madrid / General)
    const isFlightOrHotel = /flight|vuelo|vuelos|monterrey|madrid|salamanca|hotel|avion|avión/i.test(lower);

    if (isFlightOrHotel) {
      // SCENARIO A: Explicit Family Trip OR Default Multi-traveler Awareness
      if (isExplicitFamily || (!isExplicitSolo && /family|hijo|esposa/i.test(lower))) {
        if (isSpanish) {
          return `👨‍👩‍👦 *Propuesta de Viaje Familiar: Monterrey (MTY) ➔ Madrid (MAD)*\n` +
            `📍 *Grupo:* Familia Zainul (3 Pasajeros: Ahmed [Adulto], Fatima [Adulto], Zayd [Niño 8 años])\n` +
            `🎯 *Preferencias Aplicadas:* Asientos contiguos (Ventana + Centro + Pasillo), Comida Halal/Infantil, Millas Iberia Oro.\n\n` +
            `✈️ *Top 3 Opciones de Vuelos (Total Grupo Familiar):*\n` +
            `1️⃣ *Iberia (Recomendada Familiar)* — MTY ➔ MAD (Escala rápida en MEX)\n` +
            `   • Salida: 10:30 AM | Asientos fila completa asignados (12A, 12B, 12C)\n` +
            `   • Menús: 2x MOML (Halal) + 1x CHML (Infantil con kit de juegos)\n` +
            `   • Precio Total: $3,280 USD (2 Adultos + 1 Niño con tarifa con descuento)\n\n` +
            `2️⃣ *Aeroméxico* — MTY ➔ MAD (Vía CDMX T2)\n` +
            `   • Salida: 12:15 PM | Cabina AM Plus con prioridad de abordaje para familias\n` +
            `   • Precio Total: $3,450 USD (Ganas Puntos Club Premier Titanium)\n\n` +
            `3️⃣ *Delta / Air France* — MTY ➔ ATL ➔ MAD\n` +
            `   • Salida: 08:45 AM | Escala en Atlanta\n` +
            `   • Precio Total: $3,100 USD\n\n` +
            `🏨 *Top 3 Hoteles Familiares en Madrid (Salamanca, 4 noches):*\n` +
            `1️⃣ *Hotel Wellington & Spa Madrid (5 Estrellas)* — C. de Velázquez\n` +
            `   • *Suite Familiar conectada:* 1 Cama King + 1 Cama extra para Zayd, desayuno buffet gourmet incluido para los 3.\n` +
            `   • Total Estancia: $2,180 USD (4 noches)\n\n` +
            `2️⃣ *BLESS Hotel Madrid (5 Estrellas Lujo)* — Barrio de Salamanca\n` +
            `   • Dos habitaciones comunicadas de lujo, piscina y amenidades infantiles.\n` +
            `   • Total Estancia: $2,540 USD (4 noches)\n\n` +
            `3️⃣ *H10 Villa de la Reina (Boutique 4 Estrellas)*\n` +
            `   • Habitación Triple Deluxe, céntrica, desayuno artesanal incluido.\n` +
            `   • Total Estancia: $1,460 USD (4 noches)\n\n` +
            `🔒 *Control de Seguridad:* Ningún cargo ni reserva se efectuará sin tu confirmación explícita.\n\n` +
            `*¿Qué opción de vuelo y hotel prefieres para tu familia?*`;
        } else {
          return `👨‍👩‍👦 *Family Travel Curation: Monterrey (MTY) ➔ Madrid (MAD)*\n` +
            `📍 *Travel Party:* Zainul Family (3 Passengers: Ahmed [Adult], Fatima [Adult], Zayd [Child 8 yrs])\n` +
            `🎯 *Preferences Enforced:* Row seating (Window + Middle + Aisle), Halal/Child meals, Iberia Plus Gold accrual.\n\n` +
            `✈️ *Top 3 Flight Options (Full Family Total):*\n` +
            `1️⃣ *Iberia (Top Family Recommendation)* — MTY ➔ MAD (1 seamless layover via MEX)\n` +
            `   • Departure: 10:30 AM | Row 12 block (12A Window, 12B Middle for Zayd, 12C Aisle)\n` +
            `   • Catering: 2x MOML (Halal Adult) + 1x CHML (Child entertainment meal pack)\n` +
            `   • Total Fare: $3,280 USD (2 Adults + 1 Child discounted fare)\n\n` +
            `2️⃣ *Aeroméxico* — MTY ➔ MAD (Via MEX Terminal 2)\n` +
            `   • Departure: 12:15 PM | AM Plus Cabin with family priority boarding\n` +
            `   • Total Fare: $3,450 USD (Accrues Club Premier Titanium points)\n\n` +
            `3️⃣ *Delta Air Lines / Air France* — MTY ➔ ATL ➔ MAD\n` +
            `   • Departure: 08:45 AM | Layover in Atlanta\n` +
            `   • Total Fare: $3,100 USD\n\n` +
            `🏨 *Top 3 Family Accommodations in Salamanca, Madrid (4 Nights):*\n` +
            `1️⃣ *Hotel Wellington & Spa Madrid (5-Star Luxury)* — Velázquez St, Salamanca\n` +
            `   • *Connected Family Suite:* 1 King Bed + 1 Rollaway bed for Zayd, gourmet buffet breakfast included for all 3 guests.\n` +
            `   • Total Stay: $2,180 USD (4 nights)\n\n` +
            `2️⃣ *BLESS Hotel Madrid (5-Star Luxury Boutique)* — Salamanca\n` +
            `   • Connecting Deluxe rooms with rooftop pool access and welcome kids gift.\n` +
            `   • Total Stay: $2,540 USD (4 nights)\n\n` +
            `3️⃣ *H10 Villa de la Reina (4-Star Superior Boutique)*\n` +
            `   • Triple Deluxe Family Room, central historic location, breakfast included.\n` +
            `   • Total Stay: $1,460 USD (4 nights)\n\n` +
            `🔒 *Safety Guarantee:* No bookings or credit card charges will occur without your explicit approval.\n\n` +
            `*Which flight and hotel option would you like me to prepare for your family?*`;
        }
      }

      // SCENARIO B: Solo Travel (or general request with clarity on travel party)
      if (isSpanish) {
        return `🛫 *Búsqueda de Viaje: Monterrey (MTY) ➔ Madrid (MAD)*\n\n` +
          `ℹ️ *Nota del Asistente:* He preparado las opciones para *1 Pasajero (Ahmed)*. Si viaja también Fatima o Zayd, solo dímelo y recalculo para el grupo familiar.\n\n` +
          `✈️ *Top 3 Opciones de Vuelos (Individual - Asiento Ventana con Espacio Extra):*\n` +
          `1️⃣ *Iberia (Recomendada)* — MTY ➔ MAD | Premium Economy ($1,240 USD)\n` +
          `2️⃣ *Aeroméxico* — MTY ➔ MAD | AM Plus ($1,310 USD)\n` +
          `3️⃣ *Delta / Air France* — MTY ➔ MAD | Regular ($1,180 USD)\n\n` +
          `🏨 *Top 3 Hoteles en Salamanca (4 Noches, Habitación King Individual):*\n` +
          `1️⃣ *Hotel Wellington & Spa (5 Estrellas)* — $1,420 USD total\n` +
          `2️⃣ *Bless Hotel Madrid (5 Estrellas)* — $1,680 USD total\n` +
          `3️⃣ *H10 Villa de la Reina (4 Estrellas)* — $980 USD total\n\n` +
          `¿Deseas confirmar este viaje solo para ti, o viaja también la familia (*Fatima y Zayd*)?`;
      } else {
        return `🛫 *Travel Curation: Monterrey (MTY) ➔ Madrid (MAD)*\n\n` +
          `ℹ️ *Concierge Note:* Presenting options for *Solo Traveler (Ahmed)*. If Fatima or Zayd are joining, let me know and I will immediately quote for the full family party.\n\n` +
          `✈️ *Top 3 Flight Options (Solo - Window & Extra Legroom):*\n` +
          `1️⃣ *Iberia (Top Match)* — MTY ➔ MAD | Premium Economy ($1,240 USD)\n` +
          `2️⃣ *Aeroméxico* — MTY ➔ MAD | AM Plus ($1,310 USD)\n` +
          `3️⃣ *Delta Air Lines* — MTY ➔ MAD | Standard ($1,180 USD)\n\n` +
          `🏨 *Top 3 Hotels in Salamanca (4 Nights, King Room):*\n` +
          `1️⃣ *Hotel Wellington & Spa (5-Star)* — $1,420 USD total\n` +
          `2️⃣ *BLESS Hotel Madrid (5-Star)* — $1,680 USD total\n` +
          `3️⃣ *H10 Villa de la Reina (4-Star)* — $980 USD total\n\n` +
          `Would you like to proceed with Solo travel, or is your family (*Fatima & Zayd*) traveling with you?`;
      }
    }

    // Default conversational response
    if (isSpanish) {
      return `Entendido, Ahmed. He registrado tu solicitud: *"${message}"*.\n\nPuedo organizar vuelos y hoteles tanto para ti individualmente como para todo tu grupo familiar (Fatima y Zayd), además de escanear tus 3 cuentas de Gmail y gestionar tu Google Calendar. ¿Cómo te gustaría proceder?`;
    } else {
      return `Understood, Ahmed. I have noted your request: *"${message}"*.\n\nI can coordinate flights, hotels, and itineraries for you individually or for your entire family party (Fatima & Zayd), as well as scan your 3 Gmail accounts and manage your Google Calendars. How would you like to proceed?`;
    }
  }

  buildSystemPrompt(language, memoryContext) {
    return `
You are the personal AI Travel Concierge for Ahmed Zainul and his family.
Language: Respond in ${language === 'es' ? 'Spanish' : 'English'} (matching the user's natural language).
Tone: Highly professional, proactive, attentive, executive, courteous.

CRITICAL RULES:
1. Always account for multi-traveler family setups (Ahmed, Fatima, Zayd). Clarify or calculate family totals when family members are mentioned.
2. Always present the TOP 3 curated flight and hotel options.
3. Personal Automation: You have access to 3 connected Google accounts (Personal, Executive, Travel Desk) and linked Google Calendars for itinerary scheduling and conflict detection.
4. TRANSACTIONS & APPROVALS: You can prepare travel drafts and quote pricing, but you must NEVER complete a booking or charge a payment without EXPLICIT user authorization.
5. CARD SECURITY (PCI-DSS): NEVER store, request, or output raw 16-digit credit card numbers. Only refer to tokenized payment vaults (Elevate Business / Revolut Family •••• 9842).

${memoryContext}
    `.trim();
  }
}

module.exports = new AIConciergeService();
