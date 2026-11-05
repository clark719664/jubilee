import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Kwanzaa is a seven-day celebration of African American family, community and culture, from 26 December to 1 January.',
    "It was created in 1966 by Dr. Maulana Karenga, a professor in California, and its name comes from the Swahili phrase 'matunda ya kwanza', which means 'first fruits'.",
    'Each evening, families light one more candle on a holder called a kinara and talk about one of seven principles, like unity, creativity and faith.',
    'On 31 December many families share a big feast called the Karamu, with music, stories and dancing.',
    'Kwanzaa is not a religious holiday, so many families celebrate it alongside Christmas or other holidays.',
  ],
  facts: [
    {
      text: 'The seven principles, called the Nguzo Saba, are Umoja (unity), Kujichagulia (self-determination), Ujima (working together and helping each other), Ujamaa (supporting each other’s shops and businesses), Nia (purpose), Kuumba (creativity) and Imani (faith). Each day of Kwanzaa belongs to one of them.',
    },
    {
      text: 'The kinara holds seven candles: one black in the middle, three red on the left and three green on the right. Black stands for the people, red for their struggles, and green for the future and for hope. The black candle is always lit first.',
    },
    {
      text: "Seven is Kwanzaa's number: seven days, seven principles, seven candles, seven symbols, and even seven letters. The Swahili word 'kwanza' has only six, so an extra 'a' was added to the holiday's name to make seven.",
      wow: true,
    },
    {
      text: 'The first Kwanzaa was celebrated in 1966. In 1997 the United States Postal Service issued its first Kwanzaa stamp, with artwork by the painter Synthia Saint James, and new Kwanzaa stamps have come out many times since.',
      bigKids: true,
    },
    {
      text: 'Seven symbols are set out on a straw mat called the mkeka: fruits and vegetables (mazao), ears of corn (muhindi, one for each child in the family), the kinara, the seven candles, a unity cup (kikombe cha umoja) and gifts (zawadi), which are often books or things made by hand.',
    },
    {
      text: "Each day, people greet each other with 'Habari Gani?', which means 'What's the news?' in Swahili. The answer is the principle of the day, so on the first day you reply 'Umoja!'",
    },
  ],
  greetings: [
    {
      lang: 'sw',
      langName: 'Swahili',
      text: 'Habari Gani?',
      sayIt: 'hah-BAH-ree GAH-nee',
      meaning: "What's the news? (the answer is the day's principle, such as 'Umoja!')",
    },
    {
      lang: 'sw',
      langName: 'Swahili',
      text: 'Heri za Kwanzaa',
      sayIt: 'HEH-ree zah KWAHN-zah',
      meaning: "Happy Kwanzaa (literally 'blessings of Kwanzaa')",
    },
    {
      lang: 'sw',
      langName: 'Swahili',
      text: 'Harambee!',
      sayIt: 'hah-rahm-BAY',
      meaning: "Let's all pull together (often shouted seven times at the end of a Kwanzaa gathering)",
    },
  ],
  recipes: [
    {
      id: 'fruit-kinara-plate',
      title: 'Fruit Kinara Plate',
      emoji: '🍎',
      blurb: 'Build a kinara you can eat: a banana base, apple-stick candles in red and green, a tall blackberry candle in the middle and clementine flames on top.',
      minutes: 15,
      serves: 2,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: [],
      equipment: ['large plate', 'small bowl', 'pastry brush or teaspoon', 'chopping board'],
      ingredients: [
        { item: 'banana', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'ripe but still firm' },
        { item: 'red apple', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'green apple', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'blackberries', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 70, unit: 'g' }, note: 'about 10' },
        { item: 'clementine', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'lemon juice', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'keeps the apple bright' },
      ],
      steps: [
        { text: 'Wash the apples, blackberries and clementine and pat them dry with a clean towel.' },
        {
          text: 'A grown-up cuts each apple into three thick sticks about as long as your finger, then brushes the cut sides with lemon juice so they stay bright.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Peel the banana and lay it flat across the bottom of the plate. This is your kinara, the holder the candles stand in.',
          kidSafeOverride: 'peeling a banana by hand; the candles are fruit, not real candles',
        },
        {
          text: 'Stand the three red apple sticks on the left side of the banana and the three green ones on the right, leaving a gap in the middle. Those are the red and green candles.',
          kidSafeOverride: 'the candles are apple sticks, not real candles',
        },
        {
          text: 'Stack blackberries in a line in the middle gap to make the tall black candle.',
          kidSafeOverride: 'the candle is a stack of blackberries, not a real candle',
        },
        {
          text: 'Peel the clementine, pull it into segments and perch one on top of each candle as its flame.',
          kidSafeOverride: 'peeling a clementine by hand; the flames are fruit, not real candles',
          tip: 'For little ones, squash the blackberries flat and cut clementine segments in half.',
        },
        {
          text: 'Count the candles out loud: one black, three red, three green. Can you say a principle for each one? Umoja, Kujichagulia, Ujima, Ujamaa, Nia, Kuumba, Imani.',
          kidSafeOverride: 'counting fruit candles, not real candles',
        },
        {
          text: 'Taste test! Eat one candle a day like a real kinara, or share the whole plate right now.',
          kidSafeOverride: 'the candles are fruit, not real candles',
        },
      ],
      tip: 'The black candle is always lit first at Kwanzaa, so eat the blackberries first if you want to do it in order.',
    },
    {
      id: 'sweet-potato-pie-cups',
      title: 'Sweet Potato Pie Cups',
      emoji: '🥧',
      blurb: 'Little sweet potato pies in a muffin pan, soft and spiced with cinnamon and nutmeg: a favorite at many Karamu feast tables.',
      minutes: 60,
      serves: 12,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['milk', 'egg', 'wheat', 'gluten'],
      mayContain: ['soy'],
      swaps: [
        { avoid: 'gluten', use: 'a ready-rolled gluten-free pie crust' },
        { avoid: 'wheat', use: 'a ready-rolled gluten-free pie crust' },
        { avoid: 'milk', use: 'canned coconut milk and a dairy-free spread' },
      ],
      equipment: ['12-cup muffin pan', 'mixing bowl', 'fork or potato masher', 'whisk', 'measuring cups and spoons', 'a wide cup or round cutter', 'oven mitts'],
      ingredients: [
        { item: 'sweet potato', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'large, about 12 oz / 350 g' },
        { item: 'ready-rolled pie crust', us: { qty: 2, unit: 'sheet' }, metric: { qty: 2, unit: 'sheet' }, note: 'about 8 oz / 225 g each, from the fridge', allergens: ['wheat', 'gluten'] },
        { item: 'light brown sugar', us: { qty: 0.33, unit: 'cup' }, metric: { qty: 65, unit: 'g' } },
        { item: 'egg', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, allergens: ['egg'] },
        { item: 'evaporated milk or whole milk', us: { qty: 0.33, unit: 'cup' }, metric: { qty: 80, unit: 'ml' }, allergens: ['milk'] },
        { item: 'butter', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'melted', allergens: ['milk'] },
        { item: 'ground cinnamon', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 0.5, unit: 'tsp' } },
        { item: 'ground nutmeg', us: { qty: 0.25, unit: 'tsp' }, metric: { qty: 0.25, unit: 'tsp' } },
        { item: 'vanilla extract', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' } },
        { item: 'salt', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' } },
        { item: 'whipped cream', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' }, note: 'for serving', optional: true, allergens: ['milk'] },
      ],
      steps: [
        {
          text: 'Scrub the sweet potato. A grown-up pricks it all over with a fork and cooks it in the microwave on high until it is soft all the way through.',
          adult: true,
          hazards: ['electric', 'heat'],
          timerMinutes: 8,
        },
        {
          text: 'Let it cool a little, then a grown-up splits the skin and scoops the orange inside into the bowl. Mash it smooth with a fork and keep 1 cup (240 g).',
          adult: true,
          hazards: ['heat', 'sharp'],
        },
        { text: 'Heat the oven to 350°F / 180°C and lightly grease the muffin pan.', adult: true, hazards: ['heat'] },
        {
          text: 'Add the brown sugar, egg, milk, melted butter, cinnamon, nutmeg, vanilla and salt to the mashed sweet potato and whisk until smooth.',
          hazards: ['raw-egg'],
          tip: 'Wash your hands after touching raw egg, and no licking the whisk yet.',
        },
        {
          text: 'Unroll the pie crusts and press out 12 circles with the cup (about 3½ inches / 9 cm across). Lay one in each muffin cup and push it gently up the sides.',
          tip: 'Squash the leftover scraps together and roll them flat for the last circles.',
        },
        { text: 'Spoon the filling into the pastry cups until each one is nearly full.' },
        {
          text: 'Bake until the filling is set and only wobbles a tiny bit in the middle.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 22,
        },
        {
          text: 'Leave the cups in the tin until cool, then loosen each one with a butter knife and lift it out.',
          timerMinutes: 15,
          kidSafeOverride: 'a butter knife around the edge of a cooled pie cup',
        },
        { text: 'Taste test! Top with a swirl of whipped cream and save a few for the Karamu feast on 31 December.' },
      ],
      tip: 'No microwave? A grown-up can bake the whole sweet potato in the oven at 400°F / 200°C for about 45 minutes instead.',
    },
  ],
  crafts: [
    {
      id: 'cardboard-kinara',
      title: 'Cardboard Kinara',
      emoji: '🕯️',
      blurb: 'Seven painted cardboard tubes on a sturdy base, lit with battery tea lights: one more glows every night of Kwanzaa.',
      minutes: 60,
      mess: 2,
      adultHelp: 'some',
      hazards: ['sharp', 'small-parts'],
      materials: [
        { item: 'cardboard tubes (toilet-roll size)', qty: '7' },
        { item: 'shoebox lid or a strip of thick cardboard', qty: '1', substitute: 'a cereal box cut open and folded double' },
        { item: 'strong scissors or a craft knife (grown-up only)' },
        { item: 'paint in red, green and black', substitute: 'colored paper wrapped around the tubes' },
        { item: 'paintbrush' },
        { item: 'white glue or strong tape' },
        { item: 'battery tea lights', qty: '7' },
        { item: 'strips of colored paper for the mkeka mat', optional: true },
      ],
      steps: [
        { text: 'Paint three tubes red, three tubes green and one tube black. Red and green are for struggle and hope; black is for the people.' },
        { text: 'Let the paint dry completely.', timerMinutes: 30 },
        {
          text: 'A grown-up cuts the shoebox lid or cardboard into a base about 16 inches / 40 cm long and 4 inches / 10 cm wide.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Glue the tubes standing up in a row on the base in this order: red, red, red, black, green, green, green. Hold each one still while you count to ten.',
          tip: 'Put the black tube in the exact middle so it has three friends on each side.',
        },
        { text: 'Weave strips of colored paper over and under each other and glue them to the base to make a mkeka, the mat that Kwanzaa symbols rest on.' },
        {
          text: 'Stuff a ball of scrunched paper into each tube so a battery tea light sits right at the top, then rest one light on each tube. Tiny button batteries live inside, so a grown-up checks that every battery door is shut tight.',
          adult: true,
          hazards: ['small-parts'],
        },
        {
          text: 'On the first night, switch on the black light in the middle. Each night after that, switch on one more, starting with the ones next to the black candle: the nearest red one, then the nearest green one, then the next red, and so on outward, until all seven glow on 1 January.',
          kidSafeOverride: 'switching on battery tea lights, not real candles',
        },
      ],
      learn: 'Lighting from the black candle outward tells a story in order: first the people, then their struggle, then their hope for the future. Real kinaras hold real candles, but battery lights are the safe way for kids to join in.',
    },
  ],
  doors: [
    { sleeps: 12, kind: 'fact', text: "Kwanzaa's colors, red, black and green, are the colors of the Pan-African flag, adopted in 1920 by a group led by Marcus Garvey as a flag for people of African descent everywhere." },
    { sleeps: 11, kind: 'joke', text: 'Why did the ear of corn sit at the front of the Kwanzaa table? It wanted to be all ears for the stories!' },
    { sleeps: 10, kind: 'craft', text: 'Weave strips of red, black and green paper over and under each other to make your own little mkeka mat.' },
    { sleeps: 9, kind: 'say', text: 'Learn to say happy Kwanzaa in Swahili!', greeting: 1 },
    { sleeps: 8, kind: 'fact', text: 'Kwanzaa is modelled on first-fruits harvest festivals held across Africa, such as Umkhosi among the Zulu people of southern Africa, where people give thanks for the new crops.' },
    { sleeps: 7, kind: 'color', text: 'Color in the Kwanzaa page! Start with red, black and green, then add every bright color you love.' },
    { sleeps: 6, kind: 'joke', text: 'Why is the number seven so tired after Kwanzaa? Seven days, seven candles, seven principles: it never gets a night off!' },
    { sleeps: 5, kind: 'fact', text: 'Many families wear kente cloth at Kwanzaa. Kente comes from Ghana and is woven in narrow strips, only about 10 cm (4 inches) wide, which are sewn side by side to make one big cloth.' },
    { sleeps: 4, kind: 'craft', text: 'Fold a piece of paper into a card and write one kind thing you will do for your family during Kwanzaa. That is a homemade zawadi, a gift!' },
    { sleeps: 3, kind: 'seek', text: 'Some sneaky things are hiding in the Kwanzaa picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 2, kind: 'fact', text: 'Kwanzaa gifts, called zawadi, are traditionally given on the last day, 1 January. The founder of Kwanzaa said they should include a book and a heritage symbol that celebrates African history and culture.' },
    { sleeps: 1, kind: 'say', text: "Tomorrow the first Kwanzaa candle is lit! Practise the question everyone asks each day, and get ready to answer 'Umoja!'", greeting: 0 },
  ],
  parentNote:
    'Kwanzaa runs on fixed dates, 26 December to 1 January, and each day has its own principle (shown in the day names above). It is a cultural celebration, not a religious one, so families of any faith take part, often alongside Christmas. The Karamu feast is traditionally held on 31 December. The kinara craft here uses battery tea lights only; the app never suggests real candles for children.',
  sources: [
    'Maulana Karenga, Kwanzaa: A Celebration of Family, Community and Culture (University of Sankore Press, 1998), "The Seven Principles (Nguzo Saba)" and "The Symbols of Kwanzaa"',
    'Smithsonian National Museum of African American History and Culture, "The Seven Principles of Kwanzaa"',
    'Library of Congress Research Guides, "Kwanzaa"',
    'United States Postal Service, "Kwanzaa" commemorative stamp, first issued 22 October 1997',
  ],
};

export default content;
