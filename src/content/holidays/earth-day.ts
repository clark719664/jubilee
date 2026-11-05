import type { HolidayContent } from '../types';

const earthDay: HolidayContent = {
  story: [
    'Earth Day on 22 April is a day for looking after the planet we all share: its air, its water, its forests and every creature that lives in them.',
    'The first Earth Day was in 1970, when about 20 million people across the United States joined marches and clean-ups after a senator called Gaylord Nelson asked students to speak up for nature.',
    'Today people in more than 190 countries take part by planting trees, picking up litter and learning how small changes add up.',
    'Many families spend the day outside: a walk, a bug hunt, a bird count or a bag of rubbish collected from the park.',
  ],

  facts: [
    {
      text: 'The first Earth Day, on 22 April 1970, brought out roughly 20 million Americans, about one in ten people in the country at the time, and helped lead to new clean air and clean water laws.',
      bigKids: true,
    },
    {
      text: 'Earth Day went worldwide in 1990, and organisers say around a billion people now take part each year, which makes it one of the biggest shared days on the planet.',
      wow: true,
    },
    {
      text: 'Earth is the only world we know of with liquid water on its surface, and about 71 percent of that surface is ocean.',
    },
    {
      text: 'One big tree can soak up around 22 kilograms of carbon dioxide a year and gives back the oxygen we breathe.',
      wow: true,
    },
    {
      text: 'The famous Blue Marble photo of the whole Earth was taken by Apollo 17 astronauts on 7 December 1972, and it became one of the most widely shared photos ever taken.',
      bigKids: true,
    },
    {
      text: 'Gaylord Nelson chose 22 April because it fell between spring break and final exams, when students would be free to join in.',
    },
  ],

  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de la Tierra!', sayIt: 'feh-LEES DEE-ah deh lah TYEH-rrah', meaning: 'Happy Earth Day!' },
    { lang: 'fr', langName: 'French', text: 'Bonne Journée de la Terre !', sayIt: 'bun zhoor-NAY duh lah TAIR', meaning: 'Happy Earth Day!' },
    { lang: 'sw', langName: 'Swahili', text: 'Heri ya Siku ya Dunia!', sayIt: 'HEH-ree yah SEE-koo yah doo-NEE-ah', meaning: "Happy Earth Day! (literally 'blessings of the day of the Earth')" },
    { lang: 'hi', langName: 'Hindi', text: 'पृथ्वी दिवस की शुभकामनाएँ', roman: 'Prithvi Divas ki shubhkamnayein', sayIt: 'PRITH-vee dih-VAHS kee shoob-KAHM-nah-yen', meaning: 'Best wishes for Earth Day' },
  ],

  recipes: [
    {
      id: 'dirt-cups-with-gummy-worms',
      title: 'Dirt Cups with Gummy Worms',
      emoji: '🪱',
      blurb: 'Chocolate pudding, cookie soil and worms poking out of the top: a garden you can eat.',
      minutes: 25,
      serves: 4,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: ['milk', 'wheat', 'gluten', 'soy'],
      swaps: [
        { avoid: 'milk', use: 'a dairy-free pudding made with oat or soy milk' },
        { avoid: 'wheat', use: 'gluten-free chocolate cookies' },
        { avoid: 'gluten', use: 'gluten-free chocolate cookies' },
        { avoid: 'soy', use: 'check the pudding mix and cookies for soy-free versions' },
      ],
      equipment: ['Mixing bowl', 'Whisk', 'Zip bag', 'Rolling pin', 'Four clear cups', 'Spoon'],
      ingredients: [
        { item: 'Instant chocolate pudding mix', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'one box, about 100 g', allergens: ['milk', 'soy'] },
        { item: 'Milk', us: { qty: 2, unit: 'cup' }, metric: { qty: 480, unit: 'ml' }, note: 'cold', allergens: ['milk'] },
        { item: 'Chocolate sandwich cookies', us: { qty: 12, unit: 'piece' }, metric: { qty: 12, unit: 'piece' }, allergens: ['wheat', 'gluten', 'milk', 'soy'] },
        { item: 'Gummy worms', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' } },
        { item: 'Fresh mint leaves', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' }, note: 'for sprouts', optional: true },
      ],
      steps: [
        { text: 'Pour the cold milk into the bowl, add the pudding mix and whisk for 2 minutes until it thickens.', timerMinutes: 2 },
        { text: 'Put the bowl in the fridge for 5 minutes to set.', timerMinutes: 5 },
        { text: 'Drop the cookies into the zip bag, seal it and bash them with the rolling pin until they look like soil.', tip: 'Leave a few bigger crumbs: real soil has lumps.' },
        { text: 'Spoon pudding into each cup until it is half full.' },
        { text: 'Sprinkle a thick layer of cookie dirt on top.' },
        { text: 'Push two gummy worms into each cup so they poke out of the soil, and add a mint leaf as a sprout.' },
        { text: 'Chill for 10 minutes, or eat straight away if you cannot wait.', timerMinutes: 10 },
        { text: 'Taste test! Dig in with a spoon like a real gardener and see who finds a worm first.' },
      ],
    },
    {
      id: 'rainbow-veggie-wraps',
      title: 'Rainbow Veggie Wraps',
      emoji: '🌈',
      blurb: 'Stripes of red, orange, yellow, green and purple vegetables rolled up tight and cut to show the rainbow inside.',
      minutes: 20,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['wheat', 'gluten', 'milk'],
      swaps: [
        { avoid: 'wheat', use: 'corn tortillas or large lettuce leaves' },
        { avoid: 'gluten', use: 'corn tortillas or large lettuce leaves' },
        { avoid: 'milk', use: 'hummus (it contains sesame) or mashed avocado' },
      ],
      equipment: ['Chopping board', 'Sharp knife (grown-up)', 'Butter knife', 'Plate'],
      ingredients: [
        { item: 'Flour tortillas', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' }, allergens: ['wheat', 'gluten'] },
        { item: 'Cream cheese', us: { qty: 4, unit: 'tbsp' }, metric: { qty: 60, unit: 'g' }, note: 'softened', allergens: ['milk'] },
        { item: 'Red pepper', us: { qty: 0.5, unit: 'piece' }, metric: { qty: 0.5, unit: 'piece' } },
        { item: 'Carrot', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'Yellow pepper', us: { qty: 0.5, unit: 'piece' }, metric: { qty: 0.5, unit: 'piece' } },
        { item: 'Cucumber', us: { qty: 0.5, unit: 'piece' }, metric: { qty: 0.5, unit: 'piece' } },
        { item: 'Spinach leaves', us: { qty: 1, unit: 'cup' }, metric: { qty: 30, unit: 'g' } },
        { item: 'Purple cabbage', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 40, unit: 'g' }, note: 'shredded' },
      ],
      steps: [
        { text: 'Wash all the vegetables and pat them dry.' },
        { text: 'A grown-up cuts the peppers, carrot and cucumber into thin sticks and shreds the cabbage with the sharp knife.', adult: true, hazards: ['sharp'] },
        { text: 'Spread cream cheese over each tortilla with a butter knife, all the way to the edge.', kidSafeOverride: 'Butter knife on a soft tortilla: blunt and kid-safe.' },
        { text: 'Lay the vegetables in rainbow stripes across the middle: red, orange, yellow, green, purple.', tip: 'Keep the stripes thin so the wrap can close.' },
        { text: 'Fold the bottom edge up over the filling, then roll the tortilla up tightly like a sleeping bag.' },
        { text: 'A grown-up cuts each wrap in half so you can see the rainbow inside.', adult: true, hazards: ['sharp'] },
        { text: 'Taste test! Which colour crunches the loudest?' },
      ],
    },
  ],

  crafts: [
    {
      id: 'seed-bombs',
      title: 'Seed Bombs',
      emoji: '🌱',
      blurb: 'Squish clay, compost and wildflower seeds into little balls, then drop them where flowers are allowed to grow.',
      minutes: 30,
      mess: 3,
      adultHelp: 'none',
      hazards: [],
      materials: [
        { item: 'Natural potter’s clay or clay powder mixed with a little water (not air-dry craft clay)', qty: 'a lump the size of your fist' },
        { item: 'Compost or potting soil', qty: '1 cup' },
        { item: 'Wildflower seeds native to where you live', qty: '1 packet', substitute: 'seeds saved from a sunflower or a pepper' },
        { item: 'Water', qty: 'a splash' },
        { item: 'Old newspaper', qty: 'enough to cover the table' },
        { item: 'Tray' },
      ],
      steps: [
        { text: 'Cover the table with old newspaper and roll up your sleeves: this one is muddy.' },
        { text: 'Pinch off a lump of clay about the size of a cherry and flatten it in your palm.' },
        { text: 'Sprinkle a spoonful of compost and a big pinch of seeds onto the clay.', tip: 'Only use seeds that grow naturally where you live, so they do not crowd out local plants.' },
        { text: 'Fold the clay over and squish it all together, adding a drop of water if it cracks.' },
        { text: 'Roll it into a ball the size of a walnut, then make five or six more.' },
        { text: 'Leave the balls on the tray in a sunny spot for two days until they are dry and hard.' },
        { text: 'Drop a seed bomb on a bare patch of earth in your garden or a pot on the balcony, then wait for rain.', tip: 'Ask before planting anywhere that is not yours, and never throw seed bombs into parks or nature reserves.' },
      ],
      learn: 'Clay holds the seeds, compost feeds them and rain does the rest: the whole plant life cycle starts in your hand.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'Charles Darwin studied earthworms on and off for about 40 years. His last book was all about how worms churn up the soil and help plants grow.' },
    { sleeps: 11, kind: 'joke', text: 'What did the tree say when spring finally arrived? What a re-leaf!' },
    { sleeps: 10, kind: 'craft', text: 'Put a leaf under a sheet of paper and rub over it with the side of a crayon: its veins appear like magic. Try leaves from three different trees!' },
    { sleeps: 9, kind: 'fact', text: 'A single teaspoon of healthy soil holds more tiny living things than there are people on Earth.' },
    { sleeps: 8, kind: 'colour', text: 'Colour in the Earth Day page. How many different greens and blues can you use for the land and the sea?' },
    { sleeps: 7, kind: 'fact', text: 'Wangari Maathai from Kenya started the Green Belt Movement, which has planted more than 51 million trees. In 2004 she became the first African woman to win the Nobel Peace Prize.' },
    { sleeps: 6, kind: 'say', text: 'Many people in Kenya, where Wangari Maathai grew up, speak Swahili. Learn to say Happy Earth Day in Swahili!', greeting: 2 },
    { sleeps: 5, kind: 'joke', text: 'What did the big flower say to the little flower? Hi, bud!' },
    { sleeps: 4, kind: 'seek', text: 'Some sneaky surprises are hiding in the Earth Day picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 3, kind: 'fact', text: 'A honeybee makes only about a twelfth of a teaspoon of honey in its whole life, so every jar of honey is the work of hundreds of bees.' },
    { sleeps: 2, kind: 'craft', text: 'Give an empty jar or yogurt pot a second life: wrap it in leftover paper, decorate it and use it to hold your pencils.' },
    { sleeps: 1, kind: 'say', text: "Tomorrow is Earth Day! Choose one thing you'll do for the planet, like a litter pick or a bird count, and learn to say Happy Earth Day in Hindi.", greeting: 3 },
  ],

  parentNote:
    'Earth Day is 22 April everywhere. For the seed bombs, choose a wildflower mix native to your region and plant only where you have permission: spreading seeds into parks, nature reserves or farmland can harm local plants. Wash hands after handling compost.',

  sources: [
    "Encyclopaedia Britannica, 'Earth Day' (first Earth Day 1970, Gaylord Nelson, worldwide from 1990)",
    "US Environmental Protection Agency, 'The origins of EPA' (Earth Day 1970 and the clean air and water laws)",
    "NASA Science, 'Earth: facts' (71 percent ocean; the only known world with liquid surface water)",
    "NASA, 'Apollo 17: the Blue Marble' (7 December 1972)",
    "European Environment Agency, 'Trees help tackle climate change' (a mature tree absorbs about 22 kg of carbon dioxide a year)",
  ],
};

export default earthDay;
