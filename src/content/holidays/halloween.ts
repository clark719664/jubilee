import type { HolidayContent } from '../types';

/**
 * Halloween — the gold-standard tier-1 content file. Copy its shape (see ../_template.ts for field-by-field guidance
 * and docs/CONTENT_GUIDE.md for the rules). Everything here passes test/content.test.ts.
 */
const halloween: HolidayContent = {
  story: [
    "Halloween is a night of dressing up, knocking on doors and shouting 'trick or treat!'",
    'It began long ago with Samhain, an fall festival in Ireland and Scotland, when people believed the line between our world and the spirit world grew thin.',
    "Today many families carve pumpkins into glowing jack-o'-lanterns, hang paper bats and fill bowls with candy for visitors.",
    'Spooky is the fun kind here: the ghosts are made of bedsheets, and the monsters are mostly made of friends.',
  ],

  facts: [
    {
      text: "Long ago in Ireland and Scotland, jack-o'-lanterns were carved from turnips. Pumpkins took over when Irish families moved to America and found them bigger and much easier to carve.",
      wow: true,
    },
    {
      text: "Bats aren't blind. Most can see perfectly well, and many also 'see' with sound by making tiny clicks and listening for the echoes.",
      wow: true,
    },
    {
      text: "The word Halloween is short for All Hallows' Eve, the evening before All Saints' Day on 1 November.",
      bigKids: true,
    },
    {
      text: 'A pumpkin is a fruit, not a vegetable, because it grows from a flower and keeps its seeds inside.',
    },
    {
      text: "Trick-or-treating grew out of older customs called souling and guising, when children went door to door and sang or recited a poem in exchange for a small treat.",
      bigKids: true,
    },
    {
      text: 'The heaviest pumpkin ever grown weighed more than a small car: over 1,200 kilograms.',
      wow: true,
    },
  ],

  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Halloween!', sayIt: 'feh-LEES hah-loh-WEEN', meaning: 'Happy Halloween!' },
    { lang: 'es-MX', langName: 'Spanish (Mexico)', text: '¡Dulce o truco!', sayIt: 'DOOL-seh oh TROO-koh', meaning: "Trick or treat! (literally 'sweet or trick')" },
    { lang: 'fr', langName: 'French', text: 'Joyeux Halloween !', sayIt: 'zhwah-YUH ah-loh-WEEN', meaning: 'Happy Halloween!' },
    { lang: 'de', langName: 'German', text: 'Fröhliches Halloween!', sayIt: 'FRUR-likh-es hah-loh-WEEN', meaning: 'Happy Halloween!' },
  ],

  recipes: [
    {
      id: 'banana-ghosts',
      title: 'Banana Ghosts & Clementine Pumpkins',
      emoji: '👻',
      blurb: 'Fruit in disguise: wobbly banana ghosts with chocolate-chip eyes and clementine pumpkins with celery stems.',
      minutes: 15,
      serves: 4,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: ['milk', 'soy'],
      swaps: [
        { avoid: 'milk', use: 'dairy-free chocolate chips, or raisins for the eyes' },
        { avoid: 'soy', use: 'raisins or dried blueberries for the eyes' },
      ],
      equipment: ['Plate', 'Small bowl'],
      ingredients: [
        { item: 'Bananas', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, note: 'firm, not too ripe' },
        { item: 'Mini chocolate chips', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 25, unit: 'g' }, allergens: ['milk', 'soy'] },
        { item: 'Clementines', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' } },
        { item: 'Celery', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'one stalk, for the pumpkin stems' },
      ],
      steps: [
        {
          text: 'Peel the clementines and pull off the white stringy bits. Now they are little pumpkins.',
          kidSafeOverride: 'Peeling a clementine by hand.',
        },
        { text: 'Snap the celery into short pieces with your hands and push one into the top of each clementine for a stem.' },
        {
          text: 'Peel the bananas and snap each one in half with your hands.',
          kidSafeOverride: 'Peeling a banana by hand: no peeler, no knife.',
        },
        {
          text: 'Stand each banana half on the plate with the flat end down. These are your ghosts.',
          tip: 'If a ghost wobbles, press its bottom gently onto the plate.',
        },
        { text: 'Press two mini chocolate chips in for eyes and one more chip, pointy end in, for a surprised mouth.' },
        { text: 'Line the ghosts and pumpkins up on the plate so they can spook each other.' },
        { text: 'Taste test! Ghosts first, or pumpkins? Whatever you choose, say boo before you bite.' },
      ],
      tip: 'Make the ghosts last so the bananas stay bright white.',
    },
    {
      id: 'monster-mouth-apple-bites',
      title: 'Monster Mouth Apple Bites',
      emoji: '👹',
      blurb: 'Apple wedges with peanut-butter gums and marshmallow teeth. They look fierce and taste sweet.',
      minutes: 15,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['peanut'],
      mayContain: ['tree-nut'],
      swaps: [{ avoid: 'peanut', use: 'sunflower seed butter (great for nut-free schools)' }],
      chokingNote: 'Mini marshmallows and apple chunks are tricky for children under four: cut them small and sit down to eat.',
      equipment: ['Chopping board', 'Sharp knife (grown-up)', 'Butter knife or spoon', 'Plate'],
      ingredients: [
        { item: 'Apples', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, note: 'red or green' },
        { item: 'Peanut butter', us: { qty: 4, unit: 'tbsp' }, metric: { qty: 60, unit: 'g' }, allergens: ['peanut'] },
        { item: 'Mini marshmallows', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 15, unit: 'g' }, note: 'for teeth' },
        { item: 'Strawberries', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, note: 'for tongues', optional: true },
        { item: 'Lemon juice', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'stops the apple going brown', optional: true },
      ],
      steps: [
        {
          text: 'A grown-up uses a sharp knife to cut each apple into eight wedges and cut out the core. Halve the strawberries too.',
          adult: true,
          hazards: ['sharp'],
        },
        { text: 'Brush the cut sides of the apple with a little lemon juice so they stay bright.' },
        {
          text: 'Spread a thick layer of peanut butter on one side of a wedge with a butter knife or spoon.',
          kidSafeOverride: 'Butter knife or spoon: blunt, kid-safe spreading.',
        },
        { text: 'Press a second wedge on top, peanut-butter sides together, so it looks like an open mouth.' },
        { text: 'Push mini marshmallows into the peanut butter along the top edge for teeth. Four or five jagged ones look fierce.' },
        { text: 'Tuck half a strawberry in at the back for a tongue, then line up your monsters on a plate.' },
        { text: 'Taste test! Who can do the best monster chomp? Crunchy apple, sweet gums, squishy teeth.' },
      ],
      tip: 'Make them right before eating so the apple stays crisp.',
    },
  ],

  crafts: [
    {
      id: 'paper-bag-puppet-monster',
      title: 'Paper-Bag Puppet Monster',
      emoji: '👾',
      blurb: 'Turn a lunch bag into a monster with a flapping mouth, then make it tell spooky jokes.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Paper lunch bag', qty: '1' },
        { item: 'Colored paper or card', qty: 'a few scraps' },
        { item: 'Scissors', substitute: 'ask a grown-up to pre-cut the shapes' },
        { item: 'Glue stick' },
        { item: 'Crayons or markers' },
        { item: 'Yarn or wool', qty: 'a few strands', optional: true, substitute: 'paper strips curled round a pencil' },
      ],
      steps: [
        { text: 'Lay the bag flat with the folded bottom flap facing up. The flap is your monster’s head and the fold underneath is its mouth.' },
        {
          text: 'Use scissors to cut eyes, horns, a tongue and a row of zig-zag teeth out of colored paper.',
          hazards: ['sharp'],
          tip: 'Fold the paper in half before cutting and you get two matching eyes or horns at once.',
        },
        { text: 'Glue the eyes and horns onto the flap, the teeth along the edge of the flap, and the tongue just under the fold.' },
        { text: 'Draw scales, spots or stripes with crayons. Add yarn hair if you like.' },
        { text: 'Slide your hand inside, curl your fingers into the flap, and make your monster talk!' },
      ],
      learn: 'Cutting and gluing practice little fingers, and two eyes plus two horns are a sneaky lesson in symmetry.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'An owl can turn its head about three-quarters of the way round, so it can look over its own back without moving its body.' },
    { sleeps: 11, kind: 'joke', text: "Why didn't the skeleton go trick-or-treating? It had no body to go with!" },
    { sleeps: 10, kind: 'color', text: 'Orange, black and purple crayons at the ready! The Halloween coloring page is waiting. Open the coloring page!' },
    { sleeps: 9, kind: 'fact', text: 'Weight for weight, some spider silk is stronger than steel, and it can stretch a long way before it snaps.' },
    { sleeps: 8, kind: 'craft', text: 'Wrap a cardboard tube in strips of white paper or toilet paper, then draw two big eyes: a friendly mummy for your windowsill!' },
    { sleeps: 7, kind: 'say', text: 'Learn to say happy Halloween in German!', greeting: 3 },
    { sleeps: 6, kind: 'fact', text: 'In Ireland many families eat barmbrack at Halloween, a fruity bread with a ring baked inside. An old saying says whoever finds the ring will marry within a year.' },
    { sleeps: 5, kind: 'joke', text: 'Why are ghosts terrible at telling fibs? You can see right through them!' },
    { sleeps: 4, kind: 'seek', text: 'Some sneaky things are hiding in the Halloween picture. Can you find them all? Open Seek & Find!' },
    { sleeps: 3, kind: 'fact', text: "In 2013 the town of Keene in New Hampshire, USA, lit 30,581 jack-o'-lanterns at once, a world record." },
    { sleeps: 2, kind: 'craft', text: 'Scrunch a tissue into a ball, drape a second tissue over it, tie a ribbon underneath and draw a face: a tiny ghost!' },
    { sleeps: 1, kind: 'say', text: "One more sleep! Tomorrow you might hear 'trick or treat' at the door. Learn to say it the way children in Mexico do!", greeting: 1 },
  ],

  parentNote:
    "Halloween is a playful, secular holiday here: no horror, no gore. For families who don't celebrate it, the recipes and craft work just as well as an fall monsters afternoon. Check candy for allergens, and light paper pumpkins with a battery tea light rather than a candle.",

  sources: [
    "Encyclopaedia Britannica, 'Halloween' (origins in Samhain and All Hallows' Eve)",
    "Smithsonian Magazine, 'The Halloween jack-o'-lantern was once carved from a turnip'",
    "Bat Conservation International, 'Bat myths and facts: are bats blind?'",
    "Library of Congress, 'The origins of Halloween traditions' (souling and guising)",
    "Guinness World Records, 'Heaviest pumpkin' (2,749 lb / 1,247 kg, 2023)",
  ],
};

export default halloween;
