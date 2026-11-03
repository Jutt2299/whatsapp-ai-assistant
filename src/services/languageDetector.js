/**
 * Lightweight and accurate language detector for English & Spanish travel conversations
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';

  const clean = text.toLowerCase().trim();

  // Distinct Spanish grammatical words & verbs (NOT proper nouns or words that exist in English)
  const spanishMarkers = [
    'hola', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'que tal', 'qué tal',
    'vuelo', 'vuelos', 'habitacion', 'habitación', 'habitaciones',
    'viaje', 'viajes', 'viajar', 'reserva', 'reservar', 'pasaje', 'pasajes', 'boletos',
    'por favor', 'gracias', 'cuanto', 'cuánto', 'precio', 'precios', 'costo',
    'quiero', 'necesito', 'buscar', 'encuentra', 'buscame', 'búscame', 'ayudame', 'ayúdame',
    'para', 'desde', 'hacia', 'llegada', 'salida', 'proximo', 'próximo',
    'jueves', 'viernes', 'sabado', 'sábado', 'domingo', 'lunes', 'martes', 'miercoles', 'miércoles',
    'noches', 'dias', 'días', 'opciones', 'aerolinea', 'aerolínea', 'asiento', 'asientos',
    'con', 'sin', 'un', 'una', 'unos', 'unas', 'mis', 'tus', 'preferencias', 'familia', 'cuatro'
  ];

  // Distinct English grammatical words & verbs
  const englishMarkers = [
    'hello', 'hi', 'hey', 'good morning', 'good evening',
    'find', 'look', 'search', 'flights', 'flight', 'book', 'booking', 'reserve',
    'hotel', 'hotels', 'room', 'rooms', 'nights', 'days', 'please', 'thanks', 'thank you',
    'want', 'need', 'from', 'to', 'for', 'next', 'thursday', 'friday', 'saturday', 'sunday',
    'monday', 'tuesday', 'wednesday', 'four', 'three', 'two', 'options', 'airline', 'seat',
    'family', 'preferences', 'profile', 'what', 'where', 'when', 'how much'
  ];

  const spanishCharacters = /[áéíóúüñ¿¡]/i;

  let spanishScore = 0;
  let englishScore = 0;

  if (spanishCharacters.test(clean)) {
    spanishScore += 3;
  }
  if (clean.includes('¿') || clean.includes('¡')) {
    spanishScore += 4;
  }

  const words = clean.split(/[\s,?.!;:()"]+/);
  for (const word of words) {
    if (spanishMarkers.includes(word)) {
      spanishScore++;
    }
    if (englishMarkers.includes(word)) {
      englishScore++;
    }
  }

  if (spanishScore > englishScore) {
    return 'es';
  }
  return 'en';
}

module.exports = {
  detectLanguage
};
