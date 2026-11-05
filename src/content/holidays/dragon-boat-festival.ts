import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'The Dragon Boat Festival, called Duanwu in Chinese, falls on the fifth day of the fifth month of the lunar calendar.',
    'Teams of paddlers race long boats with painted dragon heads while a drummer at the front beats out the rhythm.',
    'Families eat zongzi, sticky rice parcels wrapped in bamboo leaves, and remember Qu Yuan, a poet who lived more than 2,000 years ago.',
  ],
  facts: [
    {
      text: 'A legend says that when the poet Qu Yuan drowned, villagers paddled out to look for him and threw rice into the river so the fish would eat that instead of him.',
      wow: true,
    },
    {
      text: 'A standard racing dragon boat carries 20 paddlers, one drummer and one steerer, so a whole team is 22 people.',
      bigKids: true,
    },
    {
      text: 'Zongzi come in many flavors: sweet ones with red beans or dates, and savoury ones with pork, salted egg yolk or mushrooms.',
    },
  ],
  greetings: [
    {
      lang: 'zh-Hans',
      langName: 'Mandarin Chinese',
      text: '端午安康',
      roman: 'Duanwu ankang',
      sayIt: 'dwan-WOO ahn-KAHNG',
      meaning: 'Peace and good health at Duanwu',
    },
    {
      lang: 'zh-Hans',
      langName: 'Mandarin Chinese',
      text: '端午节快乐',
      roman: 'Duanwu jie kuaile',
      sayIt: 'dwan-WOO jyeh kwye-LUH',
      meaning: 'Happy Dragon Boat Festival',
    },
  ],
  recipes: [
    {
      id: 'zongzi-style-rice-cups',
      title: 'Zongzi-Style Rice Cups',
      emoji: '🍙',
      blurb: 'Sticky rice pressed into little leaf-lined cups: all the flavor of zongzi, no wrapping or tying needed.',
      minutes: 80,
      serves: 6,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['soy', 'wheat', 'gluten', 'sesame'],
      swaps: [
        { avoid: 'wheat', use: 'gluten-free tamari instead of soy sauce' },
        { avoid: 'soy', use: 'coconut aminos instead of soy sauce' },
        { avoid: 'sesame', use: 'a little vegetable oil instead of sesame oil' },
      ],
      equipment: ['small saucepan with a lid', 'sieve', 'mixing bowl', 'muffin pan or 6 small cups', 'spoon'],
      ingredients: [
        { item: 'glutinous (sticky) rice', us: { qty: 1, unit: 'cup' }, metric: { qty: 200, unit: 'g' }, note: 'sometimes labeled sweet rice' },
        { item: 'water', us: { qty: 1.25, unit: 'cup' }, metric: { qty: 300, unit: 'ml' } },
        { item: 'soy sauce', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'ml' }, allergens: ['soy', 'wheat', 'gluten'] },
        { item: 'sesame oil', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, allergens: ['sesame'] },
        { item: 'sugar', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'g' } },
        { item: 'cooked peas or corn', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 70, unit: 'g' }, optional: true },
        { item: 'bamboo leaves or large lettuce leaves', us: { qty: 6, unit: 'piece' }, metric: { qty: 6, unit: 'piece' }, note: 'to line the cups; dried bamboo leaves must be soaked in hot water by a grown-up for 30 minutes first, lettuce needs nothing', optional: true },
      ],
      steps: [
        { text: 'Put the rice in a sieve and rinse it under the tap until the water runs clear.' },
        { text: 'Tip the rice into the saucepan, add the water and let it soak.', timerMinutes: 30, tip: 'Soaking makes the rice extra sticky.' },
        { text: 'Put the lid on and bring the pan to a boil on the stove, then turn the heat right down and simmer until the water is gone.', adult: true, hazards: ['heat', 'hot-liquid'], timerMinutes: 15 },
        { text: 'Turn off the heat and leave the lid on so the rice steams.', adult: true, hazards: ['heat'], timerMinutes: 10 },
        { text: 'Spoon the rice into the mixing bowl and let it cool until it is just warm.', adult: true, hazards: ['heat'] },
        { text: 'Stir in the soy sauce, sesame oil, sugar and peas or corn until every grain is glossy.' },
        { text: 'Line each cup with a leaf, then press the rice in firmly with the back of a spoon.' },
        { text: 'Chill the cups in the fridge so they hold their shape.', timerMinutes: 10 },
        { text: 'Taste test! Turn each cup out onto a plate, unwrap the leaf and eat your zongzi with a spoon.' },
      ],
      tip: 'Real zongzi are wrapped in bamboo leaves and boiled for hours. Our cups take the shortcut but keep the sticky, salty-sweet taste.',
    },
  ],
  crafts: [],
  parentNote:
    'The festival follows the Chinese lunar calendar, so the date moves between late May and late June each year. In 2009 the Dragon Boat Festival was added to the UNESCO list of intangible cultural heritage.',
  sources: [
    'UNESCO Intangible Cultural Heritage, "Dragon Boat festival" (2009)',
    'Encyclopaedia Britannica, "Dragon Boat Festival"',
    'International Dragon Boat Federation, "Competition Regulations" (crew of 20 paddlers, drummer and steerer)',
  ],
};

export default content;
