import type { HolidayContent } from '../types';

const thanksgiving: HolidayContent = {
  story: [
    'Thanksgiving is a day for gathering with family and friends, sharing a big meal and saying thank you for the good things in your life.',
    'In the United States it falls on the fourth Thursday of November; in Canada it comes earlier, on the second Monday of October, when the harvest is safely in.',
    'Many American families remember a harvest feast in 1621, when English settlers at Plymouth and Wampanoag people shared food after a very hard first year; many Native Americans also use the day to remember the painful history that came after.',
    'The table is often piled with roast turkey, stuffing, mashed potatoes, cranberry sauce and pumpkin pie, and in lots of homes everyone takes a turn to say one thing they are thankful for.',
    'Some families watch a parade or a football game, and many cook extra to share with neighbours or people who need a warm meal.',
  ],

  facts: [
    {
      text: 'Thanksgiving became a national US holiday in 1863, when President Abraham Lincoln declared it during the Civil War, after the editor Sarah Josepha Hale (who wrote "Mary Had a Little Lamb") had asked for it in letters for 17 years. In 1941 Congress fixed the date as the fourth Thursday of November.',
      bigKids: true,
    },
    {
      text: 'The big Thanksgiving parade in New York City has marched since 1924, and its giant balloons first floated in 1927. Today the biggest balloons are as tall as a five-storey building and take up to 90 people hanging on to ropes to keep them from flying away.',
      wow: true,
    },
    {
      text: "Canada's Thanksgiving comes on the second Monday of October, a date Parliament settled on in 1957. It is earlier than the American one because Canadian farmers finish their harvest sooner, before the cold sets in.",
    },
    {
      text: 'The main eyewitness account of the 1621 feast is a short letter: the Wampanoag leader Massasoit came with about ninety of his men and brought five deer, the colonists shot wild birds, and the feast went on for three days. Nobody mentions pumpkin pie: the settlers had no ovens and little sugar.',
    },
    {
      text: 'Every November the US President officially "pardons" a live turkey in a ceremony at the White House, a tradition that became official in 1989. The lucky bird is not eaten; it goes to live out its days on a farm or at a university.',
    },
    {
      text: 'Cranberries grow in boggy fields that farmers often flood at harvest time, so the ripe berries float to the top in a big red carpet. A good fresh cranberry bounces, and growers really do test them by bouncing.',
    },
  ],

  greetings: [
    {
      lang: 'en',
      langName: 'English',
      text: 'Happy Thanksgiving!',
      sayIt: 'HAP-ee thanks-GIV-ing',
      meaning: 'Happy Thanksgiving',
    },
    {
      lang: 'es',
      langName: 'Spanish',
      text: '¡Feliz Día de Acción de Gracias!',
      sayIt: 'feh-LEES DEE-ah deh ak-SYOHN deh GRAH-syahs',
      meaning: "Happy Thanksgiving Day (literally 'day of giving thanks')",
    },
    {
      lang: 'fr-CA',
      langName: 'French (Canada)',
      text: 'Joyeuse Action de grâce !',
      sayIt: 'zhwah-YUHZ ak-SYOHN duh GRAHSS',
      meaning: "Happy Thanksgiving, as said in Quebec and French-speaking Canada (literally 'joyful giving of thanks')",
    },
  ],

  recipes: [
    {
      id: 'no-bake-pumpkin-pie-cups',
      title: 'No-Bake Pumpkin Pie Cups',
      emoji: '🥧',
      blurb: 'All the taste of pumpkin pie with no oven: a crunchy cookie-crumb bottom, a creamy spiced pumpkin layer and a swirl of whipped cream on top. Makes 6.',
      minutes: 50,
      serves: 6,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['milk', 'wheat', 'gluten'],
      mayContain: ['soy'],
      swaps: [
        { avoid: 'wheat', use: 'gluten-free ginger cookies for the crumbs' },
        { avoid: 'gluten', use: 'gluten-free ginger cookies for the crumbs' },
        { avoid: 'milk', use: 'dairy-free cream cheese, dairy-free spread and chilled coconut cream' },
      ],
      equipment: ['Zip-seal bag', 'Rolling pin', '2 mixing bowls', 'Fork', 'Whisk', 'Spoon', '6 small glasses or cups'],
      ingredients: [
        { item: 'Graham crackers', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' }, note: 'full sheets; or 8 digestive biscuits', allergens: ['wheat', 'gluten'] },
        { item: 'Butter', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'very soft', allergens: ['milk'] },
        { item: 'Cream cheese', us: { qty: 4, unit: 'oz' }, metric: { qty: 110, unit: 'g' }, note: 'softened', allergens: ['milk'] },
        { item: 'Brown sugar', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 50, unit: 'g' } },
        { item: 'Canned pumpkin purée', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'g' }, note: 'plain pumpkin, not pie filling' },
        { item: 'Pumpkin pie spice', us: { qty: 1, unit: 'tsp' }, metric: { qty: 1, unit: 'tsp' }, note: 'or 3/4 tsp cinnamon plus a pinch each of ginger and nutmeg' },
        { item: 'Heavy (double) cream', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, note: 'cold from the fridge', allergens: ['milk'] },
        { item: 'Ground cinnamon', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' }, note: 'for the top' },
      ],
      steps: [
        { text: 'Put the graham crackers in the zip-seal bag, squeeze the air out and seal it. Bash and roll with the rolling pin until the crumbs look like sand.' },
        { text: 'Add the soft butter to the bag and squish it through the crumbs with your fingers until they clump like wet sand.' },
        { text: 'Spoon two tablespoons of crumbs into the bottom of each glass and press them down flat with the back of the spoon.' },
        { text: 'In one bowl, mash the cream cheese and brown sugar together with the fork until smooth. Stir in the pumpkin and the spice.' },
        {
          text: 'In the other bowl, whisk the cold cream until it is thick and holds soft peaks. Take turns; it takes a few minutes of hard whisking.',
          timerMinutes: 4,
          tip: 'Lift the whisk out. If the cream stands up in a little peak that flops over, stop.',
        },
        { text: 'Scoop half of the whipped cream into the pumpkin bowl and fold it in gently with the spoon until no white streaks are left. Keep the other half for the top.' },
        { text: 'Spoon the pumpkin filling into the glasses over the crumbs, then add a swirl of the leftover whipped cream and a pinch of cinnamon on each.' },
        { text: 'Chill the cups in the fridge so the filling sets.', timerMinutes: 30 },
        { text: 'Taste test! Before the first spoonful, say one thing you are thankful for.' },
      ],
      tip: 'Leftover pumpkin purée freezes well in a bag. The cups keep in the fridge for two days.',
    },
    {
      id: 'cornbread-muffins',
      title: 'Cornbread Muffins',
      emoji: '🧁',
      blurb: 'Golden, slightly sweet muffins made with cornmeal, a Thanksgiving table classic. One bowl, a jug, and fifteen minutes in the oven. Makes 12.',
      minutes: 40,
      serves: 12,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'egg', 'milk'],
      swaps: [
        { avoid: 'wheat', use: 'a gluten-free flour blend in place of the all-purpose flour' },
        { avoid: 'gluten', use: 'a gluten-free flour blend in place of the all-purpose flour' },
        { avoid: 'egg', use: '2 tablespoons ground flaxseed stirred into 6 tablespoons water, left for 5 minutes' },
        { avoid: 'milk', use: 'oat or soy milk' },
      ],
      equipment: ['12-hole muffin tin', '12 paper muffin cases', 'Large mixing bowl', 'Measuring jug', 'Whisk', 'Ice-cream scoop or big spoon', 'Toothpick', 'Wire rack'],
      ingredients: [
        { item: 'Yellow cornmeal', us: { qty: 1, unit: 'cup' }, metric: { qty: 160, unit: 'g' }, note: 'fine or medium grind (polenta works)' },
        { item: 'All-purpose (plain) flour', us: { qty: 1, unit: 'cup' }, metric: { qty: 125, unit: 'g' }, allergens: ['wheat', 'gluten'] },
        { item: 'Sugar', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 50, unit: 'g' } },
        { item: 'Baking powder', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 1, unit: 'tbsp' } },
        { item: 'Salt', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 0.5, unit: 'tsp' } },
        { item: 'Eggs', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, allergens: ['egg'] },
        { item: 'Milk', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Vegetable oil', us: { qty: 0.33, unit: 'cup' }, metric: { qty: 80, unit: 'ml' } },
        { item: 'Sweetcorn kernels', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' }, note: 'canned and drained, or frozen and thawed', optional: true },
        { item: 'Butter', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'to serve', optional: true, allergens: ['milk'] },
      ],
      steps: [
        {
          text: 'A grown-up heats the oven to 400°F / 200°C. Put a paper case in every hole of the muffin tin.',
          adult: true,
          hazards: ['heat'],
        },
        { text: 'Put the cornmeal, flour, sugar, baking powder and salt in the big bowl and whisk them together so there are no lumps.' },
        {
          text: 'Crack the eggs into the jug, then add the milk and oil and whisk until it is all one yellow colour.',
          hazards: ['raw-egg'],
          tip: 'Crack each egg into a cup first, so any bits of shell are easy to fish out. Wash your hands after touching raw egg.',
        },
        {
          text: 'Pour the jug into the bowl and stir just until no dry streaks are left. Lumps are fine.',
          tip: 'Over-mixing makes tough muffins. Twelve stirs is usually enough.',
        },
        { text: 'If you are using sweetcorn, stir it in now.' },
        { text: 'Scoop the batter into the cases so each one is about two-thirds full.' },
        {
          text: 'Bake until the tops are golden and a toothpick poked into the middle comes out clean, about 15 to 18 minutes.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 17,
        },
        {
          text: 'A grown-up lifts the tin out and lets the muffins cool in it for 5 minutes before moving them to the rack.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 5,
        },
        { text: 'Taste test! Split one open while it is warm and let a pat of butter melt in. Honey on top is lovely too (no honey for babies under 1).' },
      ],
      tip: 'Cornbread was a staple food for many Native American peoples long before the settlers arrived; they taught newcomers to grow and grind corn. The muffins freeze well for a month.',
    },
  ],

  crafts: [
    {
      id: 'hand-turkey-thank-you-cards',
      title: 'Hand-Turkey Thank-You Cards',
      emoji: '🦃',
      blurb: 'Trace your hand, turn the thumb into a turkey head and the fingers into tail feathers, then write one thing you are thankful for on every feather. Give it to someone at dinner.',
      minutes: 25,
      mess: 1,
      adultHelp: 'some',
      hazards: ['small-parts'],
      materials: [
        { item: 'Card or thick paper', qty: '1 sheet per card', substitute: 'the plain back of a cereal box' },
        { item: 'Pencil' },
        { item: 'Markers or crayons', qty: 'red, orange, yellow, brown and green' },
        { item: 'Googly eyes', qty: '1 per turkey', optional: true, substitute: 'draw the eye on' },
        { item: 'Glue stick', optional: true },
      ],
      steps: [
        { text: 'Fold the sheet in half to make a card. Keep the fold on the left, like a book.' },
        { text: 'Lay one hand flat on the front of the card with your fingers spread wide, and trace around it with the pencil. Ask someone to help if your pencil hand gets stuck.' },
        { text: 'The thumb is the turkey head. Draw an orange triangle beak on the side, and a red wobbly wattle hanging under the beak.' },
        { text: 'The four fingers are tail feathers. Colour each one a different autumn colour: red, orange, yellow and brown.' },
        { text: 'On each feather, write or draw one thing you are thankful for. A grown-up can write the words if you say them.', tip: 'Big or small both count: a pet, a friend, pancakes, a warm bed.' },
        { text: 'Colour the palm brown for the body and draw two skinny legs with three toes each underneath.' },
        {
          text: 'Stick on a googly eye if you have one, or draw a big round eye with a dot in the middle.',
          hazards: ['small-parts'],
          tip: 'Googly eyes are a choking hazard for children under three, so a grown-up looks after the pot.',
        },
        { text: "Open the card and write inside: 'Thank you for...' and who it is for, then sign your name. Put it on their plate before dinner." },
      ],
      learn: 'Tracing round a spread-out hand builds a steady pencil grip, and a real male turkey fans out his tail feathers just like your fingers.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'craft', text: 'Start a thankful chain: write one thing you are thankful for on a paper strip, loop it and tape it, then add a new link every day until Thanksgiving.' },
    { sleeps: 11, kind: 'fact', text: 'Many Native American nations grow corn, beans and squash together, called the Three Sisters: the corn holds up the beans, and the squash leaves shade the soil.' },
    { sleeps: 10, kind: 'joke', text: 'Why did the turkey join the band? It already had the drumsticks!' },
    { sleeps: 9, kind: 'colour', text: 'Autumn colours at the ready! The Thanksgiving colouring page is full of leaves, pies and a very proud turkey. Open the colouring page!' },
    { sleeps: 8, kind: 'fact', text: 'Most farm turkeys are too heavy to fly, but wild turkeys can fly fast in short bursts, and at night they fly up into trees to sleep.' },
    { sleeps: 7, kind: 'say', text: 'Learn to say happy Thanksgiving in Spanish!', greeting: 1 },
    { sleeps: 6, kind: 'fact', text: 'It is mostly the male turkeys that gobble! The females make softer clucks, purrs and yelps instead.' },
    { sleeps: 5, kind: 'joke', text: 'What is the best thing to put into a pumpkin pie? Your fork!' },
    { sleeps: 4, kind: 'seek', text: 'Some things are hiding in the Thanksgiving picture. Can you find them all? Open Seek & Find!' },
    { sleeps: 3, kind: 'fact', text: 'A wishbone is really two little collarbones joined together. Pulling it with someone and making a wish is a custom that is hundreds of years old.' },
    { sleeps: 2, kind: 'say', text: 'Learn to say happy Thanksgiving in French, the way people say it in Quebec!', greeting: 2 },
    { sleeps: 1, kind: 'craft', text: "One more sleep! Fold small pieces of card in half, write each guest's name on one and draw a leaf: place cards for the big table." },
  ],

  parentNote:
    'In the US, Thanksgiving is the fourth Thursday of November and a federal holiday; most schools also close the Friday. In Canada it is the second Monday of October, a statutory holiday in most provinces, and this app shows the Canadian date when your region is set to Canada. For many Native Americans the day carries a different meaning: since 1970, a National Day of Mourning has been held at Plymouth on Thanksgiving to remember the loss of land, lives and culture that followed the colonists’ arrival, and November is Native American Heritage Month. The pie cups are no-cook; the muffins need an oven and involve raw egg. The muffin serving idea mentions honey, and graham crackers usually contain it; honey is not safe for babies under 1.',
  sources: [
    'Encyclopaedia Britannica, "Thanksgiving Day"',
    'National Archives (US), "Thanksgiving Proclamation" (Abraham Lincoln, 3 October 1863)',
    'The Canadian Encyclopedia, "Thanksgiving in Canada"',
    'Plimoth Patuxet Museums, "Thanksgiving History"',
  ],
};

export default thanksgiving;
