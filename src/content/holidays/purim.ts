import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Purim is a joyful Jewish holiday that remembers the story told in the Book of Esther.',
    'Long ago in Persia, a queen named Esther bravely spoke up and saved the Jewish people from a plot by the wicked Haman.',
    'Families go to hear the Megillah, the scroll of Esther, read aloud, and every time Haman\'s name is said, kids spin noisemakers called groggers to drown it out.',
    'People dress up in costumes, give gifts of food to friends, give to those in need, and eat three-cornered cookies called hamantaschen.',
  ],
  facts: [
    {
      text: 'The Book of Esther is one of only two books in the Hebrew Bible that never mentions God by name. Many people say God is hidden in the story, which is one reason for the costumes and masks.',
      wow: true,
    },
    {
      text: 'Purim means "lots". Haman cast lots (a bit like rolling dice) to pick the day for his plan: the 13th of the Hebrew month of Adar. The Jews were saved, and the next day, the 14th of Adar, became the holiday.',
      bigKids: true,
    },
    {
      text: 'Hamantaschen means "Haman\'s pockets" in Yiddish. In Hebrew they are called oznei Haman, "Haman\'s ears". Either way, you get to eat the villain.',
    },
  ],
  greetings: [
    { lang: 'he', langName: 'Hebrew', text: 'חג פורים שמח', roman: 'Chag Purim Sameach', sayIt: 'KHAHG poo-REEM sah-MAY-akh', meaning: 'Happy Purim holiday' },
    { lang: 'he', langName: 'Hebrew', text: 'פורים שמח', roman: 'Purim Sameach', sayIt: 'poo-REEM sah-MAY-akh', meaning: 'Happy Purim' },
  ],
  recipes: [
    {
      id: 'hamantaschen',
      title: 'Hamantaschen',
      emoji: '🍪',
      blurb: 'Buttery three-cornered cookies folded around a spoonful of jam.',
      minutes: 75,
      serves: 12,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['milk', 'wheat', 'gluten', 'egg'],
      swaps: [
        { avoid: 'milk', use: 'a dairy-free baking spread' },
        { avoid: 'gluten', use: 'a gluten-free flour blend' },
      ],
      equipment: ['large mixing bowl', 'wooden spoon or electric mixer', 'plastic wrap', 'rolling pin', 'drinking glass about 3 inches / 8 cm wide', 'baking sheets', 'parchment paper'],
      ingredients: [
        { item: 'butter', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 115, unit: 'g' }, note: 'softened' },
        { item: 'sugar', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 100, unit: 'g' } },
        { item: 'egg', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'vanilla extract', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' } },
        { item: 'plain (all-purpose) flour', us: { qty: 2, unit: 'cup' }, metric: { qty: 240, unit: 'g' }, note: 'plus extra for rolling' },
        { item: 'baking powder', us: { qty: 1, unit: 'tsp' }, metric: { qty: 4, unit: 'g' } },
        { item: 'salt', us: { qty: 0.25, unit: 'tsp' }, metric: { qty: 1, unit: 'ml' } },
        { item: 'milk', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'ml' }, note: 'only if the dough is crumbly' },
        { item: 'thick jam (apricot, raspberry or strawberry)', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 160, unit: 'g' }, note: 'or poppy-seed filling' },
      ],
      steps: [
        { text: 'In the large bowl, beat the soft butter and sugar together until pale and fluffy.' },
        { text: 'Beat in the egg and vanilla.', hazards: ['raw-egg'], tip: 'Wash your hands after touching raw egg.' },
        { text: 'Add the flour, baking powder and salt and mix until a soft dough forms. If it is crumbly, add the milk a little at a time.' },
        { text: 'Wrap the dough in plastic wrap and chill it in the fridge for 30 minutes.', timerMinutes: 30 },
        { text: 'Ask a grown-up to turn the oven on to 350°F / 180°C and line the baking sheets with parchment paper.', adult: true, hazards: ['heat'] },
        { text: 'Dust the counter with flour and roll the dough out until it is about as thick as a pencil (a quarter inch / half a centimeter).' },
        { text: 'Press the glass into the dough to stamp out circles. Gather the scraps, roll again and stamp more.' },
        { text: 'Put a teaspoon of jam in the middle of each circle. Fold up three sides to make a triangle and pinch the corners tight so the jam stays in.', tip: 'Less jam than you think! Overfilled cookies leak.' },
        { text: 'Place the cookies on the lined trays and bake at 350°F / 180°C for 12 to 14 minutes, until the edges turn golden.', adult: true, hazards: ['heat'], timerMinutes: 13 },
        { text: 'Let the cookies cool on the tray for 10 minutes; the jam is very hot at first.', timerMinutes: 10 },
        { text: 'Taste test! Then pack a few in a bag to give to a friend for mishloach manot.' },
      ],
      tip: 'Makes about 24 cookies. The dough can be made a day ahead and kept in the fridge.',
    },
  ],
  crafts: [],
  parentNote:
    'Purim begins at sundown as the 14th of Adar starts on the Hebrew calendar (Hebrew days run from evening to evening; in a Hebrew leap year it is Adar II), so it moves between late February and late March. In Jerusalem and other ancient walled cities it is celebrated one day later, called Shushan Purim.',
  sources: [
    'Encyclopaedia Britannica, \'Purim\'',
    'Book of Esther, chapters 3 and 9',
    'My Jewish Learning, \'Purim 101\'',
  ],
};

export default content;
