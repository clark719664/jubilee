import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Pancake Day, also called Shrove Tuesday, is the day before Lent begins for many Christians.',
    'Long ago people used up their eggs, butter and milk before the forty days of fasting, so they made pancakes.',
    'In Britain, families flip pancakes with lemon and sugar, and some towns hold pancake races.',
    'In New Orleans and in France the same day is Mardi Gras, which means Fat Tuesday, celebrated with parades, masks and sweet treats.',
  ],
  facts: [
    {
      text: 'The town of Olney in England says its pancake race began in 1445, when a woman heard the church bell and ran out still holding her frying pan. Today\'s runners sprint about 415 yards (380 meters) carrying a frying pan and must flip their pancake on the way.',
      wow: true,
    },
    {
      text: 'Pancake Day moves with Easter: it is always 47 days before Easter Sunday, so it can land anywhere from February 3 to March 9.',
      bigKids: true,
    },
    {
      text: 'The word "shrove" comes from "shrive", an old word meaning to confess and be forgiven, which is what many people did on this day before Lent.',
    },
  ],
  greetings: [
    { lang: 'en', langName: 'English', text: 'Happy Pancake Day!', sayIt: 'HAP-ee PAN-kayk DAY', meaning: 'A greeting for the day' },
  ],
  recipes: [
    {
      id: 'flip-happy-pancakes',
      title: 'Flip-Happy Pancakes',
      emoji: '🥞',
      blurb: 'Fluffy pancakes you mix in one bowl, with a grown-up at the pan and you on flipping duty.',
      minutes: 25,
      serves: 4,
      difficulty: 1,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'egg', 'milk'],
      swaps: [
        { avoid: 'milk', use: 'any plant milk, and oil instead of butter' },
        { avoid: 'gluten', use: 'a gluten-free flour blend' },
        { avoid: 'egg', use: 'half a mashed ripe banana' },
      ],
      equipment: ['large mixing bowl', 'small jug or bowl', 'whisk', 'frying pan', 'spatula', 'ladle or measuring cup'],
      ingredients: [
        { item: 'plain (all-purpose) flour', us: { qty: 1, unit: 'cup' }, metric: { qty: 120, unit: 'g' } },
        { item: 'sugar', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 12, unit: 'g' } },
        { item: 'baking powder', us: { qty: 2, unit: 'tsp' }, metric: { qty: 8, unit: 'g' } },
        { item: 'salt', us: { qty: 0.25, unit: 'tsp' }, metric: { qty: 1, unit: 'pinch' } },
        { item: 'milk', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' } },
        { item: 'egg', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'butter', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'melted, plus a little for the pan' },
        { item: 'lemon, sugar, berries or syrup', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, optional: true, note: 'for topping' },
      ],
      steps: [
        { text: 'In the large bowl, whisk together the flour, sugar, baking powder and salt.' },
        { text: 'In the jug, whisk the milk, egg and melted butter together.', hazards: ['raw-egg'], tip: 'Wash your hands after cracking the egg.' },
        { text: 'Pour the wet mix into the dry mix and stir just until no dry flour is left. Lumps are fine; stirring too much makes tough pancakes.' },
        { text: 'Let the batter rest for 5 minutes. Resting makes the pancakes fluffier.', timerMinutes: 5 },
        { text: 'A grown-up heats the frying pan over medium heat and adds a little butter.', adult: true, hazards: ['heat'] },
        { text: 'Pour a quarter-cup of batter into the pan for each pancake. Cook until bubbles pop on top and the edges look dry, about 2 minutes.', adult: true, hazards: ['heat'], timerMinutes: 2 },
        { text: 'Flip! Slide the spatula under and turn the pancake over. Cook 1 more minute until golden.', adult: true, hazards: ['heat'], timerMinutes: 1, tip: 'A grown-up holds the pan; a kid can do the flip with the spatula once the pan is off the heat.' },
        { text: 'Stack the pancakes on a plate and cover with a clean towel while you cook the rest.' },
        { text: 'Taste test! Squeeze on lemon and sprinkle sugar, or pile on berries, and dig in.' },
      ],
      tip: 'For the first pancake, test the heat: if it browns in under a minute, turn the stovetop down a notch.',
    },
  ],
  crafts: [],
  parentNote:
    'Shrove Tuesday is 47 days before Easter, so the date changes every year. The next day, Ash Wednesday, begins Lent for many Christians.',
  sources: [
    'Encyclopaedia Britannica, \'Shrove Tuesday\'',
    'Olney Town Council, \'The Olney Pancake Race\'',
  ],
};

export default content;
