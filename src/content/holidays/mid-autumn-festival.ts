import type { HolidayContent } from '../types';

const midAutumnFestival: HolidayContent = {
  story: [
    'The Mid-Autumn Festival, also called the Moon Festival or Zhongqiu, falls on the night of the brightest full moon of fall, the fifteenth day of the eighth month of the Chinese lunar calendar.',
    'Many families in China, and Chinese families all over the world, eat dinner together, then go outside to look up at the moon and share round pastries called mooncakes.',
    'In Vietnam the same night is Tết Trung Thu, a festival made for children, with star-shaped lanterns and lion dances in the streets; in Korea the harvest festival Chuseok falls on the same full moon.',
    "A legend tells of Chang'e, a woman who drank a magic potion and floated all the way up to the moon, where she still lives with a jade rabbit; some people say they can see them when they look up.",
    'The round moon and the round mooncakes stand for the same thing: a family that is whole and together.',
  ],

  facts: [
    {
      text: 'The festival always falls on the fifteenth day of the eighth lunar month, so it lands between early September and early October. It is usually the very same full moon that farmers in Europe and North America call the Harvest Moon.',
      bigKids: true,
    },
    {
      text: "China names its moon missions after Chang'e, the lady in the legend, and its moon rovers Yutu, which means Jade Rabbit. In 2019 the Chang'e 4 lander set a Jade Rabbit rover down on the far side of the moon, the first vehicle ever to drive there.",
      wow: true,
    },
    {
      text: 'A traditional mooncake is a small, heavy pastry with a pattern pressed into its top and a sweet lotus-seed or red-bean filling. Many have a salted egg yolk in the middle, so when you cut one open you see a little golden full moon. Mooncakes are cut into wedges and shared, not eaten whole.',
    },
    {
      text: 'In Vietnam, Tết Trung Thu is a children’s festival. Kids carry star lanterns called đèn ông sao, watch lion dances and look for Chú Cuội, the man in the moon, who a story says floated up to the moon while holding on to a magic banyan tree.',
    },
    {
      text: 'In Korea the same full moon is Chuseok. Families visit the graves of their grandparents and great-grandparents, and make songpyeon, little half-moon rice cakes steamed on a bed of pine needles.',
    },
    {
      text: 'In the Tai Hang neighborhood of Hong Kong, a dragon made of straw and rope, 67 meters (220 feet) long and stuck all over with thousands of glowing incense sticks, is danced through the streets for three nights around the festival. The tradition began in 1880.',
    },
  ],

  greetings: [
    {
      lang: 'zh-Hans',
      langName: 'Mandarin Chinese',
      text: '中秋节快乐',
      roman: 'Zhōngqiū jié kuàilè',
      sayIt: 'jong-chyoh JYEH kwhy-LUH',
      meaning: 'Happy Mid-Autumn Festival',
    },
    {
      lang: 'yue',
      langName: 'Cantonese',
      text: '中秋節快樂',
      roman: 'Zung cau zit faai lok',
      sayIt: 'joong chow jeet fye LOCK',
      meaning: 'Happy Mid-Autumn Festival',
    },
    {
      lang: 'vi',
      langName: 'Vietnamese',
      text: 'Chúc mừng Tết Trung Thu',
      roman: 'Chuc mung Tet Trung Thu',
      sayIt: 'chook mung TET choong TOO',
      meaning: 'Happy Mid-Autumn Festival (Tết Trung Thu is the Vietnamese name for the festival)',
    },
    {
      lang: 'ko',
      langName: 'Korean',
      text: '즐거운 추석 보내세요',
      roman: 'Jeulgeoun Chuseok bonaeseyo',
      sayIt: 'jul-guh-oon CHOO-suk boh-nay-SAY-yo',
      meaning: 'Have a joyful Chuseok (the Korean harvest-moon festival on the same night)',
    },
  ],

  recipes: [
    {
      id: 'mooncake-stamped-cookie-sandwiches',
      title: 'Mooncake-Stamped Cookie Sandwiches',
      emoji: '🥮',
      blurb: 'Real mooncakes take a whole day to make. These little round cookie sandwiches have a sweet red-bean filling and a moon or rabbit pattern dusted on top, and they take half an hour. Makes 8.',
      minutes: 35,
      serves: 8,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['wheat', 'gluten', 'milk', 'soy'],
      mayContain: ['egg', 'tree-nut'],
      swaps: [
        { avoid: 'wheat', use: 'gluten-free round cookies' },
        { avoid: 'gluten', use: 'gluten-free round cookies' },
        { avoid: 'milk', use: 'dairy-free cream cheese and dairy-free cookies' },
        { avoid: 'soy', use: 'cookies without soy lecithin, and skip the chocolate spread' },
      ],
      equipment: ['Mixing bowl', 'Fork', 'Teaspoon', 'Small sieve', 'A square of paper', 'Safety scissors', 'Plate or tray'],
      ingredients: [
        { item: 'Round butter cookies', us: { qty: 16, unit: 'piece' }, metric: { qty: 16, unit: 'piece' }, note: 'about 2 inches / 5 cm across; check the label for nuts and soy', allergens: ['wheat', 'gluten', 'milk'] },
        { item: 'Cream cheese', us: { qty: 4, unit: 'oz' }, metric: { qty: 110, unit: 'g' }, note: 'softened', allergens: ['milk'] },
        { item: 'Powdered sugar', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' } },
        { item: 'Sweet red bean paste', us: { qty: 0.33, unit: 'cup' }, metric: { qty: 100, unit: 'g' }, note: 'sold in tubs or cans at East Asian grocers, sometimes labeled anko' },
        { item: 'Chocolate spread', us: { qty: 0.33, unit: 'cup' }, metric: { qty: 100, unit: 'g' }, note: 'instead of the red bean paste, if you prefer; choose a nut-free one', optional: true, allergens: ['milk', 'soy'] },
        { item: 'Cocoa powder', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 5, unit: 'g' }, note: 'or extra powdered sugar, for dusting the pattern' },
      ],
      steps: [
        { text: 'Put the cream cheese and powdered sugar in the bowl and mash them with a fork until smooth and creamy.' },
        {
          text: 'Add the red bean paste and stir until the filling is all one color.',
          tip: 'Red bean paste is the classic mooncake filling. No red bean paste? Use the chocolate spread instead.',
        },
        { text: 'Lay 8 cookies on the plate, flat side up. Spoon a heaped tablespoon of filling onto each one and spread it almost to the edge.' },
        { text: 'Press a second cookie on top of each, flat side down, and squeeze gently until a little filling peeks out all the way round, like the rim of a full moon.' },
        {
          text: 'Make a stencil: fold the square of paper in half and snip out half a moon, a star or a rabbit shape along the fold with safety scissors, then unfold it.',
          kidSafeOverride: 'Safety scissors on a small square of paper.',
        },
        {
          text: 'Hold the stencil flat on top of a sandwich, tap a sieve of cocoa powder over it, then lift the paper straight up. The shape stays behind, like the pattern pressed into a real mooncake. Stamp every sandwich.',
          tip: 'Lift the stencil straight up, not sideways, or the pattern smudges.',
        },
        { text: 'Chill the sandwiches in the fridge so the filling firms up.', timerMinutes: 15 },
        {
          text: 'Taste test! Mooncakes are cut into wedges so everyone gets a piece: cut one sandwich into quarters with a butter knife and hand the pieces round.',
          kidSafeOverride: 'A butter knife on a soft cookie sandwich.',
        },
      ],
      tip: 'The pattern on a real mooncake is pressed in with a wooden or plastic mold. If you have a cookie stamp, press it gently into a thin layer of filling on the top cookie instead of using the stencil.',
    },
    {
      id: 'sweet-tangyuan',
      title: 'Sweet Tangyuan',
      emoji: '🍡',
      blurb: 'Soft, chewy rice balls, round like the full moon, floating in a warm ginger and brown-sugar soup. Kids roll the balls; a grown-up does the boiling. Makes about 50 marble-sized balls.',
      minutes: 45,
      serves: 4,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: [],
      chokingNote: 'Chewy rice balls are a choking hazard for little children. Keep them marble-sized, cut them in half for children under 4, and sit down together to eat.',
      equipment: ['Mixing bowl', 'Measuring jug', 'Tray dusted with rice flour', 'Small saucepan', 'Large saucepan', 'Slotted spoon', 'Ladle', '4 bowls'],
      ingredients: [
        { item: 'Glutinous rice flour', us: { qty: 1, unit: 'cup' }, metric: { qty: 130, unit: 'g' }, note: 'also called sweet rice flour; despite the name it has no gluten' },
        { item: 'Warm water', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' }, note: 'you may not need it all' },
        { item: 'Food coloring', us: { qty: 3, unit: 'piece' }, metric: { qty: 3, unit: 'piece' }, note: 'a drop each of pink, yellow and green', optional: true },
        { item: 'Water, for the syrup', us: { qty: 3, unit: 'cup' }, metric: { qty: 720, unit: 'ml' } },
        { item: 'Brown sugar', us: { qty: 0.33, unit: 'cup' }, metric: { qty: 65, unit: 'g' } },
        { item: 'Fresh ginger', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'a thumb-sized piece' },
      ],
      steps: [
        {
          text: 'Tip the glutinous rice flour into the bowl. Pour in the warm water a little at a time, stirring with a spoon, until it starts to clump together.',
          tip: 'Glutinous means sticky, not gluten. This flour is made from a sticky kind of rice.',
        },
        {
          text: 'Knead the dough with your hands until it is smooth and feels like play dough: not sticky, not cracking.',
          tip: 'Too dry and crumbly? Add a teaspoon of water. Too sticky? Dust in a spoonful of flour.',
        },
        { text: 'If you want colored balls, split the dough into three lumps, add one drop of food coloring to each and knead it in until the color is even.' },
        {
          text: 'Pinch off small pieces and roll them between your palms into balls the size of a marble, about the width of your thumbnail. Line them up on the floured tray.',
          tip: 'Small balls cook through better and are safer to eat than big ones.',
        },
        {
          text: 'A grown-up cuts three thin coins of ginger, puts them in the small saucepan with the syrup water and brown sugar, and simmers it on the stove until it smells gingery.',
          adult: true,
          hazards: ['sharp', 'heat', 'hot-liquid'],
          timerMinutes: 5,
        },
        {
          text: 'A grown-up fills the large saucepan with water and brings it to a boil, then lowers the balls in a few at a time and stirs once so they do not stick to the bottom.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
        },
        {
          text: 'Cook until every ball floats to the top, then one minute more. Floating means they are done.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 4,
        },
        {
          text: 'A grown-up lifts the balls out with the slotted spoon into the four bowls and ladles the warm ginger syrup over them.',
          adult: true,
          hazards: ['hot-liquid'],
        },
        {
          text: 'Taste test! Let the bowls cool until the syrup is just warm, then count the little moons in your bowl before you eat them.',
          timerMinutes: 3,
        },
      ],
      tip: 'Tangyuan sound like the words for "reunion" in Chinese, which is why families eat them when everyone is together. The ones in shops are often filled with sweet black-sesame or peanut paste; these plain ones are the simplest kind.',
    },
  ],

  crafts: [
    {
      id: 'paper-moon-lantern',
      title: 'Paper Moon Lantern',
      emoji: '🏮',
      blurb: 'Fold, snip and roll one sheet of paper into a round lantern with a glowing battery light inside, then carry it on a moon walk after dark.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Colored paper or thin card', qty: '1 sheet, letter or A4 size', substitute: 'white paper you color yourself' },
        { item: 'Safety scissors' },
        { item: 'Ruler' },
        { item: 'Pencil' },
        { item: 'Tape or a glue stick' },
        { item: 'Markers or crayons' },
        { item: 'Battery tea light', qty: '1' },
        { item: 'Extra strip of paper for the handle', qty: '1 inch / 2.5 cm wide' },
        { item: 'Star stickers or foil shapes', optional: true },
      ],
      steps: [
        { text: 'Decorate one side of the sheet with moons, stars, rabbits and anything else you might see in the night sky. This side will face out.' },
        { text: 'Fold the sheet in half the long way, decorated side out, and press the fold flat.' },
        { text: 'With the ruler and pencil, draw a line 1 inch (2.5 cm) from the open edge. This is your stop line: never cut past it.' },
        {
          text: 'Starting from the folded edge, cut straight slits up to the stop line, about 1 inch (2.5 cm) apart, all the way along.',
          hazards: ['sharp'],
          kidSafeOverride: 'Safety scissors on paper; a grown-up cuts for younger children.',
          tip: 'Count your slits as you go. About 10 is perfect.',
        },
        { text: 'Unfold the sheet. Bring the two short edges together to make a tube, decorated side out, and tape them.' },
        { text: 'Gently push the top and bottom of the tube toward each other so the slits bow outwards into a round lantern belly.' },
        {
          text: 'Cut the extra strip for a handle and tape it across the top.',
          hazards: ['sharp'],
          kidSafeOverride: 'Safety scissors on a paper strip.',
        },
        {
          text: 'Switch on the battery tea light, set it on a saucer and stand the lantern over it, or hold your lantern high by its handle and go on a moon walk. Never put a real candle inside a paper lantern.',
          kidSafeOverride: 'The word candle appears only as a warning; this craft uses a battery tea light.',
        },
      ],
      learn: 'On festival night, parks in Hong Kong, Singapore and Taiwan fill with glowing lanterns, and in Vietnam children parade through the streets with five-pointed star lanterns. A lantern is a little moon you can carry.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'Moonlight is really sunlight bouncing off the moon, and it reaches your eyes in about 1.3 seconds. That is the light families gather to enjoy on Mid-Autumn night.' },
    { sleeps: 11, kind: 'joke', text: 'Why did the moon say no to a second mooncake? Because it was already full!' },
    { sleeps: 10, kind: 'craft', text: 'Press patterns into a ball of play dough with a fork or a bottle cap to make your own pretend mooncake.' },
    { sleeps: 9, kind: 'say', text: 'Learn to say happy Mid-Autumn Festival in Vietnamese, for Tết Trung Thu!', greeting: 2 },
    { sleeps: 8, kind: 'fact', text: 'Sweet-smelling osmanthus flowers bloom around the festival. A legend says a man named Wu Gang lives on the moon, chopping an osmanthus tree that grows back every time he cuts it.' },
    { sleeps: 7, kind: 'color', text: 'Color in the Mid-Autumn page! Make the night sky deep and dark so everything bright really glows.' },
    { sleeps: 6, kind: 'joke', text: 'Why do lanterns make the best friends? Because they always light up when they see you!' },
    { sleeps: 5, kind: 'fact', text: 'In Taiwan, many families share pomelos, big sweet citrus fruits, at Mid-Autumn. Children sometimes wear the peel on their heads as a funny hat for good luck.' },
    { sleeps: 4, kind: 'craft', text: 'Draw the jade rabbit on a paper plate and hang it in your window to be your very own full moon.' },
    { sleeps: 3, kind: 'seek', text: 'Some sneaky things are hiding in the Mid-Autumn picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 2, kind: 'fact', text: 'A legend says that long ago, secret notes were hidden inside mooncakes and passed from family to family, so everyone knew to act together on the night of the full moon.' },
    { sleeps: 1, kind: 'say', text: 'Tonight the moon is almost full, and tomorrow is the Mid-Autumn Festival! Learn to say happy Mid-Autumn Festival in Mandarin.', greeting: 0 },
  ],

  parentNote:
    'The Mid-Autumn Festival is the fifteenth day of the eighth month of the Chinese lunisolar calendar, the night of the full moon, so it lands between early September and early October. It is a public holiday in mainland China, Taiwan and Hong Kong (Hong Kong takes the day after), and the same night is Tết Trung Thu in Vietnam and Chuseok in Korea (listed separately in this app, with its own three-day span). Shop-bought mooncakes and tangyuan very often contain egg, sesame, peanuts or tree nuts; the recipes here avoid them, but check labels. Lanterns sold for the festival sometimes take real candles; the craft here uses a battery tea light only.',
  sources: [
    'Encyclopaedia Britannica, "Mid-Autumn Festival"',
    'Hong Kong Tourism Board, "Tai Hang Fire Dragon Dance"',
    'NASA Science, "Chang\'e 4" (Solar System Exploration mission page)',
    'Encyclopaedia Britannica, "Chuseok"',
  ],
};

export default midAutumnFestival;
