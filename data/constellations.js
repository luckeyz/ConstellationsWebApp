// Local constellation catalog — no external API required
// links: pairs of star names to draw connecting lines
const CONSTELLATIONS = [
  {
    name: "Ursa Minor",
    description: "The Little Bear — contains Polaris, the North Star",
    links: [
      ["Polaris","Kochab"], ["Kochab","Pherkad"]
    ]
  },
  {
    name: "Ursa Major",
    description: "The Great Bear — home of the Big Dipper",
    links: [
      ["Dubhe","Merak"], ["Merak","Phecda"], ["Phecda","Megrez"],
      ["Megrez","Dubhe"], ["Megrez","Alioth"], ["Alioth","Mizar"], ["Mizar","Alkaid"]
    ]
  },
  {
    name: "Orion",
    description: "The Hunter — one of the most recognizable constellations",
    links: [
      ["Betelgeuse","Bellatrix"],
      ["Bellatrix","Mintaka"], ["Mintaka","Alnilam"], ["Alnilam","Alnitak"],
      ["Alnitak","Saiph"], ["Saiph","Rigel"], ["Rigel","Betelgeuse"]
    ]
  },
  {
    name: "Canis Major",
    description: "The Greater Dog — home of Sirius, the brightest star in the sky",
    links: [
      ["Sirius","Adhara"], ["Adhara","Wezen"], ["Wezen","Sirius"]
    ]
  },
  {
    name: "Taurus",
    description: "The Bull — features the Pleiades and Hyades clusters",
    links: [
      ["Aldebaran","Elnath"]
    ]
  },
  {
    name: "Gemini",
    description: "The Twins — Castor and Pollux mark the twin heads",
    links: [
      ["Castor","Pollux"], ["Pollux","Alhena"]
    ]
  },
  {
    name: "Leo",
    description: "The Lion — Regulus marks the lion's heart",
    links: [
      ["Regulus","Algieba"], ["Algieba","Denebola"]
    ]
  },
  {
    name: "Scorpius",
    description: "The Scorpion — Antares glows red as the scorpion's heart",
    links: [
      ["Graffias","Antares"], ["Antares","Shaula"], ["Shaula","Sargas"]
    ]
  },
  {
    name: "Lyra",
    description: "The Lyre — Vega is the brightest star in summer's northern sky",
    links: [
      ["Vega","Sheliak"], ["Sheliak","Sulafat"], ["Sulafat","Vega"]
    ]
  },
  {
    name: "Cygnus",
    description: "The Swan — the Northern Cross, flying down the Milky Way",
    links: [
      ["Deneb","Sadr"], ["Sadr","Albireo"],
      ["Sadr","Gienah Cygni"]
    ]
  },
  {
    name: "Aquila",
    description: "The Eagle — Altair is one vertex of the Summer Triangle",
    links: [
      ["Tarazed","Altair"]
    ]
  },
  {
    name: "Cassiopeia",
    description: "The Queen — W-shape circling the north celestial pole",
    links: [
      ["Caph","Schedar"], ["Schedar","Tsih"], ["Tsih","Ruchbah"], ["Ruchbah","Segin"]
    ]
  },
  {
    name: "Perseus",
    description: "The Hero — home of Algol, the Demon Star (eclipsing binary)",
    links: [
      ["Mirfak","Algol"]
    ]
  },
  {
    name: "Auriga",
    description: "The Charioteer — Capella is the sixth-brightest star",
    links: [
      ["Capella","Menkalinan"]
    ]
  },
  {
    name: "Andromeda",
    description: "The Chained Princess — home of the Andromeda Galaxy (M31)",
    links: [
      ["Alpheratz","Mirach"], ["Mirach","Almach"]
    ]
  },
  {
    name: "Pegasus",
    description: "The Winged Horse — the Great Square is an autumn landmark",
    links: [
      ["Markab","Scheat"], ["Scheat","Alpheratz"], ["Alpheratz","Algenib"], ["Algenib","Markab"],
      ["Markab","Enif"]
    ]
  },
  {
    name: "Boötes",
    description: "The Herdsman — Arcturus is the brightest star in the northern hemisphere",
    links: [
      ["Arcturus","Izar"]
    ]
  },
  {
    name: "Sagittarius",
    description: "The Archer — points toward the center of the Milky Way",
    links: [
      ["Kaus Australis","Nunki"]
    ]
  },
  {
    name: "Crux",
    description: "The Southern Cross — visible only from the Southern Hemisphere",
    links: [
      ["Acrux","Gacrux"], ["Mimosa","Gacrux"]
    ]
  },
  {
    name: "Centaurus",
    description: "The Centaur — contains the closest star system to our Sun",
    links: [
      ["Rigil Kentaurus","Hadar"]
    ]
  }
];
