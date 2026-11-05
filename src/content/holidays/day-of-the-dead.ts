import type { HolidayContent } from '../types';

/**
 * Day of the Dead (Día de Muertos) — tier 1. Remembering, not spooky: the skulls are sugar and the ghosts are
 * grandparents in photo frames. Shape follows ../_template.ts; rules in docs/CONTENT_GUIDE.md.
 */
const dayOfTheDead: HolidayContent = {
  story: [
    'Day of the Dead, or Día de Muertos, is a Mexican holiday on 1 and 2 November when families remember relatives who have died and welcome their memory home.',
    'It blends the ancient traditions of Indigenous peoples such as the Mexica (Aztecs), who held festivals for the dead, with the Catholic days of All Saints and All Souls.',
    'Many families build an ofrenda, a table covered in photos, candles, orange marigolds, sugar skulls, paper banners and the favorite foods of the people they are remembering.',
    'It is not a sad or spooky day: there is music, laughter and story-telling, because the idea is that loved ones are never really gone while someone still says their name.',
  ],

  facts: [
    {
      text: 'Bright orange marigolds, called cempasúchil, cover ofrendas and graves because many families believe their color and strong smell help the spirits find their way home.',
      wow: true,
    },
    {
      text: 'The two days have different jobs: 1 November, Día de los Angelitos, remembers children who have died, and 2 November, Día de los Muertos, remembers grown-ups.',
      bigKids: true,
    },
    {
      text: 'Sugar skulls are made of sugar, water and a little lemon, decorated with swirls of colored icing and foil. A name is often written on the forehead, and it is a friendly gift, not a scary one.',
    },
    {
      text: 'In 2008 UNESCO added the Indigenous festivity dedicated to the dead to its list of the Intangible Cultural Heritage of Humanity, alongside the Carnival of Oruro in Bolivia and Kabuki theater from Japan.',
      bigKids: true,
    },
    {
      text: 'Pan de muerto, the bread of the dead, is a soft sweet bun with strips of dough on top shaped like bones and a little ball on top that some say stands for a skull or a teardrop.',
    },
    {
      text: 'Mexico City held its first giant Day of the Dead parade only in 2016, after a spy film showed a parade that did not really exist and visitors came looking for it.',
      wow: true,
    },
  ],

  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de Muertos!', sayIt: 'feh-LEES DEE-ah deh MWAIR-tohs', meaning: 'Happy Day of the Dead!' },
    {
      lang: 'es-MX',
      langName: 'Spanish (Mexico)',
      text: '¿Me da mi calaverita?',
      sayIt: 'meh DAH mee kah-lah-veh-REE-tah',
      meaning: "Will you give me my little skull? (what children in Mexico say when they go door to door for a sweet or a coin, a bit like 'trick or treat')",
    },
    {
      lang: 'es',
      langName: 'Spanish',
      text: '¡Feliz Día de los Muertos!',
      sayIt: 'feh-LEES DEE-ah deh lohs MWAIR-tohs',
      meaning: 'Happy Day of the Dead! (the longer name of the holiday, the one printed on most cards and banners outside Mexico)',
    },
  ],

  recipes: [
    {
      id: 'marigold-orange-agua-fresca',
      title: 'Marigold Orange Agua Fresca',
      emoji: '🍊',
      blurb: 'A jug of fresh orange and lime water the color of marigold petals, just like the ones on an ofrenda.',
      minutes: 15,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: [],
      equipment: ['Big jug', 'Citrus squeezer', 'Chopping board', 'Sharp knife (grown-up)', 'Long spoon'],
      ingredients: [
        { item: 'Oranges', us: { qty: 5, unit: 'piece' }, metric: { qty: 5, unit: 'piece' }, note: 'juicy ones; one is for wheels on top' },
        { item: 'Lime', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'Cold water', us: { qty: 2, unit: 'cup' }, metric: { qty: 480, unit: 'ml' } },
        { item: 'Sugar', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 25, unit: 'g' }, note: 'or to taste' },
        { item: 'Ice cubes', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' } },
      ],
      steps: [
        {
          text: 'A grown-up uses a sharp knife to cut four oranges and the lime in half, and to cut the last orange into thin wheels.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Roll each orange half on the table with your palm, then squeeze it over the jug on the citrus squeezer until no more juice comes out.',
          tip: 'Rolling first breaks the juice pockets so you get more out.',
        },
        { text: 'Squeeze in one half of the lime. Keep the other half for later in case the drink needs more zing.' },
        { text: 'Pour in the cold water and the sugar, then stir with the long spoon until you cannot see any sugar grains.' },
        { text: 'Add the ice cubes and float the orange wheels on top so it looks like a jug of marigolds.' },
        { text: 'Taste test! Too sharp? Stir in a spoon more sugar. Too sweet? Add a splash more water. Then pour one for someone you love.' },
      ],
      tip: 'Agua fresca just means fresh water: in Mexico it comes in every fruit color you can think of.',
    },
    {
      id: 'pan-de-muerto-mini-rolls',
      title: 'Pan de Muerto Mini Rolls',
      emoji: '🥖',
      blurb: 'Soft orange-scented buns with little dough bones on top, rolled in sugar while they are still warm.',
      minutes: 150,
      serves: 8,
      difficulty: 3,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'egg', 'milk'],
      swaps: [
        { avoid: 'milk', use: 'oat or soy milk and a dairy-free spread' },
        { avoid: 'wheat', use: 'a gluten-free bread flour blend (the buns will be a little denser)' },
      ],
      equipment: ['Big mixing bowl', 'Microwave-safe measuring jug', 'Fine grater or zester (grown-up)', 'Wooden spoon', 'Baking sheet lined with parchment paper', 'Clean dish towel', 'Pastry brush', 'Oven gloves'],
      ingredients: [
        { item: 'Bread flour', us: { qty: 3, unit: 'cup' }, metric: { qty: 375, unit: 'g' }, allergens: ['wheat', 'gluten'] },
        { item: 'Sugar', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 50, unit: 'g' } },
        { item: 'Instant yeast', us: { qty: 2, unit: 'tsp' }, metric: { qty: 7, unit: 'g' }, note: 'one small packet' },
        { item: 'Salt', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 2.5, unit: 'ml' } },
        { item: 'Anise seeds', us: { qty: 1, unit: 'tsp' }, metric: { qty: 2, unit: 'g' }, optional: true, note: 'the traditional liquorice-y flavor' },
        { item: 'Milk', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Eggs', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, allergens: ['egg'] },
        { item: 'Butter', us: { qty: 4, unit: 'tbsp' }, metric: { qty: 60, unit: 'g' }, note: 'softened', allergens: ['milk'] },
        { item: 'Orange', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'for the zest' },
        { item: 'Butter for brushing', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'melted', allergens: ['milk'] },
        { item: 'Sugar for rolling', us: { qty: 3, unit: 'tbsp' }, metric: { qty: 40, unit: 'g' } },
      ],
      steps: [
        {
          text: 'A grown-up warms the milk in the microwave for about 30 seconds until it feels like a warm bath, not hot.',
          adult: true,
          hazards: ['heat'],
          tip: 'Too hot and the yeast stops working, so test a drop on your wrist.',
        },
        {
          text: 'Stir the flour, sugar, yeast, salt and anise seeds together in the big bowl while a grown-up grates the orange zest in on top.',
          adult: true,
          hazards: ['sharp'],
        },
        { text: 'Crack in the eggs, pour in the warm milk and add the soft butter, then mix with the wooden spoon until it turns into a shaggy, sticky dough.' },
        {
          text: 'Sprinkle a little flour on the table and knead the dough for 8 minutes: push it away with your palms, fold it back, turn it, repeat.',
          timerMinutes: 8,
          tip: 'It is ready when it feels smooth and springs back a little when you poke it.',
        },
        { text: 'Put the dough back in the bowl, cover it with the dish towel and leave it somewhere warm for 60 minutes until it has grown to twice the size.', timerMinutes: 60 },
        { text: 'Punch the air out, keep back a piece the size of your fist, then divide the rest into 8 balls and space them out on the lined tray.' },
        {
          text: 'Roll the saved piece into thin ropes, pinch each rope into a knobbly bone shape, lay two bones across each bun in a cross and press a tiny ball of dough on top.',
          tip: 'Knuckle bumps are made by pressing the rope between your fingers.',
        },
        {
          text: 'Cover the tray and let the buns rise for 30 more minutes while a grown-up heats the oven to 350°F / 180°C.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 30,
        },
        {
          text: 'A grown-up bakes the buns for 15 minutes until they are golden brown, then lifts the tray out with oven mitts.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 15,
        },
        {
          text: 'Taste test! While they are still warm, brush each bun with melted butter, roll it in sugar and tear one open to see the soft inside.',
        },
      ],
      tip: 'Bakeries in Mexico start selling pan de muerto in October, and many families put one on the ofrenda before anyone eats it.',
    },
  ],

  crafts: [
    {
      id: 'papel-picado',
      title: 'Papel Picado',
      emoji: '🎏',
      blurb: 'Snip lacy patterns into tissue paper and string up a row of fluttering banners for your ofrenda or window.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Tissue paper', qty: '6 sheets in bright colors', substitute: 'thin wrapping paper or paper napkins' },
        { item: 'Scissors', substitute: 'ask a grown-up to make the first cuts and tear the rest' },
        { item: 'String or wool', qty: 'about 2 m' },
        { item: 'Glue stick', substitute: 'sticky tape' },
        { item: 'Hole punch', optional: true },
      ],
      steps: [
        { text: 'Fold one sheet of tissue paper in half, then in half again, so you have a small rectangle with folded edges.' },
        {
          text: 'Use scissors to snip small triangles, half-circles and half-hearts out of the folded edges, leaving the top edge uncut.',
          hazards: ['sharp'],
          tip: 'Tissue paper tears easily, so cut slowly and keep the shapes small.',
        },
        { text: 'Unfold the sheet very gently and look at the pattern: every snip became the same shape on both sides.' },
        { text: 'Do the same with the other sheets, trying a new fold or a zig-zag edge each time.' },
        { text: 'Lay the string along the top of each banner, fold about two finger-widths of paper over it and glue it down.' },
        { text: 'Hang your row of banners across a window or above the ofrenda and watch them move in the air.' },
      ],
      learn: 'Every fold doubles the pattern, so one cut makes two, four or eight matching holes: that is symmetry at work.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'Millions of monarch butterflies reach the mountain forests of central Mexico around the start of November, after flying thousands of kilometers from Canada and the US. Some families see them as visitors coming home.' },
    { sleeps: 11, kind: 'joke', text: 'Why are papel picado banners so good at parties? Because they love to hang out together!' },
    { sleeps: 10, kind: 'craft', text: 'Scrunch squares of orange and yellow tissue paper into little balls and glue them onto a paper circle to make a marigold that never wilts.' },
    { sleeps: 9, kind: 'say', text: 'Learn what children in Mexico say when they knock on doors for a sweet or a coin at Día de Muertos!', greeting: 1 },
    { sleeps: 8, kind: 'fact', text: 'Papel picado is often cut with tiny chisels and a hammer, through stacks of up to 50 sheets of tissue paper at once. The town of San Salvador Huixcolotla, in Puebla, is famous for it.' },
    { sleeps: 7, kind: 'color', text: 'Color in the Day of the Dead page with the brightest colors you have: marigold orange, sugar-skull pink and papel picado purple!' },
    { sleeps: 6, kind: 'joke', text: "What did the marigold say to the sunflower? Orange you glad we're the brightest flowers around?" },
    { sleeps: 5, kind: 'fact', text: 'The smiling skeleton lady in a big flowery hat is La Catrina. José Guadalupe Posada first drew her more than 100 years ago, the painter Diego Rivera later named her Catrina, and today many people paint their faces like hers.' },
    { sleeps: 4, kind: 'craft', text: 'Draw a family member or a pet you want to remember, and stand the picture on a little table beside a flower, like a tiny ofrenda.' },
    { sleeps: 3, kind: 'seek', text: 'Some sneaky things are hiding in the Day of the Dead picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 2, kind: 'fact', text: 'A Mexica legend says a dog called a xoloitzcuintle helps spirits on their long journey. Xolos are real, mostly hairless dogs, and one of the oldest dog breeds in the Americas.' },
    { sleeps: 1, kind: 'say', text: 'Tomorrow is Día de los Muertos! Tell someone your favorite story about a person you love, then learn the happy greeting for the big day.', greeting: 0 },
  ],

  parentNote:
    'Day of the Dead is about remembering, not fear: the skulls here are sweet and smiling. 1 November honors children who have died and 2 November adults, so the holiday can be tender for a family that has lost someone; children who want to make a small ofrenda of their own should be allowed to lead.',

  sources: [
    "Smithsonian National Museum of the American Latino, 'Día de los Muertos' (Latino history and culture resources)",
    "UNESCO, 'Indigenous festivity dedicated to the dead', Representative List of the Intangible Cultural Heritage of Humanity (2008)",
    "Encyclopaedia Britannica, 'Day of the Dead'",
    "Mexico City Government, 'Desfile de Día de Muertos' (first parade, 2016)",
  ],
};

export default dayOfTheDead;
