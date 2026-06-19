/**
 * Panchang calculations using simplified astronomical formulas.
 * All angular values are in degrees. Location defaults to New Delhi (28.6N, 77.2E).
 */

const TITHI_NAMES = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashti','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya',
];

const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

const YOGA_NAMES = [
  'Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda',
  'Sukarman','Dhriti','Shula','Ganda','Vriddhi','Dhruva',
  'Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyan',
  'Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla',
  'Brahma','Indra','Vaidhriti',
];

const KARANA_NAMES = [
  'Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti',
  'Shakuni','Chatushpada','Naga','Kimstughna',
];

// Rahu Kaal start offset (in slots of 1.5h from sunrise), by day of week (0=Sun)
const RAHU_KAAL_SLOT = [8, 2, 7, 5, 6, 4, 3]; // slot index (1-based)

/**
 * Julian Day Number for a given date
 */
const julianDay = (date) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return 367 * y
    - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
    + Math.floor(275 * m / 9)
    + d + 1721013.5;
};

/**
 * Sun's apparent longitude (degrees) — accurate to ~1°
 */
const sunLongitude = (jd) => {
  const n  = jd - 2451545.0;
  const L  = (280.460 + 0.9856474 * n) % 360;
  const g  = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lambda = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  return ((lambda % 360) + 360) % 360;
};

/**
 * Moon's apparent longitude (degrees) — simplified
 */
const moonLongitude = (jd) => {
  const n  = jd - 2451545.0;
  const L  = (218.316 + 13.176396 * n) % 360;
  const M  = (134.963 + 13.064993 * n) % 360;
  const F  = (93.272  + 13.229350 * n) % 360;
  const Mrad = M * Math.PI / 180;
  const Frad = F * Math.PI / 180;
  const lambda = L + 6.289 * Math.sin(Mrad) - 1.274 * Math.sin(2 * Frad - Mrad)
               + 0.658 * Math.sin(2 * Frad) - 0.186 * Math.sin(Mrad); // simplified
  return ((lambda % 360) + 360) % 360;
};

/**
 * Sunrise/sunset times for a location.
 * Returns { sunrise: Date, sunset: Date }
 * Defaults to New Delhi
 */
const getSunTimes = (date, latDeg = 28.6139, lonDeg = 77.2090) => {
  const jd   = julianDay(date);
  const n    = jd - 2451545.0;
  const lSun = sunLongitude(jd) * Math.PI / 180;

  // Solar declination
  const eps   = 23.439 * Math.PI / 180;
  const decl  = Math.asin(Math.sin(eps) * Math.sin(lSun));

  const lat = latDeg * Math.PI / 180;
  const cosH = (Math.cos(90.833 * Math.PI / 180) - Math.sin(lat) * Math.sin(decl))
             / (Math.cos(lat) * Math.cos(decl));

  // No sunrise/sunset edge case
  if (cosH > 1 || cosH < -1) {
    return { sunrise: null, sunset: null };
  }

  const H  = Math.acos(cosH) * 180 / Math.PI;
  // Equation of time approximation
  const EoT = 9.87 * Math.sin(2 * (280.46 + 0.9856 * n) * Math.PI / 180)
            - 7.53 * Math.cos((280.46 + 0.9856 * n) * Math.PI / 180)
            - 1.5  * Math.sin((280.46 + 0.9856 * n) * Math.PI / 180);
  const transitMin = 720 - 4 * lonDeg - EoT;
  const sunriseMin = transitMin - H * 4;
  const sunsetMin  = transitMin + H * 4;

  // minFromMidnight is in UT minutes from UTC midnight → convert via setUTCMinutes
  const toTime = (minFromMidnight) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCMinutes(Math.round(minFromMidnight));
    return d;
  };

  return { sunrise: toTime(sunriseMin), sunset: toTime(sunsetMin) };
};

/**
 * Compute full Panchang for a given date
 */
const computePanchang = (date, latDeg = 28.6139, lonDeg = 77.2090) => {
  const jd     = julianDay(date);
  const sunLon = sunLongitude(jd);
  const moonLon = moonLongitude(jd);

  // Tithi — each tithi spans 12° of sun-moon elongation
  const elongation = ((moonLon - sunLon) + 360) % 360;
  const tithiIndex = Math.floor(elongation / 12) % 30;
  const tithiName  = tithiIndex < 15 ? `Shukla ${TITHI_NAMES[tithiIndex % 15]}` : `Krishna ${TITHI_NAMES[tithiIndex % 15]}`;

  // Nakshatra — moon moves through 27 nakshatras
  const nakshatraIndex = Math.floor((moonLon * 27) / 360) % 27;

  // Yoga — sum of sun+moon longitudes divided into 27 equal parts
  const yogaIndex = Math.floor(((sunLon + moonLon) * 27 / 360)) % 27;

  // Karana — half a tithi (6° each)
  const karanaIndex = Math.floor(elongation / 6) % 11;

  const { sunrise, sunset } = getSunTimes(date, latDeg, lonDeg);

  // Rahu Kaal — 1.5h slot from sunrise, offset by day of week
  let rahuKaal = null;
  if (sunrise && sunset) {
    const totalMin   = (sunset - sunrise) / 60000;
    const slotMin    = totalMin / 8;
    const slotNum    = RAHU_KAAL_SLOT[date.getDay()] - 1; // 0-based
    const rahuStart  = new Date(sunrise.getTime() + slotNum * slotMin * 60000);
    const rahuEnd    = new Date(rahuStart.getTime() + slotMin * 60000);
    rahuKaal = {
      start: rahuStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      end:   rahuEnd.toLocaleTimeString('en-IN',   { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  }

  const fmtTime = (d) => d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

  // Moon phase derived from elongation
  const moonPhaseLabel = (() => {
    const deg = elongation;
    if (deg < 12)  return 'New Moon';
    if (deg < 90)  return 'Waxing Crescent';
    if (deg < 102) return 'First Quarter';
    if (deg < 168) return 'Waxing Gibbous';
    if (deg < 192) return 'Full Moon';
    if (deg < 270) return 'Waning Gibbous';
    if (deg < 282) return 'Last Quarter';
    if (deg < 348) return 'Waning Crescent';
    return 'New Moon';
  })();

  // Brahma Muhurta — 96 minutes before sunrise
  const brahmaMuhurta = sunrise
    ? (() => {
        const bm = new Date(sunrise.getTime() - 96 * 60 * 1000);
        return `${fmtTime(bm)} – ${fmtTime(sunrise)}`;
      })()
    : 'Data Not Available';

  return {
    date:       date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    tithi:      tithiName,
    nakshatra:  NAKSHATRA_NAMES[nakshatraIndex],
    yoga:       YOGA_NAMES[yogaIndex],
    karana:     KARANA_NAMES[karanaIndex],
    moonPhase:  moonPhaseLabel,
    muhurta:    brahmaMuhurta,
    sunrise:    fmtTime(sunrise),
    sunset:     fmtTime(sunset),
    rahuKaal,
    moonLongitude: Math.round(moonLon * 100) / 100,
    sunLongitude:  Math.round(sunLon  * 100) / 100,
  };
};

module.exports = { computePanchang };
