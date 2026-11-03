# AI Travel Concierge Assistant — Phases 1, 2 & 3

Personal AI Travel Concierge system built for **Ahmed Zainul** based on the official project scope:
- **Phase 1 Deliverables:** Core Assistant AI + WhatsApp (Twilio) Webhook + Bilingual (English & Spanish) + Multi-Traveler & Family Preferences.
- **Phase 2 Deliverables:** Duffel Flight & Hotel Search Engine + Top-3 Recommendation Workflow + USA/Mexico/Europe Support.
- **Phase 3 Deliverables:** Personal Automation: 3 Gmail Accounts Integration + Google Calendars & Automated Conflict Detection.

---

## 🌟 Key Features Implemented

### Phase 1: Core AI & Preferences
1. **Google Gemini 3.8 Flash & OpenAI GPT-4o Integration:**
   - Real-time travel reasoning + high-fidelity offline concierge engine fallback.
2. **Bilingual Engine (English & Español):**
   - Automatic language detection + manual toggle switcher (`🌐 Auto`, `🇬🇧 English`, `🇪🇸 Español`).
3. **Multi-Traveler & Family Profile Memory (`src/data/traveler_preferences.json`):**
   - Ahmed Zainul (Adult - Primary): Iberia Gold, Window + extra legroom, Halal meal.
   - Fatima Zainul (Adult - Spouse): Adjacent seat, Halal Veg meal, Iberia Silver.
   - Zayd Zainul (Child - Age 8): Middle seat, child meal & activity kit.
4. **Twilio WhatsApp Integration:**
   - Production webhook: `POST /api/whatsapp/webhook` with compliant TwiML XML formatting.

### Phase 2: Duffel Flight & Hotel Search (Top 3 Curation)
1. **Duffel API Client (`src/services/duffelService.js`):**
   - Supports live `DUFFEL_API_KEY` or built-in Duffel v2 Schema Sandbox engine.
   - Focus routes: USA, Mexico, and Europe (e.g. Monterrey `MTY` ➔ Madrid `MAD`).
2. **Top-3 Curation Ranking Workflow:**
   - Filters dozens of raw offers down to the **Top 3 Highest-Value Choices**:
     1. **Iberia (Top Recommended):** Loyalty tier points, 1 quick layover in MEX, Premium Economy row block.
     2. **Aeroméxico:** Club Premier Titanium bonus, MEX T2 lounge access, AM Plus seats.
     3. **Delta / Air France:** Alternative routing via Atlanta.
3. **Curated Salamanca / Madrid Accommodations (Duffel Stays):**
   - **Hotel Wellington & Spa (5-Star Luxury):** Family connected suite with gourmet buffet breakfast included.
   - **BLESS Hotel Madrid (5-Star Boutique):** Milla de Oro location, rooftop pool.
   - **H10 Villa de la Reina (4-Star Superior):** Historic central location.
4. **Safety & Zero-Unauthorized Booking Protocol:**
   - Strict explicit approval enforcement before any purchase or reservation.
   - Zero raw credit card storage.

### Phase 3: Personal Automation (3 Gmail Accounts + Google Calendars)
1. **3 Connected Gmail Inboxes (`src/services/gmailService.js`):**
   - Account 1: `ahmed.zainul@example.com` (Personal Primary)
   - Account 2: `ahmed.executive@familyoffice.com` (Family Office & Executive Board)
   - Account 3: `travel.concierge@zainulgroup.com` (Logistics & Bookings)
   - **Smart Confirmation Parsing:** Automatically scans, parses, and extracts airline PNRs (`IB-48209`), hotel guarantee references (`HW-77382`), seat assignments, and terminal updates.
2. **Google Calendar Automation (`src/services/calendarService.js`):**
   - Syncs across 3 active calendars (*Personal*, *Executive Board*, *Master Travel*).
   - **Automated Conflict Detection:** Scans executive obligations before booking (e.g. Madrid Board meeting alignment).
   - **One-Click Itinerary Sync:** Automatically schedules flight and hotel reservation blocks into Google Calendar with 24-hour and 3-hour departure reminders.

---

## 🚀 How to Run

1. **Start the server:**
   ```bash
   npm start
   ```
2. **Open the Executive Dashboard:**
   ```
   http://localhost:3000
   ```
3. **Twilio Production Webhook:**
   ```
   http://localhost:3000/api/whatsapp/webhook
   ```
