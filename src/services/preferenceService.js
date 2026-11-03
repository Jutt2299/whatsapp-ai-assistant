const fs = require('fs');
const path = require('path');

const PREFERENCES_FILE = path.join(__dirname, '../data/traveler_preferences.json');

class PreferenceService {
  constructor() {
    this.preferences = this.loadPreferences();
  }

  loadPreferences() {
    try {
      if (fs.existsSync(PREFERENCES_FILE)) {
        const raw = fs.readFileSync(PREFERENCES_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading preferences file:', err.message);
    }
    return {};
  }

  savePreferences() {
    try {
      this.preferences.lastUpdated = new Date().toISOString();
      fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(this.preferences, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error writing preferences file:', err.message);
      return false;
    }
  }

  getAllPreferences() {
    return this.preferences;
  }

  getAllTravelers() {
    return this.preferences.travelers || [];
  }

  getPrimaryTraveler() {
    return (this.preferences.travelers || []).find(t => t.isPrimary) || this.preferences.travelers?.[0] || {};
  }

  getTravelerByName(name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    return (this.preferences.travelers || []).find(t => 
      t.fullName.toLowerCase().includes(lower) || 
      (t.preferredName && t.preferredName.toLowerCase().includes(lower))
    );
  }

  addTraveler(traveler) {
    if (!this.preferences.travelers) {
      this.preferences.travelers = [];
    }
    traveler.id = `trav_${Date.now()}`;
    this.preferences.travelers.push(traveler);
    this.savePreferences();
    return traveler;
  }

  updateTraveler(id, updates) {
    const idx = (this.preferences.travelers || []).findIndex(t => t.id === id);
    if (idx !== -1) {
      this.preferences.travelers[idx] = { ...this.preferences.travelers[idx], ...updates };
      this.savePreferences();
      return this.preferences.travelers[idx];
    }
    return null;
  }

  /**
   * Generates a comprehensive multi-traveler memory context for the LLM
   */
  getConciergeMemoryContext() {
    const travelers = this.preferences.travelers || [];
    const hotel = this.preferences.hotelPreferences || {};
    const rules = this.preferences.generalTravelRules || {};

    const travelerProfiles = travelers.map((t, i) => `
Traveler #${i + 1}: ${t.fullName} (${t.relationship}, Type: ${t.type}, DOB: ${t.dateOfBirth || 'N/A'})
- Seating: ${t.seatPreference}
- Cabin Class: ${t.cabinPreference || 'Premium'}
- Meal Preference: ${t.mealPreference}
- Loyalty Programs: ${(t.loyaltyPrograms || []).map(l => `${l.airline}: ${l.memberNumber} (${l.tier})`).join('; ') || 'None'}
- Passport on Record: ${t.passportEncrypted?.maskedNumber || 'Encrypted'} (${t.passportEncrypted?.nationality || 'N/A'})
    `.trim()).join('\n');

    return `
=== MULTI-TRAVELER & FAMILY PROFILE MEMORY ===
Family/Travel Group: ${this.preferences.travelGroup?.familyGroupName || 'Zainul Family'}
Primary Contact: ${this.preferences.travelGroup?.primaryContactPhone || '+52 81 1234 5678'}

REGISTERED TRAVELERS (${travelers.length} People On File):
${travelerProfiles}

HOTEL PREFERENCES:
- Category: ${hotel.starRating || '4-5 Star'}
- Chains: ${(hotel.preferredChains || []).join(', ')}
- Solo Room: ${hotel.roomTypeSolo}
- Family Room: ${hotel.roomTypeFamily}
- Amenities: ${(hotel.amenitiesRequired || []).join(', ')}

OPERATIONAL & SAFETY RULES:
- Always check if the trip is for Solo (Ahmed), Couple (Ahmed & Fatima), or Full Family (all 3 travelers).
- Curate and present TOP 3 options (clean, transparent pricing per person and total for the party).
- NEVER finalize bookings or charge cards without EXPLICIT user confirmation.
- NEVER request or store raw credit cards.
==============================================
    `.trim();
  }
}

module.exports = new PreferenceService();
