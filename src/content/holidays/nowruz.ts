import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Nowruz means "new day" in Persian, and it is the New Year festival that begins at the exact moment spring arrives in March, when day and night are the same length.',
    'It started in Iran more than three thousand years ago, and today more than 300 million people celebrate it, in Iran, Afghanistan, Kurdish regions, Azerbaijan, Central Asia and in families all over the world.',
    'Before the big day families scrub the whole house, buy new clothes and set a special table called the Haft-Seen, with seven things whose names begin with the Persian letter S.',
    'When the new year begins, families hug, wish each other a happy Nowruz, eat sweets, and children get crisp new banknotes from their grandparents and aunts and uncles.',
    'The celebrations go on for thirteen days, and on the last day, Sizdah Bedar, many families go outside for a picnic.',
  ],

  facts: [
    {
      text: 'Haft-Seen means "seven S\'s". The first four are sabzeh (green sprouts, for new life), samanu (a sweet wheat pudding, for strength), senjed (a dried fruit, for love) and seer (garlic, for good health).',
    },
    {
      text: 'The other three S\'s are seeb (an apple, for beauty), somagh (red sumac spice, the color of sunrise) and serkeh (vinegar, for patience). Many tables add a mirror, painted eggs, a goldfish, a hyacinth flower, coins and a book of poems.',
    },
    {
      text: 'The new year does not begin at midnight but at the exact second of the spring equinox, worked out by astronomers, so it might fall at breakfast time or at three in the morning. Families sit around the Haft-Seen, count down and cheer at that very moment.',
      wow: true,
    },
    {
      text: 'The Iranian calendar counts years from a different starting point. The year that begins at Nowruz in March 2026 is the year 1405. In 2010 the United Nations made 21 March the International Day of Nowruz.',
      bigKids: true,
    },
    {
      text: 'On the last Tuesday night before Nowruz, called Chaharshanbe Suri, people jump over small bonfires, singing "my yellow to you, your red to me": give the fire your tiredness, and take its warmth and energy for the new year.',
    },
    {
      text: 'On the thirteenth day, Sizdah Bedar, families picnic outdoors and drop their sabzeh sprouts into a stream or river so the water carries away any bad luck. Some people tie blades of grass into a knot and make a wish.',
    },
  ],

  greetings: [
    {
      lang: 'fa',
      langName: 'Persian (Farsi)',
      text: 'نوروز مبارک',
      roman: 'Nowruz mobarak',
      sayIt: 'noh-ROOZ moh-bah-RAK',
      meaning: 'Happy Nowruz',
    },
    {
      lang: 'fa',
      langName: 'Persian (Farsi)',
      text: 'سال نو مبارک',
      roman: 'Sal-e no mobarak',
      sayIt: 'SAH-leh NOH moh-bah-RAK',
      meaning: 'Happy new year',
    },
    {
      lang: 'ku',
      langName: 'Kurdish (Kurmanji)',
      text: 'Newroz pîroz be',
      sayIt: 'neh-ROHZ pee-ROHZ beh',
      meaning: 'May Newroz be blessed (Happy Newroz)',
    },
    {
      lang: 'prs',
      langName: 'Dari (Afghan Persian)',
      text: 'نوروز مبارک',
      roman: 'Nawroz mubarak',
      sayIt: 'now-ROHZ moo-bah-RAK',
      meaning: 'Happy Nowruz',
    },
    {
      lang: 'az',
      langName: 'Azerbaijani',
      text: 'Novruz bayramınız mübarək',
      roman: 'Novruz bayraminiz mubarek',
      sayIt: 'nov-ROOZ bye-rah-muh-NUHZ mew-bah-RAK',
      meaning: 'Happy Nowruz holiday to you',
    },
  ],

  recipes: [
    {
      id: 'haft-seen-fruit-and-seed-plate',
      title: 'Haft-Seen Fruit & Seed Plate',
      emoji: '🍎',
      blurb: 'Build your own Haft-Seen you can eat: seven foods whose names start with S (in Persian or in English), arranged in a circle around a creamy sesame dip.',
      minutes: 20,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['sesame', 'tree-nut'],
      swaps: [
        { avoid: 'sesame', use: 'sunflower-seed butter instead of tahini, and pumpkin seeds instead of sesame seeds' },
        { avoid: 'tree-nut', use: 'leave out the pistachios and sprinkle pumpkin seeds on top instead' },
      ],
      chokingNote: 'Whole nuts and seeds are choking hazards for children under 4: leave the pistachios out for little ones and give them the soft fruit and dip.',
      equipment: ['Large round plate or tray', 'Small bowl for the dip', 'Spoon', 'Small cutting board', 'Knife (grown-up)'],
      ingredients: [
        { item: 'Tahini (sesame paste)', us: { qty: 3, unit: 'tbsp' }, metric: { qty: 45, unit: 'ml' }, allergens: ['sesame'] },
        { item: 'Maple syrup or honey', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'ml' }, note: 'no honey for babies under 1' },
        { item: 'Cold water', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'ml' }, note: 'a little more if the dip is thick' },
        { item: 'Apples (seeb)', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, note: 'red ones look best' },
        { item: 'Strawberries', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' } },
        { item: 'Satsumas or clementines', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' } },
        { item: 'Senjed (dried oleaster fruit) or golden raisins', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 40, unit: 'g' }, note: 'senjed comes from Persian grocers; golden raisins or dates work too' },
        { item: 'Sunflower seeds', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 35, unit: 'g' } },
        { item: 'Sugar snap peas', us: { qty: 1, unit: 'cup' }, metric: { qty: 100, unit: 'g' } },
        { item: 'Sesame seeds', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'for the top of the dip', allergens: ['sesame'] },
        { item: 'Shelled pistachios', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' }, optional: true, allergens: ['tree-nut'] },
      ],
      steps: [
        {
          text: 'Put the tahini, maple syrup and cold water in the small bowl and stir hard until the dip turns smooth and creamy. Sprinkle the sesame seeds on top.',
          tip: 'Tahini goes stiff at first and then loosens up. Keep stirring.',
        },
        { text: 'Set the bowl of dip in the middle of the big plate. The seven foods will go around it like the numbers on a clock.' },
        {
          text: 'A grown-up cuts the apples into thin wedges and takes out the cores.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Pull the green tops off the strawberries and peel the satsumas, then pull them apart into segments.',
          kidSafeOverride: 'strawberry tops and satsuma peel come off by hand; no tools are used',
        },
        {
          text: 'Arrange the seven S foods in seven piles around the dip: apple (seeb), strawberries, satsumas, senjed or golden raisins, sunflower seeds, sugar snap peas and sesame dip in the middle. Say each name out loud as you go.',
          kidSafeOverride: 'the apple is already cut; this step only arranges food on the plate',
        },
        { text: 'Scatter the pistachios over the top, if you are using them. Green on the Haft-Seen stands for spring.' },
        { text: 'Taste test! Dip an apple wedge in the sesame dip, and go round the table giving everyone a Nowruz wish.' },
      ],
      tip: 'A real Haft-Seen table is not eaten straight away: it stays on show for the whole thirteen days. Yours can be the snack-sized version you eat today.',
    },
    {
      id: 'sholeh-zard-saffron-rice-pudding',
      title: 'Sholeh Zard Saffron Rice Pudding',
      emoji: '🍚',
      blurb: 'A golden rice pudding scented with saffron and rose water, decorated with cinnamon patterns. Iranian families make it for Nowruz and share it with neighbors. A grown-up runs the stove; kids rinse, stir and decorate.',
      minutes: 120,
      serves: 8,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['tree-nut'],
      swaps: [
        { avoid: 'tree-nut', use: 'leave out the almonds and pistachios; decorate with cinnamon only or with pumpkin seeds' },
      ],
      equipment: ['Large heavy pot with a lid', 'Sieve', 'Wooden spoon', 'Small bowl', 'Ladle', '8 small bowls or one big dish', 'Paper and a pencil for a stencil', 'Small sieve or tea strainer'],
      ingredients: [
        { item: 'Short-grain or basmati rice', us: { qty: 1, unit: 'cup' }, metric: { qty: 200, unit: 'g' } },
        { item: 'Water', us: { qty: 7, unit: 'cup' }, metric: { qty: 1700, unit: 'ml' } },
        { item: 'Sugar', us: { qty: 1.5, unit: 'cup' }, metric: { qty: 300, unit: 'g' } },
        { item: 'Saffron threads', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 2, unit: 'ml' }, note: 'a generous pinch' },
        { item: 'Rose water', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 60, unit: 'ml' }, note: 'from the baking aisle or a Middle Eastern grocer' },
        { item: 'Ground cardamom', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 2, unit: 'ml' } },
        { item: 'Slivered almonds', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 30, unit: 'g' }, optional: true, allergens: ['tree-nut'] },
        { item: 'Ground cinnamon', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'to decorate' },
        { item: 'Chopped pistachios', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' }, optional: true, note: 'to decorate', allergens: ['tree-nut'] },
      ],
      steps: [
        {
          text: 'Put the rice in the sieve and rinse it under the cold tap, swishing it with your fingers, until the water running out looks clear instead of cloudy.',
        },
        {
          text: 'A grown-up tips the rice and the water into the big pot, brings it to the boil, then turns the heat down low. Simmer with the lid half on for 45 minutes, stirring every so often, until the rice is very soft and falling apart.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 45,
        },
        {
          text: 'While the rice cooks, put the saffron threads and a pinch of sugar in the small bowl and crush them with the back of a teaspoon into an orange powder.',
          tip: 'The sugar grains help grind the saffron. The powder stains, so keep it away from clothes.',
        },
        {
          text: 'A grown-up adds 3 tablespoons of hot water from the pot to the saffron powder. Watch it turn bright gold.',
          adult: true,
          hazards: ['hot-liquid'],
        },
        {
          text: 'A grown-up stirs the sugar into the rice and keeps it simmering for 10 minutes. The pudding goes glossy.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 10,
        },
        {
          text: 'A grown-up stirs in the saffron water, rose water, cardamom and almonds, and simmers for 15 more minutes, stirring often, until the pudding is as thick as porridge and golden all the way through.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 15,
        },
        {
          text: 'A grown-up ladles the hot pudding into the small bowls. Leave them on the counter to cool for 30 minutes; the pudding sets as it cools.',
          adult: true,
          hazards: ['hot-liquid'],
          timerMinutes: 30,
        },
        {
          text: 'Decorating time. Hold a paper stencil (a star, a flower or a strip pattern) over each bowl and shake cinnamon through the small sieve, then add a few pistachios. Lift the paper and see your design.',
          tip: 'Traditional patterns are lines, diamonds and flowers. Try writing the first letter of your name.',
        },
        { text: 'Taste test! Sholeh zard is eaten cool or chilled, with a spoon, so wait until it is set before you dig in.' },
      ],
      tip: 'Sholeh zard means "yellow pudding". Many families make a huge pot and give bowls to neighbors and friends; sharing it is part of the point.',
    },
  ],

  crafts: [
    {
      id: 'sabzeh-sprouting-cup',
      title: 'Sabzeh Sprouting Cup',
      emoji: '🌱',
      blurb: 'Grow a little green hill of wheat or lentil sprouts, the sabzeh that sits on most Haft-Seen tables. Start about ten days before Nowruz so it is tall and green on the day. About 20 minutes of work, spread over ten days.',
      minutes: 20,
      mess: 2,
      adultHelp: 'none',
      hazards: [],
      materials: [
        { item: 'Wheat berries (whole wheat grains) or dried green lentils', qty: '1/2 cup (100 g)', substitute: 'mung beans or chickpeas' },
        { item: 'Bowl', qty: '1' },
        { item: 'Shallow dish, saucer or wide cup', qty: '1' },
        { item: 'Paper towels or a thin cloth' },
        { item: 'Clean dish towel' },
        { item: 'Spray bottle', optional: true, substitute: 'your fingertips dipped in water' },
        { item: 'Ribbon', qty: 'about 20 inches (50 cm)', optional: true },
      ],
      steps: [
        {
          text: 'Day 1: Put the seeds in the bowl, cover them with plenty of cool water and leave them to soak overnight.',
          tip: 'The seeds swell up and drink the water. That wakes them up.',
        },
        { text: 'Day 2: Pour the water away, rinse the seeds and soak them again in fresh water for one more day. Tiny white tails will start to show.' },
        {
          text: 'Day 3: Fold two paper towels to fit your dish and wet them so they are damp, not dripping. Drain the seeds and spread them over the paper in one thick layer.',
        },
        { text: 'Lay the damp dish towel over the top and put the dish somewhere warm, out of direct sun. The dark, damp blanket makes the roots grow down.' },
        { text: 'Every morning and evening, lift the towel and spray or sprinkle water on the seeds so they never dry out. Wet the towel again too.' },
        { text: 'Days 5 or 6: When green shoots are poking up about a finger-width high, take the towel off for good and move the dish to a bright windowsill.' },
        { text: 'Keep watering a little every day and turn the dish each morning so the sprouts grow straight instead of leaning toward the window.' },
        { text: 'Nowruz day: Tie the ribbon in a bow around your green hill and put it on the table. On Sizdah Bedar, the thirteenth day, take it outside and give it back to nature, by a stream if you have one.' },
      ],
      learn: 'Sabzeh means "greenery". It stands for new life and the coming of spring. Measure your sprouts each day with a ruler and write the height on a chart: wheat can grow more than an inch (3 cm) in a single day.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'craft', text: 'Start sprouts for your Haft-Seen today: sprinkle a few lentils on a damp cotton pad in a saucer, keep it moist, and watch them turn green before Nowruz.' },
    { sleeps: 11, kind: 'fact', text: "The big spring clean before Nowruz has its own name: khaneh tekani, which means 'shaking the house'. Families wash curtains, shake out rugs and clear every corner." },
    { sleeps: 10, kind: 'joke', text: 'Why did the house giggle all week before Nowruz? Everyone kept tickling it with feather dusters!' },
    { sleeps: 9, kind: 'say', text: 'Learn to say happy Newroz in Kurdish!', greeting: 2 },
    { sleeps: 8, kind: 'fact', text: 'In Iranian folk stories, Amu Nowruz, or Uncle Nowruz, is a kind old man with a white beard and a felt hat who visits at the new year and brings children gifts.' },
    { sleeps: 7, kind: 'color', text: 'Color in the Nowruz page with fresh spring colors: sprout green, sunrise red and every flower color you can think of!' },
    { sleeps: 6, kind: 'fact', text: 'In Azerbaijan, each of the four Tuesdays before Novruz has its own element: water, then fire, then wind, then earth, as nature wakes up step by step.' },
    { sleeps: 5, kind: 'joke', text: 'Why did the goldfish love Nowruz? Because the new year was off to a swimming start!' },
    { sleeps: 4, kind: 'craft', text: 'Draw big egg shapes on paper and fill them with bright felt-tip patterns to make painted eggs for your Haft-Seen.' },
    { sleeps: 3, kind: 'seek', text: 'Some sneaky things are hiding in the Nowruz picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 2, kind: 'fact', text: "In Afghanistan, many families make haft mewa, which means 'seven fruits'. Dried fruits and nuts soak in water for a couple of days until the water turns into a sweet syrup." },
    { sleeps: 1, kind: 'say', text: 'Tomorrow the new year arrives at the exact moment of spring! Practise the words families say with a hug when the countdown ends.', greeting: 0 },
  ],

  parentNote:
    'Nowruz begins at the exact moment of the March equinox, worked out by astronomers. Depending on the year and your time zone that moment falls on 19, 20 or 21 March, so the first day can differ by one day depending on where you live. The thirteen days shown run from Nowruz to Sizdah Bedar. Chaharshanbe Suri fire-jumping is a grown-up activity. Some families today choose a bowl of oranges or a toy fish for the Haft-Seen instead of a live goldfish.',

  sources: [
    "UNESCO, Representative List of the Intangible Cultural Heritage of Humanity, 'Nowruz' (inscribed 2009, extended 2016)",
    "United Nations General Assembly resolution 64/253 (2010), 'International Day of Nowruz'",
    "Encyclopaedia Iranica, 'Nowruz' and 'Haft Sin'",
    "Najmieh Batmanglij, 'Food of Life: Ancient Persian and Modern Iranian Cooking and Ceremonies' (sholeh zard)",
  ],
};

export default content;
