import type { HolidayContent } from '../types';

/**
 * Independence Day (Fourth of July) — tier 1, US only. Fireworks are watched, never handled, by children: the story
 * and the parentNote both say so. Shape follows ../_template.ts.
 */
const independenceDayUs: HolidayContent = {
  story: [
    'Independence Day, or the Fourth of July, is the birthday of the United States.',
    'On 4 July 1776, leaders of the thirteen American colonies approved the Declaration of Independence, which said they would no longer be ruled by the king of Great Britain.',
    'Many families celebrate with parades, flags, picnics and barbecues, and when it gets dark, fireworks light up the sky in red, white and blue.',
    'Fireworks are beautiful but dangerous, so children watch from a safe distance while grown-ups handle them, and even sparklers need a bucket of water close by.',
  ],

  facts: [
    {
      text: 'Congress actually voted for independence on 2 July 1776 and approved the words of the Declaration two days later. John Adams was sure 2 July would be the big holiday, and he was wrong.',
      bigKids: true,
    },
    {
      text: 'Most of the 56 signers did not sign the Declaration on 4 July at all. The famous signatures were added on 2 August 1776.',
      bigKids: true,
    },
    {
      text: 'The flag has 13 stripes for the original colonies and 50 stars for the states. The 50-star design has flown since 1960, after Hawaii became a state.',
    },
    {
      text: 'Americans eat around 150 million hot dogs on the Fourth of July, enough to stretch from Washington, DC to Los Angeles more than five times.',
      wow: true,
    },
    {
      text: 'The very first Fourth of July fireworks went up over Philadelphia in 1777, while the war for independence was still being fought.',
      wow: true,
    },
    {
      text: 'Every 4 July the Liberty Bell in Philadelphia is gently tapped 13 times, once for each original colony. It is never rung properly any more, because it has a big crack.',
    },
  ],

  greetings: [
    { lang: 'en', langName: 'English', text: 'Happy Fourth of July!', sayIt: 'HAP-ee FORTH uv joo-LY', meaning: 'Happy Fourth of July!' },
    { lang: 'en', langName: 'English', text: 'Happy Independence Day!', sayIt: 'HAP-ee in-dee-PEN-dents DAY', meaning: 'Happy Independence Day!' },
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Cuatro de Julio!', sayIt: 'feh-LEES KWAH-troh deh HOO-lyoh', meaning: 'Happy Fourth of July!' },
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de la Independencia!', sayIt: 'feh-LEES DEE-ah deh lah een-deh-pen-DEN-syah', meaning: 'Happy Independence Day!' },
  ],

  recipes: [
    {
      id: 'flag-fruit-platter',
      title: 'Flag Fruit Platter',
      emoji: '🍓',
      blurb: 'Strawberry stripes, banana stripes and a corner of blueberry stars: a flag you are allowed to eat.',
      minutes: 20,
      serves: 6,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: [],
      equipment: ['Large platter or tray', 'Chopping board', 'Sharp knife (grown-up)', 'Small bowl'],
      ingredients: [
        { item: 'Strawberries', us: { qty: 2, unit: 'cup' }, metric: { qty: 300, unit: 'g' } },
        { item: 'Blueberries', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' } },
        { item: 'Bananas', us: { qty: 3, unit: 'piece' }, metric: { qty: 3, unit: 'piece' }, note: 'firm' },
        { item: 'Lemon juice', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'keeps the banana white', optional: true },
      ],
      steps: [
        {
          text: 'A grown-up uses a sharp knife to take the tops off the strawberries, cut them in half and slice the bananas into coins.',
          adult: true,
          hazards: ['sharp'],
        },
        { text: 'Toss the banana coins in the small bowl with the lemon juice so they stay bright white.' },
        { text: 'Pile the blueberries into a neat square in the top-left corner of the platter. That is the blue.' },
        { text: 'Lay a row of strawberry halves along the top edge, from the blueberries to the right-hand side: the first red stripe.' },
        { text: 'Under it, lay a row of banana coins: the first white stripe.' },
        {
          text: 'Keep going, red stripe, white stripe, red stripe, white stripe, until the platter is full.',
          tip: 'The real flag has 13 stripes, 7 red and 6 white. How many fit on yours?',
        },
        { text: 'Taste test! Start with a star, then eat your way down the stripes.' },
      ],
      tip: 'Make it just before serving: banana goes brown even with lemon juice if it waits too long.',
    },
    {
      id: 'sparkler-juice-popsicles',
      title: 'Sparkler Juice Popsicles',
      emoji: '🍧',
      blurb: 'Red, white and blue ice pops on a stick, frozen one layer at a time, that you can wave like a sparkler.',
      minutes: 230,
      serves: 6,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: [],
      equipment: ['6 popsicle molds or small paper cups', '6 wooden popsicle sticks', 'Measuring jug'],
      ingredients: [
        { item: 'Cranberry or cherry juice', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, note: 'the red layer' },
        { item: 'Cloudy lemonade', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, note: 'the white layer; coconut water works too' },
        { item: 'Blueberries', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' }, note: 'the blue layer' },
      ],
      steps: [
        { text: 'Pour the red juice into each mold until it is one-third full, then put the molds in the freezer for 45 minutes until the juice is slushy and firm.', timerMinutes: 45 },
        { text: 'Push a wooden stick into the middle of each one. The slushy layer holds it straight.' },
        { text: 'Pour in the lemonade up to two-thirds full and freeze for another 45 minutes.', timerMinutes: 45 },
        { text: 'Drop a handful of blueberries into each mold, top up with the last of the lemonade and freeze for 2 hours until rock solid.', timerMinutes: 120 },
        {
          text: 'Run the outside of the molds under warm tap water for 10 seconds and pull the pops out by their sticks.',
          tip: 'If a pop is stuck, count to ten under the tap and try again.',
        },
        { text: 'Taste test! Hold your sparkler up high, say happy birthday to the United States, and lick before it drips.' },
      ],
      tip: 'Paper cups work just as well as molds: tear the cup off when the pop is frozen.',
    },
  ],

  crafts: [
    {
      id: 'salad-spinner-fireworks-painting',
      title: 'Salad-Spinner Fireworks Painting',
      emoji: '🎆',
      blurb: 'Blobs of paint plus a salad spinner equals a sky full of fireworks, with no bangs and no burns.',
      minutes: 45,
      mess: 2,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Salad spinner', substitute: 'a clean yoghurt pot with a lid, shaken instead of spun' },
        { item: 'Thin card or paper plates', qty: '6', substitute: 'cereal-box card' },
        { item: 'Washable paint in red, white and blue', substitute: 'any three colors you have' },
        { item: 'Scissors', substitute: 'use small paper plates that already fit the spinner' },
        { item: 'Old newspaper', qty: 'enough to cover the table' },
        { item: 'Black paper and a glue stick', optional: true, substitute: 'a dark crayon to color a night sky' },
      ],
      steps: [
        { text: 'Cover the table with newspaper and roll up your sleeves.' },
        {
          text: 'Use scissors to cut a card circle that fits flat in the bottom of the spinner basket, or use a small paper plate that fits.',
          hazards: ['sharp'],
        },
        {
          text: 'Drop the circle in and squirt small blobs of red, white and blue paint near the middle.',
          tip: 'Small blobs make thin streaks; big blobs make a splat.',
        },
        { text: 'Put the lid on and spin as fast as you can for ten seconds. Listen to it whir.' },
        { text: 'Lift the lid, then lift the circle out by its edges. Boom: a firework.' },
        { text: 'Leave the paintings to dry for 30 minutes, then glue them onto black paper for a night sky and draw a thin line under each one for the rocket trail.', timerMinutes: 30 },
      ],
      learn: 'Spinning flings the paint straight outwards from the middle: it is the same push you feel on a fast playground roundabout.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'Thomas Jefferson was only 33 years old when he wrote the first draft of the Declaration of Independence, in rented rooms in Philadelphia.' },
    { sleeps: 11, kind: 'joke', text: 'What did one flag say to the other flag? Nothing, it just waved!' },
    { sleeps: 10, kind: 'craft', text: 'Cut a star from card with safety scissors, color it red, white and blue, and tape it to a straw: a star wand for the parade.' },
    { sleeps: 9, kind: 'fact', text: 'The oldest person to sign the Declaration of Independence, Benjamin Franklin, was 70. The youngest, Edward Rutledge of South Carolina, was just 26.' },
    { sleeps: 8, kind: 'say', text: 'Learn to say Happy Fourth of July in Spanish, a language millions of American families speak at home!', greeting: 2 },
    { sleeps: 7, kind: 'color', text: 'Color in the Fourth of July page. Fill the night sky with fireworks in every color you can find!' },
    { sleeps: 6, kind: 'fact', text: 'Firework colors come from metals: strontium makes red, copper makes blue and barium makes green. Blue is the trickiest color to get right.' },
    { sleeps: 5, kind: 'joke', text: 'Why did the firework go to school? It wanted to be a little brighter!' },
    { sleeps: 4, kind: 'seek', text: 'Some sneaky surprises are hiding in the Fourth of July picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 3, kind: 'fact', text: 'Calvin Coolidge, the 30th president, is the only US president born on the Fourth of July. He was born in Vermont in 1872.' },
    { sleeps: 2, kind: 'craft', text: 'Glue strips of red and white paper onto a sheet, add a blue square in the top-left corner and dot it with white stars to make your own flag.' },
    { sleeps: 1, kind: 'say', text: 'Tomorrow is the Fourth of July! Fireworks are for watching from far away while grown-ups are in charge. Learn to say Happy Independence Day in Spanish too!', greeting: 3 },
  ],

  parentNote:
    'Independence Day is a US holiday; when 4 July lands on a weekend, the day off moves to the nearest Friday or Monday. Fireworks, including sparklers, which burn hotter than 1,000 °C, are for adults only: keep children at a distance, keep a bucket of water handy, and consider a public display instead of a back-garden one.',

  sources: [
    "Library of Congress, 'Today in History: July 4' (Independence Day; Philadelphia fireworks, 1777)",
    "National Archives, 'The Declaration of Independence: A History' (2 July vote; 2 August signing)",
    "National Park Service, 'The Liberty Bell' (tapped 13 times each Fourth of July)",
    "Smithsonian National Museum of American History, 'Facts about the United States flag' (50-star flag, 1960)",
    "National Hot Dog and Sausage Council, 'Hot dog consumption statistics' (150 million on the Fourth)",
  ],
};

export default independenceDayUs;
