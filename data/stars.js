// Local star catalog — no external API required
// Fields: name, ra (degrees), dec (degrees), mag (apparent magnitude), constellation
const STARS = [
  // Ursa Minor
  { name: "Polaris",      ra:  37.95, dec:  89.26, mag: 1.97, constellation: "Ursa Minor" },
  { name: "Kochab",       ra: 222.68, dec:  74.16, mag: 2.07, constellation: "Ursa Minor" },
  { name: "Pherkad",      ra: 230.18, dec:  71.83, mag: 3.05, constellation: "Ursa Minor" },

  // Ursa Major
  { name: "Dubhe",        ra: 165.93, dec:  61.75, mag: 1.79, constellation: "Ursa Major" },
  { name: "Merak",        ra: 165.46, dec:  56.38, mag: 2.37, constellation: "Ursa Major" },
  { name: "Phecda",       ra: 178.46, dec:  53.69, mag: 2.44, constellation: "Ursa Major" },
  { name: "Megrez",       ra: 183.86, dec:  57.03, mag: 3.31, constellation: "Ursa Major" },
  { name: "Alioth",       ra: 193.51, dec:  55.96, mag: 1.76, constellation: "Ursa Major" },
  { name: "Mizar",        ra: 200.98, dec:  54.93, mag: 2.04, constellation: "Ursa Major" },
  { name: "Alkaid",       ra: 206.89, dec:  49.31, mag: 1.85, constellation: "Ursa Major" },

  // Orion
  { name: "Betelgeuse",   ra:  88.79, dec:   7.41, mag: 0.42, constellation: "Orion" },
  { name: "Rigel",        ra:  78.63, dec:  -8.20, mag: 0.12, constellation: "Orion" },
  { name: "Bellatrix",    ra:  81.28, dec:   6.35, mag: 1.64, constellation: "Orion" },
  { name: "Mintaka",      ra:  83.00, dec:  -0.30, mag: 2.23, constellation: "Orion" },
  { name: "Alnilam",      ra:  84.05, dec:  -1.20, mag: 1.69, constellation: "Orion" },
  { name: "Alnitak",      ra:  85.19, dec:  -1.94, mag: 1.74, constellation: "Orion" },
  { name: "Saiph",        ra:  86.94, dec:  -9.67, mag: 2.07, constellation: "Orion" },

  // Canis Major
  { name: "Sirius",       ra: 101.29, dec: -16.72, mag:-1.46, constellation: "Canis Major" },
  { name: "Adhara",       ra: 104.66, dec: -28.97, mag: 1.50, constellation: "Canis Major" },
  { name: "Wezen",        ra: 107.10, dec: -26.39, mag: 1.83, constellation: "Canis Major" },

  // Canis Minor
  { name: "Procyon",      ra: 114.83, dec:   5.22, mag: 0.34, constellation: "Canis Minor" },

  // Taurus
  { name: "Aldebaran",    ra:  68.98, dec:  16.51, mag: 0.85, constellation: "Taurus" },
  { name: "Elnath",       ra:  81.57, dec:  28.61, mag: 1.65, constellation: "Taurus" },

  // Gemini
  { name: "Pollux",       ra: 116.33, dec:  28.03, mag: 1.14, constellation: "Gemini" },
  { name: "Castor",       ra: 113.65, dec:  31.89, mag: 1.58, constellation: "Gemini" },
  { name: "Alhena",       ra:  99.43, dec:  16.40, mag: 1.93, constellation: "Gemini" },

  // Leo
  { name: "Regulus",      ra: 152.09, dec:  11.97, mag: 1.35, constellation: "Leo" },
  { name: "Denebola",     ra: 177.26, dec:  14.57, mag: 2.14, constellation: "Leo" },
  { name: "Algieba",      ra: 154.99, dec:  19.84, mag: 2.08, constellation: "Leo" },

  // Virgo
  { name: "Spica",        ra: 201.30, dec: -11.16, mag: 0.97, constellation: "Virgo" },

  // Boötes
  { name: "Arcturus",     ra: 213.92, dec:  19.18, mag:-0.05, constellation: "Boötes" },
  { name: "Izar",         ra: 221.25, dec:  27.07, mag: 2.35, constellation: "Boötes" },

  // Corona Borealis
  { name: "Alphecca",     ra: 233.67, dec:  26.71, mag: 2.22, constellation: "Corona Borealis" },

  // Scorpius
  { name: "Antares",      ra: 247.35, dec: -26.43, mag: 1.06, constellation: "Scorpius" },
  { name: "Shaula",       ra: 263.40, dec: -37.10, mag: 1.62, constellation: "Scorpius" },
  { name: "Sargas",       ra: 264.33, dec: -42.99, mag: 1.86, constellation: "Scorpius" },
  { name: "Graffias",     ra: 241.36, dec: -19.81, mag: 2.62, constellation: "Scorpius" },

  // Sagittarius
  { name: "Kaus Australis", ra: 276.04, dec: -34.38, mag: 1.79, constellation: "Sagittarius" },
  { name: "Nunki",          ra: 283.82, dec: -26.30, mag: 2.05, constellation: "Sagittarius" },

  // Lyra
  { name: "Vega",         ra: 279.23, dec:  38.78, mag: 0.03, constellation: "Lyra" },
  { name: "Sheliak",      ra: 282.52, dec:  33.36, mag: 3.52, constellation: "Lyra" },
  { name: "Sulafat",      ra: 284.74, dec:  32.69, mag: 3.24, constellation: "Lyra" },

  // Cygnus
  { name: "Deneb",        ra: 310.36, dec:  45.28, mag: 1.25, constellation: "Cygnus" },
  { name: "Sadr",         ra: 305.56, dec:  40.26, mag: 2.20, constellation: "Cygnus" },
  { name: "Albireo",      ra: 292.68, dec:  27.96, mag: 3.08, constellation: "Cygnus" },
  { name: "Gienah Cygni", ra: 311.55, dec:  33.97, mag: 2.46, constellation: "Cygnus" },

  // Aquila
  { name: "Altair",       ra: 297.69, dec:   8.87, mag: 0.76, constellation: "Aquila" },
  { name: "Tarazed",      ra: 296.56, dec:  10.61, mag: 2.72, constellation: "Aquila" },

  // Perseus
  { name: "Mirfak",       ra:  51.08, dec:  49.86, mag: 1.79, constellation: "Perseus" },
  { name: "Algol",        ra:  47.04, dec:  40.96, mag: 2.12, constellation: "Perseus" },

  // Auriga
  { name: "Capella",      ra:  79.17, dec:  45.99, mag: 0.08, constellation: "Auriga" },
  { name: "Menkalinan",   ra:  89.88, dec:  44.95, mag: 1.90, constellation: "Auriga" },

  // Cassiopeia
  { name: "Schedar",      ra:  10.13, dec:  56.54, mag: 2.24, constellation: "Cassiopeia" },
  { name: "Caph",         ra:   2.29, dec:  59.15, mag: 2.27, constellation: "Cassiopeia" },
  { name: "Tsih",         ra:  14.18, dec:  60.72, mag: 2.47, constellation: "Cassiopeia" },
  { name: "Ruchbah",      ra:  21.45, dec:  60.24, mag: 2.68, constellation: "Cassiopeia" },
  { name: "Segin",        ra:  28.60, dec:  63.67, mag: 3.35, constellation: "Cassiopeia" },

  // Andromeda
  { name: "Alpheratz",    ra:   2.10, dec:  29.09, mag: 2.07, constellation: "Andromeda" },
  { name: "Mirach",       ra:  17.43, dec:  35.62, mag: 2.07, constellation: "Andromeda" },
  { name: "Almach",       ra:  30.97, dec:  42.33, mag: 2.17, constellation: "Andromeda" },

  // Pegasus
  { name: "Markab",       ra: 346.19, dec:  15.21, mag: 2.49, constellation: "Pegasus" },
  { name: "Scheat",       ra: 345.94, dec:  28.08, mag: 2.44, constellation: "Pegasus" },
  { name: "Algenib",      ra:   3.31, dec:  15.18, mag: 2.83, constellation: "Pegasus" },
  { name: "Enif",         ra: 326.05, dec:   9.87, mag: 2.38, constellation: "Pegasus" },

  // Hercules
  { name: "Kornephoros",  ra: 247.55, dec:  21.49, mag: 2.77, constellation: "Hercules" },
  { name: "Zeta Her",     ra: 250.32, dec:  31.60, mag: 2.81, constellation: "Hercules" },

  // Aquarius
  { name: "Sadalsuud",    ra: 322.89, dec:  -5.57, mag: 2.90, constellation: "Aquarius" },
  { name: "Sadalmelik",   ra: 331.45, dec:  -0.32, mag: 2.95, constellation: "Aquarius" },

  // Piscis Austrinus
  { name: "Fomalhaut",    ra: 344.41, dec: -29.62, mag: 1.16, constellation: "Piscis Austrinus" },

  // Centaurus
  { name: "Rigil Kentaurus", ra: 219.90, dec: -60.83, mag:-0.27, constellation: "Centaurus" },
  { name: "Hadar",           ra: 210.96, dec: -60.37, mag: 0.61, constellation: "Centaurus" },

  // Crux (Southern Cross)
  { name: "Acrux",        ra: 186.65, dec: -63.10, mag: 0.76, constellation: "Crux" },
  { name: "Gacrux",       ra: 187.79, dec: -57.11, mag: 1.59, constellation: "Crux" },
  { name: "Mimosa",       ra: 191.93, dec: -59.69, mag: 1.25, constellation: "Crux" },

  // Eridanus
  { name: "Achernar",     ra:  24.43, dec: -57.24, mag: 0.45, constellation: "Eridanus" },

  // Carina
  { name: "Canopus",      ra:  95.99, dec: -52.70, mag:-0.72, constellation: "Carina" },
  { name: "Avior",        ra: 125.63, dec: -59.51, mag: 1.86, constellation: "Carina" },
];
