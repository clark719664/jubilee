import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Hanukkah, also spelled Chanukah, is the Jewish Festival of Lights, and it lasts eight nights.',
    'Jewish families remember a time more than two thousand years ago when their Temple in Jerusalem was won back and made holy again, and the story says that a tiny jar of oil, only enough for one day, kept the Temple lamp burning for eight days.',
    'Each night families light one more candle on a special candle-holder called a menorah (or hanukkiah), say blessings and sing songs.',
    'Many families eat foods fried in oil, like crispy potato latkes and jelly doughnuts, play the spinning-top game dreidel and give small gifts or chocolate coins called gelt.',
  ],

  facts: [
    {
      text: 'A hanukkiah has nine branches: eight for the eight nights, and one extra called the shamash, the helper, which is used to light all the others.',
    },
    {
      text: 'Candles are placed from right to left but lit from left to right, so the newest candle is always the first one lit.',
    },
    {
      text: 'Over the eight nights a family burns 44 candles in total: one more each night, plus the helper candle every night (2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 = 44).',
      bigKids: true,
    },
    {
      text: 'The four Hebrew letters on a dreidel, nun, gimel, hei and shin, stand for Nes gadol haya sham, "A great miracle happened there." In Israel the last letter is pei, for po, "here."',
      wow: true,
    },
    {
      text: 'Hanukkah starts on the 25th day of the Hebrew month of Kislev, so on the everyday calendar it wanders between late November and late December. In 2013 its first day landed on Thanksgiving in the US, and people called it Thanksgivukkah.',
      bigKids: true,
    },
    {
      text: 'Many families put the hanukkiah in a window or by the front door so that people walking past can see the lights. Sharing the light is part of the holiday.',
    },
  ],

  greetings: [
    {
      lang: 'he',
      langName: 'Hebrew',
      text: 'חג שמח',
      roman: 'Chag Sameach',
      sayIt: 'KHAHG sah-MAY-akh',
      meaning: 'Happy holiday',
    },
    {
      lang: 'he',
      langName: 'Hebrew',
      text: 'חג חנוכה שמח',
      roman: 'Chag Chanukah Sameach',
      sayIt: 'KHAHG khah-noo-KAH sah-MAY-akh',
      meaning: 'Happy Hanukkah holiday',
    },
    {
      lang: 'yi',
      langName: 'Yiddish',
      text: 'אַ פֿריילעכן חנוכּה',
      roman: 'A freylekhn Khanike',
      sayIt: 'ah FRAY-lekh-un KHAH-nih-kuh',
      meaning: 'A happy Hanukkah',
    },
    {
      lang: 'yi',
      langName: 'Yiddish',
      text: 'אַ ליכטיקן חנוכּה',
      roman: 'A likhtikn Khanike',
      sayIt: 'ah LIKH-tih-kun KHAH-nih-kuh',
      meaning: 'A Hanukkah full of light',
    },
  ],

  recipes: [
    {
      id: 'jelly-doughnut-sandwiches',
      title: 'Jelly Doughnut Sandwiches',
      emoji: '🍩',
      blurb: 'Real sufganiyot are fried in oil to remember the Temple oil. These little round jam sandwiches, dusted with sugar, are the no-stove, no-waiting version. Makes 8.',
      minutes: 15,
      serves: 4,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: ['wheat', 'gluten'],
      mayContain: ['milk', 'soy'],
      swaps: [
        { avoid: 'wheat', use: 'gluten-free sandwich bread' },
        { avoid: 'gluten', use: 'gluten-free sandwich bread' },
      ],
      equipment: ['drinking glass or round cookie cutter', 'teaspoon', 'fork', 'small sieve', 'plate'],
      ingredients: [
        { item: 'soft white bread', us: { qty: 16, unit: 'slice' }, metric: { qty: 16, unit: 'slice' }, note: 'check the label: many breads contain milk or soy', allergens: ['wheat', 'gluten'] },
        { item: 'strawberry or raspberry jam', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' } },
        { item: 'powdered sugar', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'ml' } },
      ],
      steps: [
        {
          text: 'Press the rim of a drinking glass firmly into the middle of each bread slice to stamp out a circle. You need 16 circles.',
          kidSafeOverride: 'the bread is already sliced; the circles are stamped out with a glass',
          tip: 'Keep the crusts for breadcrumbs or a snack.',
        },
        { text: 'Flatten each circle a little with the palm of your hand, so it will hold the jam without tearing.' },
        { text: 'Spoon one teaspoon of jam into the centre of 8 of the circles.' },
        { text: 'Put a plain circle on top of each jammy one and press the edges together all the way round with a fork, to seal the jam inside.' },
        { text: 'Hold a small sieve over the sandwiches and tap it to shower them with powdered sugar.' },
        { text: 'Arrange them on a plate: eight little doughnuts, one for each night.' },
        { text: 'Taste test! Bite into the middle to find the jelly.' },
      ],
      tip: 'Jelly doughnuts are called sufganiyot in Hebrew. In Israel bakeries sell millions of them every Hanukkah.',
    },
    {
      id: 'easy-latkes',
      title: 'Easy Latkes',
      emoji: '🥔',
      blurb: 'Crispy, golden potato pancakes. Kids squeeze, mix and shape; a grown-up does the grating and the frying. Makes about 20 small latkes.',
      minutes: 45,
      serves: 4,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['egg', 'wheat', 'gluten'],
      swaps: [
        { avoid: 'wheat', use: '2 tbsp potato starch instead of the flour' },
        { avoid: 'gluten', use: '2 tbsp potato starch instead of the flour' },
        { avoid: 'egg', use: '2 tbsp potato starch mixed with 3 tbsp water instead of the eggs' },
      ],
      equipment: ['box grater', 'large bowl', 'clean tea towel', 'wide frying pan', 'spatula', 'plate lined with paper towel'],
      ingredients: [
        { item: 'potatoes', us: { qty: 2, unit: 'lb' }, metric: { qty: 900, unit: 'g' }, note: 'about 4 medium; floury kinds like russet work best' },
        { item: 'onion', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'small' },
        { item: 'eggs', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, allergens: ['egg'] },
        { item: 'all-purpose flour', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 30, unit: 'g' }, allergens: ['wheat', 'gluten'] },
        { item: 'salt', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'plus a pinch to finish' },
        { item: 'black pepper', us: { qty: 0.25, unit: 'tsp' }, metric: { qty: 1, unit: 'ml' } },
        { item: 'vegetable oil', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' }, note: 'for frying' },
        { item: 'applesauce', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, note: 'to serve', optional: true },
      ],
      steps: [
        {
          text: 'Peel the potatoes, then grate them and the onion on the big holes of a box grater into a large bowl.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Pile the grated potato and onion into a clean tea towel and squeeze it hard over the sink to wring out as much liquid as you can.',
          kidSafeOverride: 'the grating is finished; this step only squeezes the towel',
          tip: 'Dry potato is the secret to crispy latkes. Squeeze, then squeeze again.',
        },
        {
          text: 'Tip the potato back into the bowl, crack in the eggs, add the flour, salt and pepper, and mix it all together with a fork.',
          hazards: ['raw-egg'],
        },
        {
          text: 'Pour the oil into a wide frying pan, about 1/4 inch (5 mm) deep, and heat it over medium-high heat until a shred of potato dropped in sizzles straight away.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
        },
        {
          text: 'Scoop a heaped tablespoon of the mix and gently pat it into a flat round patty on a plate. Make as many as you can.',
          tip: 'Thin patties get crispier than fat ones.',
        },
        {
          text: 'Slide the patties into the hot oil, a few at a time, and fry for 4 minutes on each side until deep golden and crispy.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 4,
        },
        {
          text: 'Lift the latkes onto the paper-towel plate to drain, and sprinkle them with a pinch of salt while they are hot.',
          adult: true,
          hazards: ['heat'],
        },
        { text: 'Taste test! Eat them warm with a spoonful of applesauce, or sour cream if your family likes it.' },
      ],
      tip: 'Grated potato turns brown fast. Work quickly, or keep it under cold water until the grown-up is ready to fry, then squeeze it dry.',
    },
  ],

  crafts: [
    {
      id: 'paper-dreidel',
      title: 'Paper Dreidel',
      emoji: '🌀',
      blurb: 'Fold a little card box, add a pencil, and you have a spinning top that really spins. Then play the game!',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'thin card', qty: '1 sheet', substitute: 'the flat side of a cereal box' },
        { item: 'ruler' },
        { item: 'sharpened pencil' },
        { item: 'scissors' },
        { item: 'tape' },
        { item: 'markers or crayons' },
        { item: 'chocolate coins, buttons or pennies', qty: '10 per player', optional: true },
      ],
      steps: [
        {
          text: 'With a ruler, draw a column of four squares on the card, each 2 inches (5 cm) wide, then draw one more square on the left and one on the right of the second square. That is six squares in a cross shape.',
        },
        {
          text: 'Cut around the outside of the cross shape.',
          hazards: ['sharp'],
          kidSafeOverride: 'safety scissors on thin card; a grown-up helps younger children',
        },
        { text: 'Fold firmly along every line between the squares, so the shape wants to curl up into a box.' },
        {
          text: 'Write one Hebrew letter on each of the four squares in the tall column: nun (נ), gimel (ג), hei (ה) and shin (ש). The two side squares will be the top and bottom. Decorate with stars and colours.',
          tip: 'The letters stand for "A great miracle happened there."',
        },
        { text: 'Fold the shape up into a cube and tape the edges shut.' },
        {
          text: 'Push the sharpened pencil straight down through the top and bottom squares, so a short point pokes out of the bottom and the long end is the handle.',
          adult: true,
          hazards: ['sharp'],
        },
        { text: 'Give the handle a twist, spin it on the table and see which letter lands face up!' },
      ],
      learn: 'To play, everyone puts one coin in the middle and takes turns spinning. Nun: nothing happens. Gimel: take the whole pile. Hei: take half. Shin: put one in.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: "Hanukkah is a Hebrew word that means 'dedication'. The holiday remembers the day the Temple in Jerusalem was dedicated, or made ready, all over again." },
    { sleeps: 11, kind: 'joke', text: 'Why did the jelly doughnut go to the dentist? It needed a filling!' },
    { sleeps: 10, kind: 'colour', text: 'Crayons ready? The Hanukkah colouring page is waiting for blue and white, and lots of glowing candle gold. Open the colouring page!' },
    { sleeps: 9, kind: 'fact', text: "The heroes of the Hanukkah story are called the Maccabees, after their leader Judah Maccabee. Many people say his nickname comes from an old word for 'hammer', because he was so strong." },
    { sleeps: 8, kind: 'craft', text: 'Make a giant gelt coin: wrap a cardboard circle in kitchen foil, then press a pattern into it with the blunt end of a pencil.' },
    { sleeps: 7, kind: 'say', text: 'Learn to say happy Hanukkah in Yiddish, the language many Jewish grandparents and great-grandparents spoke!', greeting: 2 },
    { sleeps: 6, kind: 'fact', text: 'Gelt is the Yiddish word for money. Long ago children were given real coins at Hanukkah; chocolate coins wrapped in gold foil came much later.' },
    { sleeps: 5, kind: 'joke', text: "What did the dreidel say after the game? 'I need to lie down. Everything is spinning!'" },
    { sleeps: 4, kind: 'seek', text: 'The Hanukkah picture is full of hidden surprises. How many can you find? Open Seek & Find!' },
    { sleeps: 3, kind: 'fact', text: 'In Israel the favourite Hanukkah treat is the sufganiyah, a round jelly doughnut fried in oil. Bakeries there make millions of them every Hanukkah.' },
    { sleeps: 2, kind: 'say', text: 'Learn the Hebrew greeting for Hanukkah, so you can say it on every one of the eight nights!', greeting: 1 },
    { sleeps: 1, kind: 'craft', text: 'Make a welcome garland: draw nine little flames on yellow paper, tear them out and tape them along a string. Hang it by the window for when Hanukkah begins at sundown!' },
  ],

  parentNote: 'Hanukkah begins at sundown: the first candle is lit on the evening before the first full day, 25 Kislev on the Hebrew calendar. The dates move each year and can land anywhere from late November to late December. Hanukkah, Chanukah and Hanukah are all correct spellings of the same word.',

  sources: [
    "1 Maccabees 4:36–59 (the rededication of the Temple)",
    "Babylonian Talmud, Shabbat 21b (the story of the oil and the rules for lighting)",
    "Encyclopaedia Britannica, 'Hanukkah'",
    "YIVO Institute for Jewish Research, standard Yiddish orthography and romanisation",
  ],
};

export default content;
