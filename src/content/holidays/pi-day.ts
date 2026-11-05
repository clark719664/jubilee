import type { HolidayContent } from '../types';

const piDay: HolidayContent = {
  story: [
    'Pi Day is a maths party on 14 March, because writing the date the American way, 3/14, gives the first three digits of pi: 3.14.',
    'Pi is the number you get when you measure all the way around a circle and divide by the distance straight across it, and it is the same for every circle in the universe.',
    'Its digits go on for ever without repeating, so people celebrate by reciting as many as they can remember, by eating pie and by hunting for circles.',
    "Many families bake a pie, draw circles with string and a pencil, or sing happy birthday to Albert Einstein, who was born on 14 March 1879.",
  ],

  facts: [
    {
      text: 'Pi never ends and never repeats: computers have worked out more than 100 trillion digits, and there is still no pattern.',
      wow: true,
    },
    {
      text: 'Pi Day started in 1988 at the Exploratorium, a science museum in San Francisco, when a physicist named Larry Shaw led the staff in a parade around a circle and then served fruit pie.',
      bigKids: true,
    },
    {
      text: 'Albert Einstein was born on Pi Day, 14 March 1879, in Ulm, Germany, and the town of Princeton, where he lived later, throws a big Pi Day party every year.',
    },
    {
      text: 'The Greek letter π was first used to mean this number by a Welsh mathematician, William Jones, in 1706, and the famous Leonhard Euler helped make it popular.',
      bigKids: true,
    },
    {
      text: 'You only need about 40 digits of pi to work out the size of the whole known universe to within the width of a single atom.',
      wow: true,
    },
    {
      text: 'In 2009 the United States House of Representatives passed a resolution supporting 14 March as National Pi Day.',
    },
  ],

  greetings: [
    { lang: 'en', langName: 'English', text: 'Happy Pi Day!', sayIt: 'HAP-ee PIE day', meaning: 'Happy Pi Day! (pi sounds like pie, which is the whole joke)' },
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de Pi!', sayIt: 'feh-LEES DEE-ah deh PEE', meaning: "Happy Pi Day! (in Spanish pi is said 'pee', so there is no pie pun)" },
    { lang: 'el', langName: 'Greek', text: 'Χαρούμενη Ημέρα του π!', roman: 'Charoúmeni Iméra tou pi!', sayIt: 'hah-ROO-meh-nee ee-MEH-rah too PEE', meaning: "Happy Pi Day! (π is the sixteenth letter of the Greek alphabet, and Greek speakers say it 'pee')" },
  ],

  recipes: [
    {
      id: 'pudding-pie-cups',
      title: 'Pudding Pie Cups',
      emoji: '🥧',
      blurb: 'A crumbly biscuit crust, creamy vanilla pudding and a swirl of cream, all in a cup and no oven needed.',
      minutes: 20,
      serves: 4,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: ['milk', 'wheat', 'gluten'],
      mayContain: ['soy'],
      swaps: [
        { avoid: 'milk', use: 'a pudding made with oat or soy milk and coconut whipped cream' },
        { avoid: 'wheat', use: 'gluten-free biscuits for the crust' },
        { avoid: 'gluten', use: 'gluten-free biscuits for the crust' },
      ],
      equipment: ['Zip bag', 'Rolling pin', 'Mixing bowl', 'Whisk', 'Four cups or small jars', 'Spoon'],
      ingredients: [
        { item: 'Graham crackers or digestive biscuits', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' }, allergens: ['wheat', 'gluten'] },
        { item: 'Instant vanilla pudding mix', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'one box, about 100 g', allergens: ['milk'] },
        { item: 'Milk', us: { qty: 2, unit: 'cup' }, metric: { qty: 480, unit: 'ml' }, note: 'cold', allergens: ['milk'] },
        { item: 'Whipped cream', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Strawberries', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' } },
        { item: 'Sprinkles', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 10, unit: 'g' }, optional: true },
      ],
      steps: [
        { text: 'Put the crackers in the zip bag, seal it and crush them with the rolling pin until they look like sand.' },
        { text: 'Spoon a layer of crumbs into the bottom of each cup and press it flat with the back of the spoon: that is your crust.' },
        { text: 'Whisk the cold milk and the pudding mix in the bowl for 2 minutes until thick.', timerMinutes: 2 },
        { text: 'Spoon the pudding on top of the crumbs, leaving room at the top.' },
        { text: 'Pile on whipped cream and smooth it into a circle, because pie is all about circles.' },
        { text: 'Pull the green tops off the strawberries and arrange them on top, then add a pinch of sprinkles if you like.' },
        { text: 'Chill in the fridge for 10 minutes while you practise saying 3.14159.', timerMinutes: 10 },
        { text: 'Taste test! Spoon all the way down so you get crust, pudding and cream in one bite.' },
      ],
      tip: 'Cold milk is important: warm milk stops the pudding from setting.',
    },
    {
      id: 'mini-fruit-hand-pies',
      title: 'Mini Fruit Hand Pies',
      emoji: '🫐',
      blurb: 'Little half-moon pies stuffed with berries, crimped with a fork and golden from the oven.',
      minutes: 45,
      serves: 4,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'egg', 'milk'],
      swaps: [
        { avoid: 'wheat', use: 'a gluten-free pastry sheet' },
        { avoid: 'gluten', use: 'a gluten-free pastry sheet' },
        { avoid: 'egg', use: 'brush the pies with milk instead of egg' },
        { avoid: 'milk', use: 'a dairy-free pastry and brush with plant milk' },
      ],
      equipment: ['Baking tray', 'Baking paper', 'Mixing bowl', 'Round cutter or a mug', 'Fork', 'Pastry brush', 'Oven gloves'],
      ingredients: [
        { item: 'Ready-rolled shortcrust pastry', us: { qty: 1, unit: 'sheet' }, metric: { qty: 1, unit: 'sheet' }, note: 'all-butter if you can get it', allergens: ['wheat', 'gluten', 'milk'] },
        { item: 'Mixed berries', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' }, note: 'fresh or frozen' },
        { item: 'Sugar', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 25, unit: 'g' } },
        { item: 'Cornstarch', us: { qty: 1, unit: 'tsp' }, metric: { qty: 3, unit: 'g' } },
        { item: 'Egg', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'for brushing', allergens: ['egg'] },
      ],
      steps: [
        { text: 'A grown-up heats the oven to 200°C (400°F) and lines the baking tray with baking paper.', adult: true, hazards: ['heat'] },
        { text: 'Stir the berries, sugar and cornstarch together in the bowl.' },
        { text: 'Unroll the pastry and press the cutter or the mug into it to make 8 circles.' },
        { text: 'Put a spoonful of berries on one half of each circle, leaving a border, and do not overfill.', tip: 'Less filling means fewer leaks.' },
        { text: 'Fold each circle in half over the fruit, press the edges closed with the fork all the way round, then poke a tiny steam hole in the top.' },
        { text: 'Crack the egg into a cup, beat it with the fork and brush it over the pies.', hazards: ['raw-egg'], tip: 'Wash your hands after touching raw egg.' },
        { text: 'A grown-up puts the tray in the oven, bakes the pies for 18 minutes until golden, then takes them out with oven gloves.', adult: true, hazards: ['heat'], timerMinutes: 18 },
        { text: 'Let the pies cool on the tray for 10 minutes: the fruit inside stays hot for ages.', timerMinutes: 10 },
        { text: 'Taste test! Count the digits of pi out loud before every bite and see how far you get.' },
      ],
      tip: 'The little steam hole lets hot air escape, so the pies puff up without bursting at the seams.',
    },
  ],

  crafts: [
    {
      id: 'pi-paper-chain',
      title: 'Pi Paper Chain',
      emoji: '🔗',
      blurb: 'Give every digit a colour, then link the digits of pi into a chain that can go on as long as you like.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Coloured paper', qty: '10 colours, one for each digit from 0 to 9', substitute: 'white paper coloured in with crayons' },
        { item: 'Scissors', substitute: 'ask a grown-up to pre-cut the strips' },
        { item: 'Glue stick', substitute: 'sticky tape or a stapler' },
        { item: 'The digits of pi', qty: '3.14159265358979323846', substitute: 'as many as you can remember' },
      ],
      steps: [
        { text: 'Pick a colour for every digit from 0 to 9 and write the key on a scrap of paper: 1 is red, 4 is blue, and so on.' },
        { text: 'Use scissors to cut the paper into strips about as long as your hand and two fingers wide.', hazards: ['sharp'] },
        { text: 'Start with the first digit of pi, 3: take a strip in the 3 colour, loop it round and glue the ends together.' },
        { text: 'Thread the next strip, the 1 colour, through the first loop and glue it closed.' },
        { text: 'Keep going: 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9 and onwards for as long as you like.', tip: 'Say each digit out loud as you add its loop and you will remember more than you think.' },
        { text: 'Hang your chain across the room and see if a friend can read the digits back from the colours.' },
      ],
      learn: 'Every colour stands for a digit, so the chain is a secret code: the longer it gets, the more of pi you know by heart.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'More than 2,200 years ago, Archimedes trapped pi between two numbers by drawing shapes with 96 sides inside and outside a circle. He showed it is a little less than 3 and 1/7.' },
    { sleeps: 11, kind: 'joke', text: 'Why should you never start a conversation with pi? Because it goes on and on for ever!' },
    { sleeps: 10, kind: 'craft', text: 'On squared paper, colour a column 3 squares tall, then 1, then 4, then 1, then 5, then 9. Keep going with the digits of pi and you get a city skyline!' },
    { sleeps: 9, kind: 'fact', text: "'How I wish I could calculate pi' is a secret code: count the letters in each word and you get 3, 1, 4, 1, 5, 9, 2, the start of pi!" },
    { sleeps: 8, kind: 'say', text: 'π is a letter of the Greek alphabet. Learn to say Happy Pi Day in Greek!', greeting: 2 },
    { sleeps: 7, kind: 'colour', text: 'Colour in the Pi Day page. Try giving every circle you find its very own colour!' },
    { sleeps: 6, kind: 'fact', text: "Six 9s in a row appear in pi, starting at the 762nd digit after the decimal point. It's called the Feynman point, after the scientist Richard Feynman, who is said to have joked about reciting pi up to there." },
    { sleeps: 5, kind: 'joke', text: "What do you get if you divide the distance around a pumpkin by the distance across it? Pumpkin pi!" },
    { sleeps: 4, kind: 'seek', text: 'Some sneaky surprises are hiding in the Pi Day picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 3, kind: 'fact', text: 'In 1897, lawmakers in Indiana nearly passed a law with a wrong value for pi. A visiting maths professor spotted the mistake, and the law was stopped just in time.' },
    { sleeps: 2, kind: 'craft', text: 'Wrap a piece of string around the edge of a plate, then lay it across the middle. It stretches across just over three times, and it works for every circle!' },
    { sleeps: 1, kind: 'say', text: "Tomorrow is Pi Day! Practise saying it in Spanish, where pi is said 'pee', and see if you can remember 3.14159 before you fall asleep.", greeting: 1 },
  ],

  parentNote:
    'Pi Day only works when the date is written month first (3/14), so it is mostly celebrated in the United States, though many schools elsewhere join in. In countries that write 14/3, some maths fans celebrate Pi Approximation Day on 22 July (22/7) instead.',

  sources: [
    "Exploratorium, 'Pi Day: history of the celebration' (Larry Shaw and the first Pi Day, 1988)",
    "NASA Jet Propulsion Laboratory, 'How many decimals of pi do we really need?' (about 40 digits for the observable universe)",
    "Encyclopaedia Britannica, 'Pi' (William Jones 1706; Euler's use of the symbol)",
    "Encyclopaedia Britannica, 'Albert Einstein' (born 14 March 1879, Ulm)",
    "US House of Representatives, H.Res. 224, 111th Congress, 'Supporting the designation of Pi Day' (2009)",
    "Google Cloud blog, 'Calculating 100 trillion digits of pi on Google Cloud' (2022)",
  ],
};

export default piDay;
