import type { HolidayContent } from '../types';

const mothersDay: HolidayContent = {
  story: [
    "Mother's Day is a day to say thank you to moms, grandmas, step-moms and every grown-up who cares for you like a mother.",
    "In the United States it began with Anna Jarvis, who organized the first Mother's Day service in 1908 to honor her own mother, and it became a national holiday in 1914.",
    'The date moves around the world: many countries keep the second Sunday in May, the United Kingdom has Mothering Sunday in spring, Mexico always celebrates on 10 May and France waits until late May.',
    'Many families make breakfast in bed, pick a bunch of flowers or write a card that says exactly why their mom is wonderful.',
  ],

  facts: [
    {
      text: "Anna Jarvis, who started Mother's Day in the United States, later spent years trying to stop it, because she felt shops had made it all about buying things instead of saying thank you.",
      wow: true,
    },
    {
      text: "The first official Mother's Day service was held in Grafton, West Virginia on 10 May 1908, and President Woodrow Wilson made the second Sunday in May a national holiday in 1914.",
      bigKids: true,
    },
    {
      text: "Mothering Sunday in the United Kingdom is much older: it began as a day in Lent when people went back to visit their 'mother church', and children working away from home were given the day off to see their families.",
      bigKids: true,
    },
    {
      text: "In Mexico, Mother's Day is always on 10 May whatever the day of the week, and many families wake their mom with a song called 'Las Mañanitas'.",
    },
    {
      text: "The white carnation was the very first Mother's Day flower: Anna Jarvis chose it because it was her mother's favorite, and sent hundreds to the first service.",
      wow: true,
    },
  ],

  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de la Madre!', sayIt: 'feh-LEES DEE-ah deh lah MAH-dreh', meaning: "Happy Mother's Day!" },
    { lang: 'fr', langName: 'French', text: 'Bonne fête maman !', sayIt: 'bun FET mah-MAHN', meaning: "Happy Mother's Day, Mom! (literally 'good celebration, Mom')" },
    { lang: 'zh-Hans', langName: 'Chinese (Mandarin)', text: '母亲节快乐', roman: 'Mǔqīn jié kuàilè', sayIt: 'MOO-chin jyeh KWHY-luh', meaning: "Happy Mother's Day!" },
    { lang: 'hi', langName: 'Hindi', text: 'मातृ दिवस की शुभकामनाएँ', roman: 'Matri Divas ki shubhkamnayein', sayIt: 'MAH-tree dih-VAHS kee shoob-KAHM-nah-yen', meaning: "Best wishes for Mother's Day" },
  ],

  recipes: [
    {
      id: 'breakfast-in-bed-parfaits',
      title: 'Breakfast-in-Bed Parfaits',
      emoji: '🥣',
      blurb: 'Stripes of yogurt, crunchy granola and berries in a glass, carried upstairs on a tray with a card.',
      minutes: 15,
      serves: 2,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: ['milk', 'gluten'],
      mayContain: ['tree-nut'],
      swaps: [
        { avoid: 'milk', use: 'a thick coconut or soy yogurt' },
        { avoid: 'gluten', use: 'gluten-free granola or crushed rice cereal' },
        { avoid: 'tree-nut', use: 'a nut-free granola (check the label)' },
      ],
      equipment: ['Two glasses or jam jars', 'Spoon', 'Tray'],
      ingredients: [
        { item: 'Greek yogurt', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Granola', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 50, unit: 'g' }, allergens: ['gluten'] },
        { item: 'Strawberries', us: { qty: 6, unit: 'piece' }, metric: { qty: 6, unit: 'piece' } },
        { item: 'Blueberries', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' } },
        { item: 'Banana', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'Honey', us: { qty: 2, unit: 'tsp' }, metric: { qty: 10, unit: 'ml' }, note: 'not for children under one', optional: true },
      ],
      steps: [
        { text: 'Wash the strawberries and blueberries and pat them dry with a clean dish towel.' },
        { text: 'Pull the green tops off the strawberries and tear the berries into small pieces with your fingers.' },
        { text: 'Peel the banana and break it into chunks.', kidSafeOverride: 'Peeling a banana by hand: no peeler, no knife.' },
        { text: 'Spoon a layer of yogurt into the bottom of each glass.' },
        { text: 'Add a layer of granola, then a layer of fruit.' },
        { text: 'Keep going, yogurt then granola then fruit, until the glass is full and stripy.', tip: 'Press each layer flat with the back of the spoon so the stripes stay neat.' },
        { text: 'Drizzle a little honey on top if you like and finish with one perfect strawberry.' },
        { text: 'Set the glasses on a tray with a spoon, a napkin and your card, then carry it slowly up to Mom.' },
        { text: 'Taste test! Sit on the end of the bed and share: one spoonful for Mom, one spoonful for you.' },
      ],
      tip: 'Add the granola just before serving so it stays crunchy.',
    },
    {
      id: 'flower-pancakes',
      title: 'Flower Pancakes',
      emoji: '🌼',
      blurb: 'Six small pancakes arranged in a ring make a flower, then fruit turns it into a garden.',
      minutes: 30,
      serves: 2,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'egg', 'milk'],
      swaps: [
        { avoid: 'wheat', use: 'a gluten-free self-rising flour blend' },
        { avoid: 'gluten', use: 'a gluten-free self-rising flour blend' },
        { avoid: 'egg', use: 'one mashed banana in place of the egg' },
        { avoid: 'milk', use: 'oat or soy milk, and oil instead of butter in the pan' },
      ],
      equipment: ['Big mixing bowl', 'Jug', 'Whisk', 'Frying pan', 'Spatula', 'Plates'],
      ingredients: [
        { item: 'Self-raising flour', us: { qty: 1, unit: 'cup' }, metric: { qty: 125, unit: 'g' }, note: 'or all-purpose flour plus 1½ tsp baking powder', allergens: ['wheat', 'gluten'] },
        { item: 'Sugar', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' } },
        { item: 'Salt', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' } },
        { item: 'Egg', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, allergens: ['egg'] },
        { item: 'Milk', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Butter', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' }, note: 'for the pan', allergens: ['milk'] },
        { item: 'Strawberries', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' }, note: 'for the flower centers' },
        { item: 'Blueberries', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 40, unit: 'g' }, note: 'for the petals' },
        { item: 'Banana', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'for the leaves', optional: true },
      ],
      steps: [
        { text: 'Whisk the flour, sugar and salt together in the big bowl.' },
        { text: 'Crack the egg into the jug, pour in the milk and whisk until it is one color.', hazards: ['raw-egg'], tip: 'Wash your hands after touching raw egg.' },
        { text: 'Pour the wet mix into the dry mix and stir until just combined. A few lumps are fine.' },
        { text: 'A grown-up melts the butter in the frying pan over medium heat.', adult: true, hazards: ['heat'] },
        { text: 'A grown-up spoons six small circles of batter into the pan, leaving a gap between each one.', adult: true, hazards: ['heat'], tip: 'Cook in batches: the batter makes enough for two flowers.' },
        { text: 'When bubbles pop on top, after about 2 minutes, a grown-up flips each pancake with the spatula and cooks the other side for 1 minute.', adult: true, hazards: ['heat'], timerMinutes: 2 },
        { text: 'A grown-up moves the pancakes onto plates and cuts the strawberries and banana into thin rounds with a knife.', adult: true, hazards: ['sharp'] },
        { text: 'Arrange six pancakes in a flower, one in the middle and five around it, then decorate: a strawberry round in the center, blueberries on the petals and banana rounds for leaves.' },
        { text: 'Taste test! The cook gets the first petal; the rest goes up to Mom with a glass of juice.' },
      ],
      tip: 'Keep the pan on medium, not high: pancakes brown slowly and evenly that way.',
    },
  ],

  crafts: [
    {
      id: 'tissue-paper-flower-bouquet',
      title: 'Tissue-Paper Flower Bouquet',
      emoji: '💐',
      blurb: 'Fold, twist and fluff squares of tissue paper into flowers that never wilt.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Tissue paper', qty: '6 squares per flower, about the size of your hand', substitute: 'paper napkins' },
        { item: 'Pipe cleaners', qty: '1 per flower', substitute: 'green paper straws or twist ties' },
        { item: 'Scissors', substitute: 'ask a grown-up to pre-cut the squares and trim the ends' },
        { item: 'Ribbon', qty: 'a short length', optional: true, substitute: 'a strip of paper or wool' },
      ],
      steps: [
        { text: 'Stack six squares of tissue paper in any colors you like.' },
        { text: 'Fold the stack back and forth like a paper fan, with each fold about as wide as your finger.', tip: 'Press each fold flat before you make the next one.' },
        { text: 'Twist a pipe cleaner tightly around the middle of the fan: that is your stem.' },
        { text: 'Use scissors to round off the two ends of the fan, or snip them into points for a spiky flower.', hazards: ['sharp'] },
        { text: 'Gently pull the layers apart one at a time, lifting each sheet up toward the middle, until the flower is fluffy.' },
        { text: 'Make five or six flowers, bunch the stems together and tie them with a ribbon.' },
      ],
      learn: 'Folding a fan is a lesson in pleats and symmetry, and pulling the layers apart teaches gentle hands.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: "In Thailand, Mother's Day is on 12 August, the birthday of Queen Sirikit, the King's mother, and white jasmine flowers are the symbol of a mother's love." },
    { sleeps: 11, kind: 'joke', text: 'What did the mama tomato say to the baby tomato who was falling behind? Ketchup!' },
    { sleeps: 10, kind: 'craft', text: 'Draw around your hand on paper and cut it out with safety scissors. On each finger, write one reason you love your mom or grown-up.' },
    { sleeps: 9, kind: 'fact', text: "In lots of languages the word for mother starts with an m sound: mama, mom, mère, mā. Many linguists think it's because 'ma' is one of the easiest sounds a baby can make." },
    { sleeps: 8, kind: 'say', text: "Learn to say Happy Mother's Day in French! Word for word it means 'good celebration, Mom'.", greeting: 1 },
    { sleeps: 7, kind: 'color', text: "Color in the Mother's Day page. Will you make the flowers your mom's favorite colors?" },
    { sleeps: 6, kind: 'fact', text: "Sea otter moms float on their backs and carry their babies on their tummies. They even wrap them in seaweed so they don't drift away while Mom finds food." },
    { sleeps: 5, kind: 'joke', text: 'Why was the little cookie sad? Because its mom had been a wafer so long!' },
    { sleeps: 4, kind: 'seek', text: "Some sneaky surprises are hiding in the Mother's Day picture. How many can you find? Open Seek & Find!" },
    { sleeps: 3, kind: 'fact', text: 'African elephant moms carry their babies for about 22 months, longer than any other land animal, and a newborn calf weighs around 100 kilograms.' },
    { sleeps: 2, kind: 'craft', text: "Make a little book of helping coupons: fold strips of paper and write a job on each one, like 'I'll fold the washing' or 'one big hug'." },
    { sleeps: 1, kind: 'say', text: "Tomorrow is Mother's Day! Hide your card where Mom will find it in the morning, then learn to say Happy Mother's Day in Hindi.", greeting: 3 },
  ],

  parentNote:
    "The date depends on where you live: the app shows the second Sunday in May by default, Mothering Sunday (three weeks before Easter) in the UK, 10 May in Mexico and the last Sunday in May in France (or the first Sunday of June when that is Pentecost). Families come in all shapes; the recipes and craft work just as well for a gran, an aunt or any grown-up who does the mothering.",

  sources: [
    "Library of Congress, 'Today in History: May 10' (Anna Jarvis and the first Mother's Day service, Grafton, 1908)",
    "Encyclopaedia Britannica, 'Mother's Day' (Woodrow Wilson's 1914 proclamation; Jarvis's later campaign against commercialization; dates around the world)",
    "English Heritage, 'The history of Mothering Sunday' (mother church, Lent and the day off for servants)",
    "Secretaría de Cultura (Mexico), 'Día de las Madres: 10 de mayo' (the fixed date and Las Mañanitas)",
  ],
};

export default mothersDay;
