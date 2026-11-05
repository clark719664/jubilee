import type { HolidayContent } from '../types';

const stPatricksDay: HolidayContent = {
  story: [
    "St Patrick's Day, Lá Fhéile Pádraig in Irish, falls on 17 March and celebrates the patron saint of Ireland.",
    'Patrick lived about 1,600 years ago, was carried off to Ireland as a teenager and made to work as a shepherd, escaped, and years later chose to come back as a bishop to teach people about Christianity.',
    'In Ireland the day is a public holiday with parades, music and dancing, and Irish families around the world, from Dublin to Chicago to Sydney, wear green and pin on a shamrock.',
    'The shamrock, a little three-leaf clover, is a famous symbol of Ireland: a story says Patrick held one up to explain how God could be three persons and still one.',
    'You do not have to be Irish to join in: many people simply wear something green, listen to a fiddle tune and say a few words of Irish.',
  ],

  facts: [
    {
      text: 'Patrick was not Irish. He was born in Britain in the late 300s, was kidnapped by raiders at sixteen and spent six years minding sheep in Ireland before he escaped. 17 March is believed to be the day he died, around the year 461.',
      bigKids: true,
    },
    {
      text: 'Almost every year since 1962 the city of Chicago has dyed its river bright green for the day. A boat crew sprinkles in about 40 pounds (18 kg) of orange powder that turns emerald when it hits the water, and the colour lasts for about five hours.',
      wow: true,
    },
    {
      text: 'A legend says Patrick chased every snake out of Ireland. In fact there have never been any wild snakes in Ireland: the island was cut off by the sea after the last Ice Age, before snakes could crawl there from Britain.',
    },
    {
      text: "New York City's St Patrick's Day parade has been held almost every year since 1762, before the United States even existed. It is the biggest in the world, with around 150,000 people marching up Fifth Avenue and no floats or cars allowed, only people on foot.",
    },
    {
      text: "The word shamrock comes from the Irish seamróg, which means 'little clover'. A real shamrock has three leaves. Four-leaf clovers are a separate lucky thing, and rare: only about one clover in every five to ten thousand grows a fourth leaf.",
    },
    {
      text: "For most of the 1900s, St Patrick's Day in Ireland was a quiet church holiday, and for years the pubs were even closed by law. Dublin's big festival of parades, music and fireworks only began in 1996.",
    },
  ],

  greetings: [
    {
      lang: 'ga',
      langName: 'Irish',
      text: 'Lá Fhéile Pádraig sona duit!',
      sayIt: 'law AY-luh PAW-drig SUN-uh ditch',
      meaning: "Happy St Patrick's Day to you (literally 'a happy feast day of Patrick to you')",
    },
    {
      lang: 'ga',
      langName: 'Irish',
      text: 'Beannachtaí na Féile Pádraig oraibh!',
      sayIt: 'BAN-ukh-tee nuh FAY-luh PAW-drig OR-iv',
      meaning: "St Patrick's Day blessings on you all",
    },
    {
      lang: 'ga',
      langName: 'Irish',
      text: 'Éirinn go Brách!',
      sayIt: 'AIR-in guh BRAWKH',
      meaning: 'Ireland forever',
    },
    {
      lang: 'en',
      langName: 'English',
      text: "Happy St Patrick's Day!",
      sayIt: 'HAP-ee saint PAT-riks day',
      meaning: "Happy St Patrick's Day",
    },
  ],

  recipes: [
    {
      id: 'rainbow-fruit-and-cloud-dip',
      title: 'Rainbow Fruit & Cloud Dip',
      emoji: '🌈',
      blurb: 'A rainbow of fruit curving across a platter, with a fluffy white cloud of vanilla cream at the end instead of a pot of gold. No cooking, just arranging.',
      minutes: 25,
      serves: 6,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['milk'],
      swaps: [{ avoid: 'milk', use: 'coconut yogurt and the thick cream from the top of a chilled can of coconut milk' }],
      equipment: ['Large platter', 'Mixing bowl', 'Whisk', 'Small bowl for the cloud', 'Colander'],
      ingredients: [
        { item: 'Strawberries', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' }, note: 'red' },
        { item: 'Mandarins or clementines', us: { qty: 3, unit: 'piece' }, metric: { qty: 3, unit: 'piece' }, note: 'orange' },
        { item: 'Pineapple chunks', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' }, note: 'yellow; fresh, or canned in juice and drained' },
        { item: 'Kiwis', us: { qty: 3, unit: 'piece' }, metric: { qty: 3, unit: 'piece' }, note: 'green' },
        { item: 'Blueberries', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' }, note: 'blue' },
        { item: 'Blackberries', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' }, note: 'purple' },
        { item: 'Heavy (double) cream', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' }, note: 'cold from the fridge', allergens: ['milk'] },
        { item: 'Greek yogurt', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'g' }, allergens: ['milk'] },
        { item: 'Honey or maple syrup', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'ml' }, note: 'no honey for babies under 1' },
        { item: 'Vanilla extract', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 0.5, unit: 'tsp' } },
      ],
      steps: [
        { text: 'Rinse all the berries and the kiwis in the colander and shake them dry.' },
        {
          text: 'A grown-up cuts the strawberries in half and the kiwis and pineapple into bite-sized chunks.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Peel the mandarins with your fingers and pull them apart into segments.',
          kidSafeOverride: 'Peeling a mandarin by hand.',
        },
        {
          text: 'Pour the cold cream into the mixing bowl and whisk it until it is thick and holds soft, floppy peaks. Take turns: it is an arm workout.',
          timerMinutes: 4,
          tip: 'Lift the whisk out. If the cream flops over like a little hill, it is ready.',
        },
        { text: 'Gently fold in the yogurt, honey and vanilla with a spoon until it looks like one fluffy white cloud. Spoon it into the small bowl.' },
        { text: 'Put the cloud bowl at one end of the platter.' },
        {
          text: 'Starting at the cloud, lay the fruit in curved stripes like a rainbow: strawberries on the outside, then mandarin, pineapple, kiwi, blueberries and blackberries on the inside.',
          tip: 'Say the colours as you go: red, orange, yellow, green, blue, purple.',
        },
        { text: 'Taste test! Dip a strawberry in the cloud, then eat your way along the rainbow in colour order.' },
      ],
      tip: 'No fresh pineapple? Yellow melon or chunks of mango make a good yellow stripe. Build the rainbow just before serving so the kiwi stays bright.',
    },
    {
      id: 'irish-soda-bread-mini-loaves',
      title: 'Irish Soda Bread Mini Loaves',
      emoji: '🍞',
      blurb: 'Real Irish bread with no yeast and no waiting: four ingredients, a quick mix, and eight little loaves each with a cross cut in the top. Best eaten warm with butter.',
      minutes: 50,
      serves: 8,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'milk'],
      swaps: [
        { avoid: 'wheat', use: 'a gluten-free flour blend made for bread' },
        { avoid: 'gluten', use: 'a gluten-free flour blend made for bread' },
        { avoid: 'milk', use: 'oat or soy milk with 1 tablespoon of lemon juice stirred in, left for 5 minutes' },
      ],
      equipment: ['Baking tray', 'Baking parchment', 'Large mixing bowl', 'Measuring jug', 'Fork', 'Small sharp knife (grown-up)', 'Wire rack'],
      ingredients: [
        { item: 'All-purpose (plain) flour', us: { qty: 4, unit: 'cup' }, metric: { qty: 500, unit: 'g' }, note: 'plus a little extra for your hands', allergens: ['wheat', 'gluten'] },
        { item: 'Baking soda', us: { qty: 1, unit: 'tsp' }, metric: { qty: 1, unit: 'tsp' }, note: 'also called bicarbonate of soda' },
        { item: 'Salt', us: { qty: 1, unit: 'tsp' }, metric: { qty: 1, unit: 'tsp' } },
        { item: 'Sugar', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' }, optional: true },
        { item: 'Buttermilk', us: { qty: 1.75, unit: 'cup' }, metric: { qty: 420, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Raisins', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' }, note: 'for a sweet "spotted dog" loaf', optional: true },
        { item: 'Butter', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'to serve', optional: true, allergens: ['milk'] },
      ],
      steps: [
        {
          text: 'A grown-up heats the oven to 425°F / 220°C. Line the baking tray with parchment.',
          adult: true,
          hazards: ['heat'],
        },
        { text: 'Put the flour, baking soda, salt and sugar in the big bowl and stir them together. Make a hole in the middle like a volcano crater.' },
        {
          text: 'Pour the buttermilk into the crater and mix with the fork, then with one hand, just until it comes together into a soft, shaggy dough. Stop as soon as there is no dry flour left.',
          tip: 'Soda bread hates being over-mixed. Lumpy and rough is right. No buttermilk? Stir 1.5 tablespoons of lemon juice into 1.75 cups (420 ml) of milk and wait 5 minutes.',
        },
        { text: 'If you want spotted dog, squish the raisins into the dough now.' },
        {
          text: 'Flour your hands, tip the dough onto a floured counter and pat it into a fat log. Pull it into 8 equal pieces, roll each into a ball and press it a little flat. Space them out on the tray.',
        },
        {
          text: "A grown-up cuts a deep cross into the top of each loaf with the knife. An old Irish saying says it lets the fairies out; it also helps the middle cook through.",
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Bake until the loaves are golden and sound hollow when a grown-up taps the bottom, about 20 to 22 minutes.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 22,
        },
        {
          text: 'A grown-up lifts the loaves onto the wire rack. Let them cool a little; the insides are steaming hot.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 10,
        },
        { text: 'Taste test! Pull a loaf open while it is still warm and spread on butter and jam.' },
      ],
      tip: 'Soda bread rises because the baking soda fizzes when it meets the sour buttermilk, so get the loaves into the oven quickly once they are mixed. They are best the day they are baked.',
    },
  ],

  crafts: [
    {
      id: 'shamrock-potato-stamp-prints',
      title: 'Shamrock Potato-Stamp Prints',
      emoji: '☘️',
      blurb: 'A grown-up carves one heart shape into half a potato; you stamp it three times in a circle, and a shamrock appears. Print cards, bunting or wrapping paper.',
      minutes: 40,
      mess: 2,
      adultHelp: 'needed',
      hazards: ['sharp'],
      materials: [
        { item: 'Large potato', qty: '1' },
        { item: 'Small sharp knife', qty: 'grown-up only' },
        { item: 'Small heart cookie cutter', optional: true, substitute: 'draw the heart on with a marker instead' },
        { item: 'Green paint', qty: 'poster or acrylic' },
        { item: 'Paper plate, for the paint' },
        { item: 'Paper, card or a plain cotton bag to print on' },
        { item: 'Paper towels' },
        { item: 'Cotton bud or thin paintbrush, for stems' },
        { item: 'Old newspaper and an apron' },
      ],
      steps: [
        {
          text: 'A grown-up cuts the potato in half across the middle so you have two flat round faces.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Make a heart on one cut face: press the heart cookie cutter into the potato about half an inch (1 cm) deep, or draw a heart on with a marker.',
          tip: 'A heart that fills most of the face makes a big, bold shamrock.',
        },
        {
          text: 'A grown-up cuts away the potato around the heart so the heart stands up like a stamp.',
          adult: true,
          hazards: ['sharp'],
        },
        { text: 'Pat the stamp dry with a paper towel. A dry stamp holds paint; a wet one slides.' },
        { text: 'Pour a puddle of green paint onto the plate. Press the stamp into it, then dab it once on newspaper to get rid of the extra.' },
        {
          text: 'Stamp a heart with its point in the middle of your paper. Turn the stamp and print two more hearts so all three points meet. That is a shamrock!',
          tip: 'Think of a clock: stamp at 12, then 4, then 8.',
        },
        { text: 'Dip the cotton bud in paint and draw a short stem down from where the points meet.' },
        { text: 'Cover a card, a strip of bunting or a whole sheet of wrapping paper with shamrocks, then leave your prints to dry.', timerMinutes: 30 },
      ],
      learn: 'Potatoes arrived in Ireland from South America in the 1500s and became the food most families ate every day. A real shamrock has three leaves; if your three hearts make a shamrock, try four hearts for a lucky four-leaf clover.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: "St Patrick's colour was once blue, not green. A sky-blue shade is still called St Patrick's blue, and the flag of the President of Ireland is blue with a golden harp." },
    { sleeps: 11, kind: 'joke', text: "Knock knock! Who's there? Irish. Irish who? Irish you a happy St Patrick's Day!" },
    { sleeps: 10, kind: 'craft', text: 'Dip your thumb in green paint and press three prints in a little triangle to make a shamrock, then draw on a stalk.' },
    { sleeps: 9, kind: 'say', text: "Learn to cheer 'Ireland forever' in Irish!", greeting: 2 },
    { sleeps: 8, kind: 'fact', text: "Ireland's official national emblem is not the shamrock but the harp. You can find it on Irish euro coins and on the cover of every Irish passport." },
    { sleeps: 7, kind: 'colour', text: "Colour in the St Patrick's Day page! See how many different greens you can use, from leafy green to bright emerald." },
    { sleeps: 6, kind: 'fact', text: "On the Caribbean island of Montserrat, nicknamed the Emerald Isle of the Caribbean, St Patrick's Day is a public holiday too. It also honours enslaved people there who planned a brave rising for freedom on 17 March 1768." },
    { sleeps: 5, kind: 'joke', text: 'What did the shamrock say to its friend? Come clover here!' },
    { sleeps: 4, kind: 'craft', text: 'Draw a rainbow in big arcs of colour, then glue a fluffy cotton-wool cloud at each end.' },
    { sleeps: 3, kind: 'seek', text: "Some sneaky things are hiding in the St Patrick's Day picture. Can you find every single one? Open Seek & Find!" },
    { sleeps: 2, kind: 'fact', text: 'In Irish step dancing, dancers keep their arms straight and still by their sides while their feet tap and leap super fast. Can you try it?' },
    { sleeps: 1, kind: 'say', text: "Tomorrow is St Patrick's Day! Find something green to wear and learn to say happy St Patrick's Day in Irish.", greeting: 0 },
  ],

  parentNote:
    "St Patrick's Day is always 17 March. It is a public holiday in Ireland and Northern Ireland (when it falls on a weekend, the Republic of Ireland takes the following Monday off), and a normal working day in the US, the rest of the UK and most other places, where parades often move to the nearest weekend. The cloud dip uses honey (none for babies under 1). The potato-stamp craft needs a grown-up with a sharp knife, and green paint stains clothes, so wear an apron.",
  sources: [
    'Encyclopaedia Britannica, "St. Patrick"',
    'Encyclopaedia Britannica, "St. Patrick\'s Day"',
    'Library of Congress, "Today in History: March 17"',
    'Citizens Information (Ireland), "Public holidays"',
    'Chicago Journeymen Plumbers Local 130, "The Chicago River Dyeing"',
    'NYC St. Patrick\'s Day Parade, "Parade history"',
  ],
};

export default stPatricksDay;
