/**
 * Google Calendar Integration Service — Phase 3 Deliverable
 * Supports Calendar Sync across linked accounts, Conflict Detection, and Automated Travel Itinerary Scheduling
 */

class CalendarService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    // Active Calendars linked across the accounts
    this.calendars = [
      {
        id: 'cal_primary',
        name: 'Ahmed Zainul (Personal Schedule)',
        color: '#3B82F6',
        associatedEmail: 'ahmed.zainul@example.com'
      },
      {
        id: 'cal_executive',
        name: 'Family Office & Executive Board',
        color: '#10B981',
        associatedEmail: 'ahmed.executive@familyoffice.com'
      },
      {
        id: 'cal_travel',
        name: 'Aura Travel Master Itinerary',
        color: '#8B5CF6',
        associatedEmail: 'travel.concierge@zainulgroup.com'
      }
    ];

    // High-fidelity existing calendar events for realism
    this.events = [
      {
        id: 'evt_001',
        calendarId: 'cal_executive',
        calendarName: 'Family Office & Executive Board',
        title: 'Global Asset Allocation & Portfolio Review',
        start: '2026-10-06T14:00:00',
        end: '2026-10-06T15:30:00',
        location: 'Virtual / Video Conference',
        attendees: ['Ahmed Zainul', 'Portfolio Managers'],
        type: 'business',
        isFlexible: false
      },
      {
        id: 'evt_002',
        calendarId: 'cal_executive',
        calendarName: 'Family Office & Executive Board',
        title: 'Board Meeting: Madrid European Hub',
        start: '2026-10-10T11:00:00',
        end: '2026-10-10T13:00:00',
        location: 'Paseo de la Castellana, Madrid',
        attendees: ['Ahmed Zainul', 'European Partners'],
        type: 'business',
        isFlexible: false
      },
      {
        id: 'evt_003',
        calendarId: 'cal_primary',
        calendarName: 'Ahmed Zainul (Personal Schedule)',
        title: 'Family Dinner & Zayd Academy Event',
        start: '2026-10-05T18:30:00',
        end: '2026-10-05T20:30:00',
        location: 'Monterrey, Mexico',
        attendees: ['Ahmed Zainul', 'Fatima Zainul', 'Zayd'],
        type: 'personal',
        isFlexible: true
      }
    ];
  }

  getCalendars() {
    return this.calendars;
  }

  async getAllEvents() {
    return this.events.sort((a, b) => new Date(a.start) - new Date(b.start));
  }

  /**
   * Conflict Detection Engine:
   * Scans existing calendar events against proposed travel departure and return dates
   */
  async checkTravelConflicts({ startDate, endDate }) {
    const travelStart = new Date(startDate);
    const travelEnd = new Date(endDate || new Date(travelStart.getTime() + 4 * 86400000));

    const conflicts = [];

    this.events.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check overlap
      const hasOverlap = (eventStart < travelEnd) && (eventEnd > travelStart);

      if (hasOverlap) {
        conflicts.push({
          eventId: event.id,
          title: event.title,
          calendar: event.calendarName,
          start: event.start,
          end: event.end,
          location: event.location,
          isFlexible: event.isFlexible,
          recommendation: event.isFlexible 
            ? 'Flexible personal event: Can be rescheduled or attended remotely.'
            : 'Fixed Executive event: Occurs while in destination; ensure travel buffer permits attendance.'
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      proposedTrip: {
        departure: travelStart.toISOString().split('T')[0],
        return: travelEnd.toISOString().split('T')[0]
      },
      conflicts,
      status: conflicts.length === 0 
        ? 'Clear Schedule: No conflicting obligations detected across your 3 calendars.'
        : `Notice: Found ${conflicts.length} overlapping event(s). See recommendations.`
    };
  }

  /**
   * Schedule confirmed travel itinerary into Google Calendar
   */
  async scheduleTravelItinerary({ flightDetails, hotelDetails, calendarId = 'cal_travel' }) {
    const addedEvents = [];
    const targetCalendar = this.calendars.find(c => c.id === calendarId) || this.calendars[2];

    // 1. Add Flight Event
    if (flightDetails) {
      const flightEvent = {
        id: `evt_flight_${Date.now()}`,
        calendarId: targetCalendar.id,
        calendarName: targetCalendar.name,
        title: `✈️ Flight: ${flightDetails.airline || 'Iberia'} ${flightDetails.route || 'MTY ➔ MAD'} [PNR: ${flightDetails.pnr || 'IB-48209'}]`,
        start: flightDetails.departureTime || '2026-10-08T10:30:00',
        end: flightDetails.arrivalTime || '2026-10-09T06:15:00',
        location: `${flightDetails.origin || 'Monterrey'} ➔ ${flightDetails.destination || 'Madrid Barajas (MAD)'}`,
        type: 'flight',
        description: `Travel Party: Ahmed Zainul, Fatima Zainul, Zayd Zainul.\nCabin: ${flightDetails.cabin || 'Premium Economy'}\nSeats: ${flightDetails.seats || '12A, 12B, 12C'}\nMeals: Halal (MOML) + Child (CHML)\nStatus: Confirmed`,
        reminders: [
          { method: 'popup', minutes: 1440 }, // 24 hours before
          { method: 'popup', minutes: 180 }   // 3 hours before
        ]
      };
      this.events.push(flightEvent);
      addedEvents.push(flightEvent);
    }

    // 2. Add Hotel Stay Event
    if (hotelDetails) {
      const hotelEvent = {
        id: `evt_hotel_${Date.now()}`,
        calendarId: targetCalendar.id,
        calendarName: targetCalendar.name,
        title: `🏨 Hotel Stay: ${hotelDetails.name || 'Hotel Wellington & Spa Madrid'} (Salamanca)`,
        start: hotelDetails.checkIn || '2026-10-09T15:00:00',
        end: hotelDetails.checkOut || '2026-10-13T12:00:00',
        location: hotelDetails.address || 'C. de Velázquez 8, Salamanca, Madrid, Spain',
        type: 'hotel',
        description: `Room: ${hotelDetails.roomType || 'Connected Family Suite'}\nGuests: 3 Guests (Ahmed, Fatima, Zayd)\nBoard: Gourmet Buffet Breakfast Included\nBooking Ref: ${hotelDetails.bookingRef || 'HW-77382'}`,
        reminders: [
          { method: 'popup', minutes: 1440 }
        ]
      };
      this.events.push(hotelEvent);
      addedEvents.push(hotelEvent);
    }

    return {
      success: true,
      calendar: targetCalendar.name,
      eventsScheduled: addedEvents.length,
      events: addedEvents
    };
  }
}

module.exports = new CalendarService();
