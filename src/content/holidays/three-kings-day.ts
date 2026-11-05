import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Three Kings Day, also called Epiphany, comes twelve days after Christmas, on January 6.',
    'Christians remember the story of the Magi, wise men who followed a star to bring gifts to the baby Jesus.',
    'In Spain, Mexico and many Latin American countries, children leave out shoes (and sometimes hay for the camels) and wake to find presents from the Three Kings.',
    'In France, families share a galette des rois, a flaky cake with a tiny charm hidden inside; whoever finds it wears a paper crown.',
  ],
  facts: [
    {
      text: 'In Mexico, families share a ring-shaped sweet bread called rosca de reyes with a tiny baby figure hidden inside. Whoever finds it has to host a tamale party on February 2!',
      wow: true,
    },
    {
      text: 'The Bible story in the Gospel of Matthew never says how many wise men there were. People settled on three because of the three gifts: gold, frankincense and myrrh. Their names, Melchior, Caspar and Balthasar, came from later tradition.',
      bigKids: true,
    },
    {
      text: 'On the evening of January 5, towns across Spain hold a Cabalgata de Reyes, a parade where the Three Kings ride through the streets and toss sweets to the crowd.',
    },
  ],
  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de Reyes!', sayIt: 'feh-LEES DEE-ah deh REH-yes', meaning: 'Happy Kings\' Day' },
    { lang: 'fr', langName: 'French', text: 'Joyeuse Épiphanie !', sayIt: 'zhwah-YUHZ ay-pee-fah-NEE', meaning: 'Happy Epiphany' },
  ],
  recipes: [
    {
      id: 'three-kings-crown-bread',
      title: 'Three Kings Crown Bread',
      emoji: '👑',
      blurb: 'A soft, orange-scented sweet bread baked in a ring and decorated with jewel-bright dried fruit, like a rosca de reyes.',
      minutes: 150,
      serves: 10,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'milk', 'egg'],
      swaps: [{ avoid: 'milk', use: 'plant milk and a dairy-free spread' }],
      chokingNote:
        'If you hide a bean or charm inside, tell everyone before they take a bite, and skip it entirely when children under 4 are eating.',
      equipment: ['large mixing bowl', 'small saucepan or microwave-safe jug', 'baking sheet', 'parchment paper', 'clean dish towel', 'pastry brush'],
      ingredients: [
        { item: 'plain (all-purpose) flour', us: { qty: 3, unit: 'cup' }, metric: { qty: 360, unit: 'g' }, note: 'plus extra for dusting' },
        { item: 'instant (fast-action) yeast', us: { qty: 2.25, unit: 'tsp' }, metric: { qty: 7, unit: 'g' }, note: 'one packet' },
        { item: 'sugar', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 50, unit: 'g' } },
        { item: 'salt', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 3, unit: 'g' } },
        { item: 'milk', us: { qty: 0.75, unit: 'cup' }, metric: { qty: 180, unit: 'ml' } },
        { item: 'butter', us: { qty: 4, unit: 'tbsp' }, metric: { qty: 60, unit: 'g' } },
        { item: 'eggs', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, note: 'one for the dough, one for brushing' },
        { item: 'orange', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'for the zest' },
        { item: 'dried apricots and glacé cherries', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' }, note: 'cut into strips' },
        { item: 'coarse sugar for sprinkling', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' }, optional: true },
        { item: 'dried bean wrapped in foil', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, optional: true, note: 'the hidden surprise' },
      ],
      steps: [
        {
          text: 'Warm the milk and butter together in a saucepan or microwave until the butter melts and the milk feels like warm bath water, not hot.',
          adult: true,
          hazards: ['heat'],
          tip: 'Too hot and the yeast will not work. Dip in a clean finger: it should feel cozy.',
        },
        { text: 'In the large bowl, mix the flour, yeast, sugar and salt with a spoon.' },
        {
          text: 'Add the warm milk mixture, one egg and the orange zest. Stir until it comes together into a shaggy dough.',
          hazards: ['raw-egg'],
          tip: 'Wash your hands after touching raw egg.',
        },
        { text: 'Dust the counter with flour and knead the dough: push, fold, turn. Keep going for 8 minutes until it is smooth and springy.', timerMinutes: 8 },
        { text: 'Put the dough back in the bowl, cover with the dish towel and leave it somewhere warm to puff up to twice its size, about 1 hour.', timerMinutes: 60 },
        {
          text: 'Roll the dough into a long log, then join the ends to make a ring on the lined baking sheet. If you are using the foil-wrapped bean, tuck it in underneath now.',
        },
        {
          text: 'Press the strips of dried fruit on top like crown jewels. Brush the ring with the second egg, beaten, and sprinkle on the coarse sugar. Let it rest 20 minutes while a grown-up heats the oven to 350°F / 180°C.',
          adult: true,
          hazards: ['raw-egg', 'heat'],
          timerMinutes: 20,
        },
        { text: 'Bake at 350°F / 180°C for 25 minutes, until golden brown and hollow-sounding when tapped.', adult: true, hazards: ['heat'], timerMinutes: 25 },
        { text: 'Let the crown cool for 15 minutes before cutting it.', timerMinutes: 15 },
        { text: 'Taste test! A grown-up cuts a piece for everyone. Whoever finds the bean wears the crown for the day.' },
      ],
      tip: 'No orange? Use the zest of a lemon, or skip it and add 1 tsp vanilla instead.',
    },
  ],
  crafts: [
    {
      id: 'paper-crown',
      title: 'Three Kings Paper Crown',
      emoji: '👑',
      blurb: 'A gold card crown with paper jewels, ready for whoever finds the surprise in the bread.',
      minutes: 20,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'yellow or gold card', qty: '1 large sheet', substitute: 'a cereal box painted yellow' },
        { item: 'safety scissors' },
        { item: 'sticky tape or a stapler' },
        { item: 'crayons or markers' },
        { item: 'jewel stickers or scraps of colored paper', optional: true },
        { item: 'glue stick', optional: true },
      ],
      steps: [
        { text: 'Wrap a strip of card around your head to see how long it needs to be, and make a pencil mark where it overlaps.' },
        {
          text: 'Cut the strip to length, then cut a zigzag of points along the top edge.',
          hazards: ['sharp'],
          kidSafeOverride: 'safety scissors on card; a grown-up helps younger children',
        },
        { text: 'Decorate the crown with crayons, and glue on paper jewels or press on stickers.' },
        { text: 'Bring the ends together to fit your head and tape or staple them in place.' },
        { text: 'Try it on! The crown goes to whoever finds the surprise in the Three Kings bread.' },
      ],
      learn: 'In France, bakeries sell galettes with a paper crown on top for exactly this reason.',
    },
  ],
  parentNote:
    'Epiphany is a public holiday in Spain and several other European countries. In Mexico it is a big family celebration, though not an official day off. Some Orthodox Christians celebrate Christmas itself around this date, on January 7, because their church follows the older Julian calendar.',
  sources: [
    'Encyclopaedia Britannica, \'Epiphany\'',
    'Encyclopaedia Britannica, \'Magi\'',
    'Gospel of Matthew, chapter 2',
  ],
};

export default content;
