import type { HolidayContent } from '../types';

/**
 * Valentine's Day — tier 1. Kindness and friendship first, romance a distant second: the cards are for anyone you are
 * glad to have around. Shape follows ../_template.ts.
 */
const valentinesDay: HolidayContent = {
  story: [
    "Valentine's Day, on 14 February, is a day for telling the people you love that you love them: family, friends, teachers and pets included.",
    'It is named after St Valentine, a Christian from Roman times, and over the centuries it grew into a day of cards, poems, flowers and sweets.',
    'Many families swap handmade cards and heart-shaped treats, and in lots of schools children give a little card to everyone in the class so no one is left out.',
    'Pink and red hearts are everywhere, but the real message is simple: you matter to me.',
  ],

  facts: [
    {
      text: "The oldest Valentine's message still around is a poem from 1415. Charles, Duke of Orléans, wrote it to his wife while he was a prisoner in the Tower of London, and it is kept in the British Library.",
      bigKids: true,
    },
    {
      text: 'The heart shape on cards looks nothing like a real heart. Yours is about the size of your fist and beats around 100,000 times a day.',
      wow: true,
    },
    {
      text: "In Japan it is usually girls and women who give chocolate on Valentine's Day. One month later, on 14 March, called White Day, boys and men give a present back.",
      wow: true,
    },
    {
      text: "In Finland the day is called Ystävänpäivä, which means Friends' Day, and it is mostly about celebrating friendship rather than romance.",
    },
    {
      text: "The poet Geoffrey Chaucer may have started it all: in a poem written around 1382 he said that birds choose their mates on St Valentine's Day, and the idea of a day for love took off.",
      bigKids: true,
    },
    {
      text: 'Cupid, the winged baby with a bow and arrow on so many cards, is the Roman god of love. A legend says that anyone struck by one of his arrows falls in love.',
    },
  ],

  greetings: [
    { lang: 'fr', langName: 'French', text: 'Joyeuse Saint-Valentin !', sayIt: 'zhwah-YUHZ san-vah-lon-TAN', meaning: "Happy Valentine's Day!" },
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de San Valentín!', sayIt: 'feh-LEES DEE-ah deh sahn vah-len-TEEN', meaning: "Happy Valentine's Day!" },
    {
      lang: 'es-MX',
      langName: 'Spanish (Mexico)',
      text: '¡Feliz Día del Amor y la Amistad!',
      sayIt: 'feh-LEES DEE-ah del ah-MOR ee lah ah-mees-TAHD',
      meaning: "Happy Day of Love and Friendship! (what Valentine's Day is called in Mexico)",
    },
    {
      lang: 'ja',
      langName: 'Japanese',
      text: 'ハッピーバレンタイン！',
      roman: 'Happī Barentain!',
      sayIt: 'HAP-pee bah-ren-TAH-een',
      meaning: 'Happy Valentine! (in Japan the gift of the day is chocolate)',
    },
    { lang: 'de', langName: 'German', text: 'Alles Liebe zum Valentinstag!', sayIt: 'AHL-es LEE-buh tsoom vah-len-TEENS-tahk', meaning: "All my love on Valentine's Day!" },
  ],

  recipes: [
    {
      id: 'heart-fruit-skewers',
      title: 'Heart Fruit Skewers with Yogurt Dip',
      emoji: '🍉',
      blurb: 'Watermelon hearts, strawberry hearts and banana chunks on a stick, with a creamy vanilla dip to dunk them in.',
      minutes: 20,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['milk'],
      swaps: [{ avoid: 'milk', use: 'coconut or soy yogurt for the dip' }],
      equipment: ['Small heart-shaped cookie cutter', 'Chopping board', 'Sharp knife (grown-up)', '8 wooden skewers', 'Small bowl', 'Spoon'],
      ingredients: [
        { item: 'Watermelon', us: { qty: 2, unit: 'slice' }, metric: { qty: 2, unit: 'slice' }, note: 'thick slabs' },
        { item: 'Strawberries', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' }, note: 'big ones' },
        { item: 'Bananas', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' } },
        { item: 'Vanilla yogurt', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Maple syrup', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'ml' } },
        { item: 'Ground cinnamon', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' }, optional: true },
      ],
      steps: [
        {
          text: 'A grown-up uses a sharp knife to cut the watermelon into slabs as thick as a finger, and to cut each strawberry in half from top to tip so every half is a little heart.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Press the heart cookie cutter into a watermelon slab, push down hard, wiggle it, and lift out a watermelon heart. Repeat until the slabs are full of holes.',
          tip: 'The leftover watermelon scraps are the cook’s snack.',
        },
        { text: 'Peel the bananas and break them into chunks with your hands.', kidSafeOverride: 'Peeling a banana by hand: no peeler, no knife.' },
        {
          text: 'Thread the fruit onto the skewers in a pattern: watermelon heart, banana, strawberry heart, banana.',
          tip: 'Hold the skewer by the blunt end and ask a grown-up to snap the sharp tips off for younger children.',
        },
        { text: 'Stir the yogurt, maple syrup and cinnamon together in the small bowl for the dip.' },
        { text: 'Stand the skewers in a glass or fan them out on a plate with the dip in the middle.' },
        { text: 'Taste test! Dunk a heart in the dip and hand the next skewer to someone you love.' },
      ],
      tip: 'No heart cutter? Cut the watermelon into cubes and the strawberry hearts will do the talking.',
    },
    {
      id: 'chocolate-dipped-strawberries',
      title: 'Chocolate-Dipped Strawberries',
      emoji: '🍫',
      blurb: 'Shiny strawberries dipped in melted chocolate and rolled in sprinkles: the fanciest thing you can make in 40 minutes.',
      minutes: 40,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: false,
      allergens: ['milk', 'soy'],
      mayContain: ['tree-nut'],
      swaps: [
        { avoid: 'milk', use: 'dairy-free dark chocolate chips' },
        { avoid: 'soy', use: 'chocolate chips labelled soy-free' },
      ],
      equipment: ['Tray lined with parchment paper', 'Microwave-safe bowl', 'Spoon', 'Paper towel', 'Space in the fridge'],
      ingredients: [
        { item: 'Strawberries', us: { qty: 16, unit: 'piece' }, metric: { qty: 16, unit: 'piece' }, note: 'with their green tops on' },
        { item: 'Chocolate chips', us: { qty: 1, unit: 'cup' }, metric: { qty: 170, unit: 'g' }, note: 'milk or dark', allergens: ['milk', 'soy'] },
        { item: 'Coconut oil', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'makes the chocolate shiny', optional: true },
        { item: 'Sprinkles', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 20, unit: 'g' }, optional: true },
        { item: 'White chocolate chips', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 45, unit: 'g' }, note: 'for drizzling', optional: true, allergens: ['milk', 'soy'] },
      ],
      steps: [
        {
          text: 'Wash the strawberries and pat every one completely dry with paper towel.',
          tip: 'Even one drop of water makes melted chocolate go grainy, so dry them twice.',
        },
        { text: 'Lay the parchment paper on the tray and clear a shelf in the fridge.' },
        {
          text: 'A grown-up microwaves the chocolate chips and coconut oil for 30 seconds, stirs, then heats them 20 seconds more and stirs until smooth and glossy.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
        },
        { text: 'Hold a strawberry by its leaves, dip it into the chocolate, give it a little twist and let the extra drip back into the bowl.' },
        { text: 'Lay it on the tray and shake sprinkles over it while the chocolate is still wet. Dip the rest the same way.' },
        {
          text: 'A grown-up melts the white chocolate the same way, then you drizzle zig-zags over the strawberries with a spoon.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
        },
        { text: 'Put the tray in the fridge for 20 minutes until the chocolate is hard.', timerMinutes: 20 },
        { text: 'Taste test! Bite the tip first and listen for the crack.' },
      ],
      tip: 'Chocolate shares a factory line with nuts more often than you would think: check the label for allergies.',
    },
  ],

  crafts: [
    {
      id: 'heart-pop-up-card',
      title: 'Heart Pop-Up Card',
      emoji: '💌',
      blurb: 'Two snips and a fold make a step inside the card, and a big red heart jumps up every time it opens.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Thin card', qty: '1 sheet', substitute: 'a cereal-box panel, plain side out' },
        { item: 'Red or pink paper', qty: '1 sheet' },
        { item: 'Scissors', substitute: 'ask a grown-up to make the two slits and cut the heart' },
        { item: 'Glue stick' },
        { item: 'Crayons or markers' },
        { item: 'Stickers', optional: true },
      ],
      steps: [
        { text: 'Fold the card in half like a book, then fold the red paper in half too.' },
        {
          text: 'Use scissors to cut two short slits, a thumb apart, from the folded edge of the card towards the middle, each about as long as your thumb.',
          hazards: ['sharp'],
        },
        {
          text: 'Open the card a little, push the strip between the slits inwards so it folds the opposite way, then close the card and press it flat.',
          tip: 'If the strip will not pop, crease it the other way with your fingernail and try again.',
        },
        {
          text: 'Draw half a heart against the fold of the red paper and cut it out, then open it up: a perfectly even heart.',
          hazards: ['sharp'],
        },
        { text: 'Open the card: a little step pops up inside. Glue the heart to the front of the step so it stands up when the card opens.' },
        { text: 'Decorate the front and write your message inside, starting with "I love you because…".' },
      ],
      learn: 'The pop-up works because a mountain fold turned into a valley fold, and the heart is symmetrical because you only drew half of it.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: "In Wales, many people celebrate St Dwynwen's Day on 25 January, the Welsh day of love. An old Welsh custom is to carve a wooden love spoon as a gift." },
    { sleeps: 11, kind: 'joke', text: "What did the stamp say to the envelope on Valentine's Day? I'm stuck on you!" },
    { sleeps: 10, kind: 'craft', text: 'Fold a piece of paper in half, draw half a heart against the fold and cut it out with safety scissors. Open it up: a perfect heart, every time!' },
    { sleeps: 9, kind: 'fact', text: 'In the 1840s, Esther Howland of Worcester, Massachusetts, began making valentines from paper lace and ribbon. She is often called the Mother of the American Valentine.' },
    { sleeps: 8, kind: 'say', text: "Learn to say Happy Valentine's Day in French, the language of the oldest valentine still around!", greeting: 0 },
    { sleeps: 7, kind: 'colour', text: "Colour in the Valentine's Day page. Hearts don't have to be red: try stripes, spots or every colour of the rainbow!" },
    { sleeps: 6, kind: 'fact', text: 'The biggest heart on Earth belongs to the blue whale. It weighs about 180 kilograms, as much as two or three grown-ups put together.' },
    { sleeps: 5, kind: 'joke', text: "Why do skunks love Valentine's Day? Because they're very scent-imental!" },
    { sleeps: 4, kind: 'seek', text: "Some sneaky surprises are hiding in the Valentine's Day picture. Can you find every single one? Open Seek & Find!" },
    { sleeps: 3, kind: 'fact', text: "In South Korea, 14 April is Black Day. Friends who didn't get a Valentine's present meet up and eat noodles in black bean sauce together." },
    { sleeps: 2, kind: 'craft', text: "Write a kindness coupon on a strip of paper, like 'one free hug' or 'I'll set the table', and slip it under someone's pillow." },
    { sleeps: 1, kind: 'say', text: "Tomorrow is Valentine's Day! In Mexico it's the Day of Love and Friendship, so learn to wish it to everyone you care about, the Mexican way.", greeting: 2 },
  ],

  parentNote:
    "Valentine's Day here is about kindness and friendship, not romance: the cards are for anyone a child is glad to have around. If school does a class exchange, the pop-up card is quick to make in batches. Chocolate often shares a line with nuts, so check the label for allergies.",

  sources: [
    "British Library, 'The oldest surviving Valentine' (Charles d'Orléans, 1415)",
    "Encyclopaedia Britannica, 'Valentine's Day' (St Valentine; Chaucer's Parlement of Foules, around 1382)",
    "British Heart Foundation, 'How a healthy heart works' (size and beats per day)",
    "Japan National Tourism Organization, 'Valentine's Day and White Day in Japan'",
    "Finnish Ministry for Foreign Affairs (thisisFINLAND), 'Valentine's Day is Friends' Day in Finland'",
  ],
};

export default valentinesDay;
