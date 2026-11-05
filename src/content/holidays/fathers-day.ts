import type { HolidayContent } from '../types';

const fathersDay: HolidayContent = {
  story: [
    "Father's Day is a day to say thank you to dads, grandads, step-dads and all the grown-ups who show up for you.",
    "In the United States, Sonora Smart Dodd planned the first Father's Day in Spokane, Washington in 1910 to honor her father, who had raised six children on his own.",
    "It took a long time to catch on: Father's Day only became an official national holiday in the United States in 1972.",
    'Many countries celebrate on the third Sunday in June, Australia and New Zealand wait until the first Sunday in September, and in Germany many dads spend Vatertag on a long walk with friends.',
    'Many families make a card, cook breakfast, build something together or simply spend the day doing whatever Dad likes best.',
  ],

  facts: [
    {
      text: "The first Father's Day was celebrated on 19 June 1910 in Spokane, Washington, and President Richard Nixon signed the law that made it a permanent national holiday in 1972.",
      bigKids: true,
    },
    {
      text: "Sonora Smart Dodd got the idea while listening to a Mother's Day sermon in church, and decided dads deserved a day of their own too.",
      wow: true,
    },
    {
      text: 'In Germany, Vatertag falls on Ascension Day, a Thursday in spring, and groups of dads often walk through the countryside pulling a little wagon loaded with picnic food.',
    },
    {
      text: 'Thailand celebrates Father’s Day on 5 December, the birthday of the late King Bhumibol, and many people wear yellow because that is the color of Monday, the day he was born.',
      bigKids: true,
    },
    {
      text: "Roses were the first Father's Day flower in Spokane: a red rose for a father who is alive and a white rose to remember one who has died.",
      wow: true,
    },
    {
      text: 'In Brazil, Dia dos Pais is the second Sunday in August, while Spain, Italy and Portugal celebrate on 19 March, the feast day of Saint Joseph.',
    },
  ],

  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día del Padre!', sayIt: 'feh-LEES DEE-ah del PAH-dreh', meaning: "Happy Father's Day!" },
    { lang: 'fr', langName: 'French', text: 'Bonne fête papa !', sayIt: 'bun FET pah-PAH', meaning: "Happy Father's Day, Dad! (literally 'good celebration, Dad')" },
    { lang: 'de', langName: 'German', text: 'Alles Gute zum Vatertag!', sayIt: 'AH-less GOO-teh tsoom FAH-ter-tahk', meaning: "All the best for Father's Day!" },
    { lang: 'pt-BR', langName: 'Portuguese (Brazil)', text: 'Feliz Dia dos Pais!', sayIt: 'feh-LEES JEE-ah doos PICE', meaning: "Happy Father's Day! (literally 'happy day of the fathers')" },
  ],

  recipes: [
    {
      id: 'super-trail-mix',
      title: 'Super Trail Mix',
      emoji: '🥜',
      blurb: 'Nuts, seeds, fruit, pretzels and a few chocolate chips, mixed by you and packed in a jar for the next adventure.',
      minutes: 10,
      serves: 6,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: ['tree-nut', 'peanut', 'wheat', 'gluten', 'milk', 'soy'],
      swaps: [
        { avoid: 'tree-nut', use: 'sunflower seeds' },
        { avoid: 'peanut', use: 'roasted chickpeas or extra pumpkin seeds' },
        { avoid: 'wheat', use: 'gluten-free pretzels or crunchy rice cereal' },
        { avoid: 'gluten', use: 'gluten-free pretzels or crunchy rice cereal' },
        { avoid: 'milk', use: 'dairy-free chocolate chips or extra raisins' },
      ],
      chokingNote: 'Whole nuts are a choking hazard for children under four: leave the nuts out and use seeds for little ones, and sit down to eat.',
      equipment: ['Big bowl', 'Measuring cup', 'Big spoon', 'Small jars or zip bags'],
      ingredients: [
        { item: 'Whole almonds', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 70, unit: 'g' }, allergens: ['tree-nut'] },
        { item: 'Peanuts', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 70, unit: 'g' }, note: 'unsalted', allergens: ['peanut'] },
        { item: 'Pumpkin seeds', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 35, unit: 'g' } },
        { item: 'Raisins', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' } },
        { item: 'Dried cranberries', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 35, unit: 'g' } },
        { item: 'Mini pretzels', us: { qty: 1, unit: 'cup' }, metric: { qty: 40, unit: 'g' }, allergens: ['wheat', 'gluten'] },
        { item: 'Mini chocolate chips', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 45, unit: 'g' }, allergens: ['milk', 'soy'] },
      ],
      steps: [
        { text: 'Tip the almonds, peanuts and pumpkin seeds into the big bowl.' },
        { text: 'Add the raisins and cranberries and give everything a stir.' },
        { text: 'Add the pretzels and chocolate chips last so they do not get crushed.' },
        { text: 'Mix gently with the big spoon until every scoop has a bit of everything.', tip: 'Count the different things as you go: a good mix has at least five.' },
        { text: 'Scoop the mix into jars or bags and write a label: Super Mix, made by me.' },
        { text: 'Taste test! Hunt for one scoop with one of everything in it, then save the rest for a walk with Dad.' },
      ],
      tip: 'Keep it in a sealed jar and it stays crunchy for a week.',
    },
    {
      id: 'best-ever-grilled-cheese',
      title: 'Best-Ever Grilled Cheese',
      emoji: '🧀',
      blurb: 'Golden, crunchy outside and a cheese string that stretches as long as your arm.',
      minutes: 20,
      serves: 2,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'milk'],
      swaps: [
        { avoid: 'wheat', use: 'gluten-free bread' },
        { avoid: 'gluten', use: 'gluten-free bread' },
        { avoid: 'milk', use: 'dairy-free cheese slices and olive oil instead of butter' },
      ],
      equipment: ['Butter knife', 'Frying pan', 'Spatula', 'Chopping board', 'Sharp knife (grown-up)'],
      ingredients: [
        { item: 'Bread', us: { qty: 4, unit: 'slice' }, metric: { qty: 4, unit: 'slice' }, note: 'thick-cut', allergens: ['wheat', 'gluten'] },
        { item: 'Cheddar cheese', us: { qty: 4, unit: 'slice' }, metric: { qty: 4, unit: 'slice' }, allergens: ['milk'] },
        { item: 'Butter', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'softened', allergens: ['milk'] },
        { item: 'Tomato', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, optional: true },
        { item: 'Apple', us: { qty: 0.5, unit: 'piece' }, metric: { qty: 0.5, unit: 'piece' }, note: 'surprisingly good with cheese', optional: true },
      ],
      steps: [
        { text: 'Spread butter on one side of each piece of bread with a butter knife, right to the edges.', kidSafeOverride: 'Butter knife on soft bread: blunt and kid-safe.' },
        { text: 'A grown-up cuts the tomato or apple into thin pieces if you are using them.', adult: true, hazards: ['sharp'] },
        { text: 'Flip two pieces of bread over, butter side down, and lay two pieces of cheese on each.' },
        { text: 'Add a few tomato or apple pieces, then close each sandwich with the butter side facing out.' },
        { text: 'A grown-up heats the frying pan on medium-low and lays the sandwiches in.', adult: true, hazards: ['heat'] },
        { text: 'Cook for 3 minutes until the bottom is golden, then a grown-up flips each sandwich with the spatula and cooks the other side for 3 more minutes.', adult: true, hazards: ['heat'], timerMinutes: 3 },
        { text: 'A grown-up lifts the sandwiches onto the board to rest for 1 minute: melted cheese is very hot.', adult: true, hazards: ['heat'], timerMinutes: 1 },
        { text: 'A grown-up cuts each sandwich into triangles with the sharp knife.', adult: true, hazards: ['sharp'] },
        { text: 'Taste test! Pull the halves apart slowly and count how long the cheese string stretches.' },
      ],
      tip: 'Medium-low heat is the secret: too hot and the outside burns before the cheese melts.',
    },
  ],

  crafts: [
    {
      id: 'paper-airplane-fleet',
      title: 'Paper Airplane Fleet',
      emoji: '✈️',
      blurb: 'Fold a squadron of planes, give each one a name and a number, then hold a flying contest with Dad.',
      minutes: 25,
      mess: 1,
      adultHelp: 'none',
      hazards: [],
      materials: [
        { item: 'Paper', qty: '4 sheets, letter or A4', substitute: 'pages from an old magazine' },
        { item: 'Crayons or markers' },
        { item: 'Stickers', optional: true },
      ],
      steps: [
        { text: 'Fold a sheet of paper in half the long way, then open it up again so you can see the crease.' },
        { text: 'Fold the two top corners in to meet the middle crease, making a point at the top.' },
        { text: 'Fold the new slanted edges in to the middle crease again, so the nose gets sharper.', tip: 'Run your fingernail along every fold to make it crisp.' },
        { text: 'Fold the whole plane in half along the first crease, with all the folds on the outside.' },
        { text: 'Fold each side down to make a wing, lining its top edge up with the bottom of the plane.' },
        { text: 'Decorate your plane with stripes, a name and a number, then fold three more to complete the fleet.' },
        { text: 'Hold the plane under the wings, point the nose a little upwards and throw it gently, never toward anyone\'s face.' },
      ],
      learn: 'A paper plane is a flying experiment: change one fold at a time and see whether it glides further.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: "Sonora Smart Dodd wanted the first Father's Day on 5 June, her dad's birthday, but the local churches needed more time to get ready, so it moved to 19 June 1910." },
    { sleeps: 11, kind: 'joke', text: 'Time to practice your dad jokes! What do you call a fish wearing a bow tie? Sofishticated!' },
    { sleeps: 10, kind: 'craft', text: 'Cut a circle from an old cereal box with safety scissors, cover it in kitchen foil and tape on a ribbon: a Best Dad medal, ready to hang.' },
    { sleeps: 9, kind: 'fact', text: 'Emperor penguin dads keep their egg warm on their feet for about two months in the Antarctic winter, eating nothing at all until the chick hatches.' },
    { sleeps: 8, kind: 'say', text: "Learn to say Happy Father's Day in German, where lots of dads celebrate Vatertag with a long walk!", greeting: 2 },
    { sleeps: 7, kind: 'color', text: "Color in the Father's Day page. Give it bold stripes, wild spots or your dad's favorite color!" },
    { sleeps: 6, kind: 'fact', text: "In Taiwan, Father's Day is on 8 August, because 8/8 in Mandarin is 'ba ba', which sounds a lot like baba, the word for Dad." },
    { sleeps: 5, kind: 'joke', text: "What did the baby corn say to the papa corn? Where's popcorn?" },
    { sleeps: 4, kind: 'seek', text: "Some sneaky surprises are hiding in the Father's Day picture. Can you spot every one? Open Seek & Find!" },
    { sleeps: 3, kind: 'fact', text: 'Seahorse dads carry the babies: the mom puts her eggs into a pouch on his tummy, and a few weeks later he gives birth to hundreds of tiny seahorses.' },
    { sleeps: 2, kind: 'craft', text: 'Draw you and your dad doing your favorite thing together, then roll it up and tie it with string or ribbon, like a secret scroll.' },
    { sleeps: 1, kind: 'say', text: "Tomorrow is Father's Day! Practise saying it in Spanish tonight so you can be the very first to say it in the morning.", greeting: 0 },
  ],

  parentNote:
    "Father's Day is the third Sunday in June in most places; Australia and New Zealand celebrate on the first Sunday of September. Not every child has a dad at home: the day works just as well for a grandad, an uncle or any grown-up who shows up, so feel free to rename it.",

  sources: [
    "Encyclopaedia Britannica, 'Father's Day' (Sonora Smart Dodd, Spokane 1910; permanent national holiday 1972; dates around the world)",
    "Library of Congress, 'Today in History: June 19' (the first Father's Day, 1910)",
    "Deutsche Welle, 'Vatertag: how Germany celebrates Father's Day on Ascension Day'",
    "Tourism Authority of Thailand, 'Father's Day in Thailand' (5 December, King Bhumibol's birthday, the color yellow)",
  ],
};

export default fathersDay;
