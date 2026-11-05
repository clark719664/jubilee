import type { HolidayContent } from '../types';

/**
 * Juneteenth — tier 1. A joyful holiday with a serious history: keep the facts accurate (June 19, 1865, Galveston;
 * federal holiday since 2021) and the tone celebratory. Shape follows ../_template.ts.
 */
const juneteenth: HolidayContent = {
  story: [
    'Juneteenth is the day many Americans celebrate the end of slavery in the United States.',
    'On June 19, 1865, Union soldiers led by General Gordon Granger arrived in Galveston, Texas, and announced that every enslaved person in the state was free.',
    "The news came two and a half years after President Lincoln's Emancipation Proclamation, so Juneteenth is really about freedom finally reaching everyone.",
    'Today many families celebrate with parades, music, cook-outs and red foods such as strawberry soda and red velvet cake, and take time to learn the stories of the people who fought for freedom.',
    'Since 2021 it has been a federal holiday across the whole country.',
  ],

  facts: [
    {
      text: 'The name is a mash-up of June and nineteenth, the date in 1865 when freedom was announced in Texas.',
      wow: true,
    },
    {
      text: "President Lincoln's Emancipation Proclamation took effect on January 1, 1863, but there were almost no Union soldiers in Texas to enforce it, so it was June 19, 1865 before freedom was announced there: about 900 days later.",
      bigKids: true,
    },
    {
      text: 'Red foods are a Juneteenth tradition: red soda, strawberries, watermelon and red velvet cake. Many families say the color stands for the strength and sacrifice of the people who came before them.',
    },
    {
      text: 'In 1872 a group of formerly enslaved people in Houston pooled 800 dollars to buy ten acres of land for Juneteenth celebrations. They called it Emancipation Park, and it is still a park today.',
      wow: true,
    },
    {
      text: 'Texas made Juneteenth a state holiday in 1980, and in 2021 it became a federal holiday, the first new one since Martin Luther King Jr. Day in 1983.',
      bigKids: true,
    },
    {
      text: 'The Juneteenth flag, designed in 1997, has a bursting star in the middle: the star is for Texas and for every freed person, and the burst around it stands for a new beginning.',
    },
  ],

  greetings: [
    { lang: 'en', langName: 'English', text: 'Happy Juneteenth!', sayIt: 'HAP-ee joon-TEENTH', meaning: 'Happy Juneteenth!' },
    { lang: 'en', langName: 'English', text: 'Happy Freedom Day!', sayIt: 'HAP-ee FREE-dum DAY', meaning: 'Happy Freedom Day! (another name for Juneteenth)' },
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Juneteenth!', sayIt: 'feh-LEES joon-TEENTH', meaning: "Happy Juneteenth! (Spanish speakers in the US keep the holiday's English name)" },
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Día de la Emancipación!', sayIt: 'feh-LEES DEE-ah deh lah eh-mahn-see-pah-SYOHN', meaning: 'Happy Emancipation Day! (the name Spanish-language news in the US gives Juneteenth)' },
  ],

  recipes: [
    {
      id: 'strawberry-soda-floats',
      title: 'Strawberry Soda Floats',
      emoji: '🍓',
      blurb: 'Pink fizz climbing over scoops of vanilla ice cream: the classic red Juneteenth drink turned into pudding.',
      minutes: 15,
      serves: 4,
      difficulty: 1,
      adultHelp: 'none',
      noHeat: true,
      allergens: ['milk'],
      swaps: [{ avoid: 'milk', use: 'dairy-free vanilla ice cream and skip the whipped cream' }],
      equipment: ['4 tall glasses', 'Ice cream scoop', 'Fork', 'Long spoons and straws'],
      ingredients: [
        { item: 'Strawberry soda', us: { qty: 3, unit: 'cup' }, metric: { qty: 720, unit: 'ml' }, note: 'chilled' },
        { item: 'Vanilla ice cream', us: { qty: 2, unit: 'cup' }, metric: { qty: 500, unit: 'ml' }, allergens: ['milk'] },
        { item: 'Strawberries', us: { qty: 12, unit: 'piece' }, metric: { qty: 12, unit: 'piece' } },
        { item: 'Whipped cream', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' }, optional: true, allergens: ['milk'] },
      ],
      steps: [
        { text: 'Put the four glasses in the freezer for 10 minutes so they go frosty.', timerMinutes: 10 },
        { text: 'Pull the green tops off the strawberries with your fingers and squash two into the bottom of each glass with the fork.' },
        { text: 'Add two scoops of vanilla ice cream to each glass.' },
        {
          text: 'Tilt a glass and pour in the strawberry soda very slowly, watching the pink foam climb up the side.',
          tip: 'Pour slowly or the foam races over the top: that is the fizz grabbing the ice cream.',
        },
        { text: 'Top each float with a swirl of whipped cream and a whole strawberry.' },
        { text: 'Taste test! Spoon first for the foam, straw second for the pink soda underneath.' },
      ],
      tip: 'Red drinks have been part of Juneteenth tables for well over a hundred years.',
    },
    {
      id: 'red-velvet-cupcakes',
      title: 'Red Velvet Cupcakes',
      emoji: '🧁',
      blurb: 'Twelve bright red cupcakes with a whisper of cocoa and a cloud of cream-cheese frosting on top.',
      minutes: 70,
      serves: 12,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'egg', 'milk'],
      swaps: [
        { avoid: 'milk', use: 'plant milk with 1 tsp vinegar stirred in, a dairy-free spread, and dairy-free cream cheese for the frosting' },
        { avoid: 'wheat', use: 'a gluten-free flour blend with a pinch of xanthan gum' },
      ],
      equipment: ['12-cup muffin pan', '12 paper liners', 'Big mixing bowl', 'Measuring jug', 'Whisk', 'Spoon', 'Wire rack', 'Oven gloves'],
      ingredients: [
        { item: 'All-purpose flour', us: { qty: 1.25, unit: 'cup' }, metric: { qty: 160, unit: 'g' }, allergens: ['wheat', 'gluten'] },
        { item: 'Sugar', us: { qty: 0.75, unit: 'cup' }, metric: { qty: 150, unit: 'g' } },
        { item: 'Cocoa powder', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 8, unit: 'g' } },
        { item: 'Baking soda', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 2.5, unit: 'ml' } },
        { item: 'Salt', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' } },
        { item: 'Buttermilk', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 120, unit: 'ml' }, note: 'or milk with 1 tsp vinegar stirred in', allergens: ['milk'] },
        { item: 'Vegetable oil', us: { qty: 0.33, unit: 'cup' }, metric: { qty: 80, unit: 'ml' } },
        { item: 'Egg', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, allergens: ['egg'] },
        { item: 'White vinegar', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' } },
        { item: 'Vanilla extract', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' } },
        { item: 'Red food coloring', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'ml' }, note: 'liquid; use 1 tsp if it is gel' },
        { item: 'Cream cheese', us: { qty: 4, unit: 'oz' }, metric: { qty: 115, unit: 'g' }, note: 'softened, for the frosting', allergens: ['milk'] },
        { item: 'Butter', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'g' }, note: 'softened, for the frosting', allergens: ['milk'] },
        { item: 'Powdered sugar', us: { qty: 1, unit: 'cup' }, metric: { qty: 120, unit: 'g' } },
        { item: 'Red sprinkles', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 10, unit: 'g' }, optional: true },
      ],
      steps: [
        { text: 'A grown-up heats the oven to 350°F / 180°C while you put a paper liner in every hole of the muffin pan.', adult: true, hazards: ['heat'] },
        { text: 'Whisk the flour, sugar, cocoa, baking soda and salt together in the big bowl.' },
        {
          text: 'In the jug, whisk the buttermilk, oil, egg, vinegar, vanilla and red food coloring until it is bright red all the way through.',
          tip: 'Wear an apron: red coloring loves white T-shirts.',
        },
        { text: 'Pour the red mixture into the flour bowl and stir gently just until there are no dry streaks left. A few lumps are fine.' },
        { text: 'Spoon the batter into the paper liners so each one is about two-thirds full.' },
        {
          text: 'A grown-up bakes the cupcakes for 18 minutes, until a toothpick poked into the middle comes out clean.',
          adult: true,
          hazards: ['heat'],
          timerMinutes: 18,
        },
        { text: 'Leave them in the tin for 5 minutes, then move them to the wire rack and wait 25 minutes until they are completely cold.', timerMinutes: 25, tip: 'Warm cupcakes melt frosting into a puddle.' },
        { text: 'Beat the cream cheese and butter together with the spoon until smooth, then beat in the powdered sugar and a drop of vanilla.' },
        { text: 'Swirl a spoonful of frosting onto every cold cupcake and shake on red sprinkles.' },
        { text: 'Taste test! Red velvet is a Juneteenth classic, so say who you are celebrating before the first bite.' },
      ],
    },
  ],

  crafts: [
    {
      id: 'freedom-star-banner',
      title: 'Freedom Star Banner',
      emoji: '⭐',
      blurb: 'A string of red, white and blue flags, each with a big star and one word that says what freedom means to you.',
      minutes: 40,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Red, white and blue card or paper', qty: '2 sheets of each', substitute: 'plain paper colored in with crayons' },
        { item: 'Scissors', substitute: 'ask a grown-up to pre-cut the flags and stars' },
        { item: 'String or ribbon', qty: 'about 2 m' },
        { item: 'Glue stick or sticky tape' },
        { item: 'Markers or crayons' },
        { item: 'Star stickers', optional: true, substitute: 'stars cut from the spare paper' },
      ],
      steps: [
        {
          text: 'Use scissors to cut the card into flags about the size of your hand, swapping colors as you go: red, white, blue, red, white, blue.',
          hazards: ['sharp'],
          tip: 'Fold a sheet in half and cut once to get two matching flags.',
        },
        {
          text: 'Draw a big star on each flag and color it in, or cut a star from a different color and glue it in the middle.',
          hazards: ['sharp'],
        },
        { text: 'Write one word on each flag: Freedom, Joy, Family, Hope, Juneteenth, 1865, or your own.' },
        { text: 'Lay the flags face down in a row, run the string along their top edges and tape or glue the edge down over it.' },
        { text: 'Hang the banner across a doorway or along a wall where everyone will see it.' },
      ],
      learn: 'The star on the Juneteenth flag stands for Texas, where the news arrived last, and for every person who was finally free.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'Juneteenth is celebrated in Mexico too. In the village of Nacimiento de los Negros, in Coahuila, the Mascogos, descendants of Black Seminoles who settled there in the 1850s, keep the holiday every year.' },
    { sleeps: 11, kind: 'joke', text: 'Why was the strawberry late to the Juneteenth picnic? It got stuck in a jam!' },
    { sleeps: 10, kind: 'craft', text: 'Tape red, white and blue ribbons or paper strips to a wooden spoon to make a parade streamer, then twirl it as you march.' },
    { sleeps: 9, kind: 'say', text: 'Learn how Spanish-speaking families in the US wish each other a happy Juneteenth!', greeting: 2 },
    { sleeps: 8, kind: 'fact', text: 'In the early years, families came to Juneteenth in their very best clothes for big all-day picnics with barbecue, baseball games, rodeos and fishing.' },
    { sleeps: 7, kind: 'color', text: 'Color in the Juneteenth page! Red, white and blue are the colors of the Juneteenth flag, but you can use any colors you like.' },
    { sleeps: 6, kind: 'joke', text: "Knock knock! Who's there? Lettuce. Lettuce who? Lettuce celebrate, it's Juneteenth!" },
    { sleeps: 5, kind: 'fact', text: 'Juneteenth brought freedom to Texas, but slavery did not end in every part of the United States until the 13th Amendment to the Constitution was ratified in December 1865.' },
    { sleeps: 4, kind: 'craft', text: 'Draw your own Juneteenth flag with a big bursting star in the middle, then add a picture of what freedom means to you.' },
    { sleeps: 3, kind: 'seek', text: 'Some sneaky things are hiding in the Juneteenth picture. Can you find every single one? Open Seek & Find!' },
    { sleeps: 2, kind: 'say', text: 'Learn the Spanish name for Juneteenth that you might hear on the news in the US!', greeting: 3 },
    { sleeps: 1, kind: 'fact', text: 'Tomorrow is Juneteenth! At 89, Opal Lee started walking from Texas toward Washington, DC, to ask for a national holiday, and in 2021, aged 94, she watched it become law.' },
  ],

  parentNote:
    'Juneteenth is a joyful holiday with a hard history. Younger children can hear "some people were forced to work for no pay and were not allowed to leave, and this is the day that ended"; older children may want to read General Order Number 3 together. When June 19 lands on a weekend, the federal day off moves to the nearest Friday or Monday.',

  sources: [
    "Library of Congress, 'Today in History: June 19' (Juneteenth)",
    "Smithsonian National Museum of African American History and Culture, 'The Historical Legacy of Juneteenth'",
    "Texas State Library and Archives Commission, 'Juneteenth' (General Order No. 3, 1865; state holiday, 1980)",
    "National Archives, 'Juneteenth National Independence Day Act', Public Law 117-17 (2021)",
    "Houston Parks and Recreation Department, 'Emancipation Park' (history, 1872)",
  ],
};

export default juneteenth;
