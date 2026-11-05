import type { HolidayContent } from '../types';

const easter: HolidayContent = {
  story: [
    'Easter is the most important festival of the Christian year: Christians remember that Jesus died on a cross on Good Friday and believe that he rose from the dead on Easter Sunday.',
    'It comes in spring, and its date moves every year, because it follows the first full moon of spring and can land anywhere from late March to late April.',
    'Many families, whether or not they go to church, decorate eggs, hunt for hidden eggs and share chocolate ones, because an egg is an old sign of new life.',
    'In many countries a bunny or a hare is said to bring the eggs; in parts of Switzerland the story says a cuckoo brings them, and in France it is church bells flying home from Rome.',
    'Orthodox Christians in countries like Greece and Russia often celebrate Easter on a different Sunday, because they count the date on an older calendar.',
  ],

  facts: [
    {
      text: 'The rule for finding Easter is about 1,700 years old: it is the first Sunday after the first full moon on or after 21 March. The earliest it can ever be is 22 March and the latest is 25 April. The next 25 April Easter is in 2038.',
      bigKids: true,
    },
    {
      text: 'The tallest chocolate egg ever made stood more than 10 metres (34 feet) high, as tall as a three-storey house, and weighed over 7 tonnes. It was built in Italy in 2011.',
      wow: true,
    },
    {
      text: "In many languages Easter's name comes from Pesach, the Hebrew name for Passover: it is Pascua in Spanish, Pâques in French and Pascha in Greek. The Bible describes the last meal Jesus shared with his friends as a Passover meal.",
    },
    {
      text: 'Since 1878, children have rolled eggs across the lawn of the White House in Washington on Easter Monday, pushing them along with long-handled spoons. The first roll was held because kids had been chased off the lawn of the Capitol building and the president said they could use his garden instead.',
    },
    {
      text: 'Greek families dye their Easter eggs deep red and play a tapping game called tsougrisma: two people knock the ends of their eggs together, and the one whose egg does not crack is said to get good luck for the year.',
    },
    {
      text: 'In Australia some families have an Easter Bilby instead of a bunny. Rabbits are not native there and damage the land, so some shops sell chocolate bilbies instead (a bilby is a small animal with very big ears), and part of the money goes to protect the real ones.',
    },
  ],

  greetings: [
    {
      lang: 'el',
      langName: 'Greek',
      text: 'Καλό Πάσχα',
      roman: 'Kalo Pascha',
      sayIt: 'kah-LOH PAHS-khah',
      meaning: 'Happy Easter (said in the days before Easter)',
    },
    {
      lang: 'el',
      langName: 'Greek',
      text: 'Χριστός Ανέστη',
      roman: 'Christos Anesti',
      sayIt: 'khree-STOHS ah-NEH-stee',
      meaning: "Christ is risen. On Easter Day the reply is 'Alithos Anesti', 'Truly he is risen'",
    },
    {
      lang: 'es',
      langName: 'Spanish',
      text: '¡Felices Pascuas!',
      sayIt: 'feh-LEE-sess PAHS-kwahs',
      meaning: 'Happy Easter (the Spanish word is plural, as if wishing many happy Easters)',
    },
    {
      lang: 'pl',
      langName: 'Polish',
      text: 'Wesołych Świąt Wielkanocnych!',
      sayIt: 'veh-SOH-wikh SHVYONT vyel-kah-NOTS-nikh',
      meaning: 'Happy Easter holidays',
    },
    {
      lang: 'pl',
      langName: 'Polish',
      text: 'Wesołego Alleluja!',
      sayIt: 'veh-soh-WEH-goh ah-leh-LOO-yah',
      meaning: "A joyful Alleluia (a shorter Polish Easter wish)",
    },
    {
      lang: 'de',
      langName: 'German',
      text: 'Frohe Ostern!',
      sayIt: 'FROH-uh OHS-tern',
      meaning: 'Happy Easter',
    },
  ],

  recipes: [
    {
      id: 'bunny-fruit-pizza',
      title: 'Bunny Fruit Pizza',
      emoji: '🐰',
      blurb: 'A round cookie, a cloud of creamy topping, and banana ears, a strawberry nose and blueberry eyes: every child builds their own bunny face. Makes 8.',
      minutes: 25,
      serves: 8,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['wheat', 'gluten', 'milk'],
      mayContain: ['egg', 'soy'],
      swaps: [
        { avoid: 'wheat', use: 'large gluten-free cookies or plain rice cakes' },
        { avoid: 'gluten', use: 'large gluten-free cookies or plain rice cakes' },
        { avoid: 'milk', use: 'dairy-free cream cheese and coconut yogurt' },
      ],
      equipment: ['Mixing bowl', 'Fork', 'Spoon', 'Butter knife', 'Large tray or 8 plates'],
      ingredients: [
        { item: 'Large round cookies', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' }, note: 'soft sugar cookies or shortbread rounds about 3 inches / 8 cm across', allergens: ['wheat', 'gluten'] },
        { item: 'Cream cheese', us: { qty: 4, unit: 'oz' }, metric: { qty: 110, unit: 'g' }, note: 'softened', allergens: ['milk'] },
        { item: 'Greek yogurt', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 60, unit: 'g' }, allergens: ['milk'] },
        { item: 'Powdered sugar', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' } },
        { item: 'Vanilla extract', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 0.5, unit: 'tsp' } },
        { item: 'Bananas', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' }, note: 'for the ears' },
        { item: 'Strawberries', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' }, note: 'for the noses' },
        { item: 'Blueberries', us: { qty: 16, unit: 'piece' }, metric: { qty: 16, unit: 'piece' }, note: 'for the eyes' },
        { item: 'Thin pretzel sticks', us: { qty: 48, unit: 'piece' }, metric: { qty: 48, unit: 'piece' }, note: 'for whiskers', optional: true, allergens: ['wheat', 'gluten'] },
        { item: 'Shredded coconut', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 10, unit: 'g' }, note: 'for fluffy fur', optional: true },
      ],
      steps: [
        { text: 'Put the cream cheese, yogurt, powdered sugar and vanilla in the bowl and mash with a fork until smooth and fluffy. This is the bunny fur.' },
        { text: 'Lay the cookies out on the tray, flat side up, one for each bunny.' },
        { text: 'Spread a big spoonful of topping over each cookie, right out to the edge, so the whole face is white.' },
        {
          text: 'Peel the bananas. Cut each one in half across, then cut each half the long way with a butter knife to make long ear shapes. You need two ears per bunny.',
          kidSafeOverride: 'A butter knife on a soft banana; the peel comes off by hand.',
        },
        {
          text: 'A grown-up cuts the strawberries in half to make eight little noses.',
          adult: true,
          hazards: ['sharp'],
        },
        { text: 'Press two banana ears onto the top of each face, a strawberry nose in the middle and two blueberry eyes above it.' },
        {
          text: 'Add whiskers, three pretzel sticks on each side of the nose, and sprinkle a pinch of coconut around the edge for fluffy fur.',
          tip: 'Pile the whiskers on the plate instead if the pretzels keep sliding off.',
        },
        { text: 'Taste test! Which goes first, the ears or the nose?' },
      ],
      tip: 'Build the bunnies just before eating so the banana stays golden. Any fruit works: try a raspberry nose or a kiwi bow tie.',
    },
    {
      id: 'chocolate-cornflake-nests',
      title: 'Chocolate Cornflake Nests',
      emoji: '🪺',
      blurb: 'Crunchy cornflakes stirred through melted chocolate, pressed into little nests and filled with mini eggs: the classic Easter treat, and the only cooking is melting. Makes 12.',
      minutes: 90,
      serves: 12,
      difficulty: 1,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['milk', 'soy', 'gluten'],
      mayContain: ['wheat', 'tree-nut'],
      swaps: [
        { avoid: 'milk', use: 'dairy-free dark chocolate and dairy-free spread' },
        { avoid: 'gluten', use: 'gluten-free cornflakes (ordinary ones contain barley malt)' },
        { avoid: 'soy', use: 'chocolate made without soy lecithin' },
      ],
      chokingNote: 'Sugar-shelled mini eggs are small and hard: a choking hazard for children under 4. Give little ones a nest with soft chocolate buttons instead, or no eggs at all.',
      equipment: ['12-hole muffin tin', '12 paper muffin cases', 'Microwave-safe bowl', 'Spatula or wooden spoon', 'Teaspoon'],
      ingredients: [
        { item: 'Milk chocolate', us: { qty: 7, unit: 'oz' }, metric: { qty: 200, unit: 'g' }, note: 'broken into pieces', allergens: ['milk', 'soy'] },
        { item: 'Butter', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 15, unit: 'g' }, allergens: ['milk'] },
        { item: 'Golden syrup', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'ml' }, note: 'or honey (no honey for babies under 1)' },
        { item: 'Cornflakes', us: { qty: 3.5, unit: 'cup' }, metric: { qty: 100, unit: 'g' }, allergens: ['gluten'] },
        { item: 'Mini chocolate eggs', us: { qty: 36, unit: 'piece' }, metric: { qty: 36, unit: 'piece' }, note: 'three per nest', allergens: ['milk', 'soy'] },
      ],
      steps: [
        { text: 'Put a paper case into each hole of the muffin tin. Count them: twelve nests.' },
        {
          text: 'Break the chocolate into the microwave-safe bowl and add the butter and golden syrup.',
          kidSafeOverride: 'The bowl is only being filled here; nothing is switched on.',
        },
        {
          text: 'A grown-up heats the bowl in the microwave for 30 seconds, stirs, and repeats until the chocolate is just melted and glossy, about two minutes in all.',
          adult: true,
          hazards: ['electric', 'heat'],
          timerMinutes: 2,
          tip: 'Short bursts and lots of stirring: chocolate burns easily.',
        },
        {
          text: 'Let the bowl cool until it is warm, not hot, to the touch.',
          timerMinutes: 2,
        },
        { text: 'Tip in the cornflakes and fold them through with the spatula until every flake is shiny and brown.' },
        { text: 'Spoon the mixture into the paper cases. Press the back of a teaspoon into the middle of each one to make a dip, like a real nest.' },
        { text: 'Sit three mini eggs in every nest while the chocolate is still soft.' },
        { text: 'Chill the nests in the fridge until the chocolate sets hard.', timerMinutes: 60 },
        { text: 'Taste test! Then hide a few nests around the house for an egg hunt that eats itself.' },
      ],
      tip: 'Swap the cornflakes for puffed rice or crushed shredded wheat biscuits; both make good nests. The nests keep for a week in a tin.',
    },
  ],

  crafts: [
    {
      id: 'natural-dye-eggs',
      title: 'Natural-Dye Eggs',
      emoji: '🥚',
      blurb: 'Red cabbage makes blue, onion skins make orange, turmeric makes yellow: dye real eggs with things from the kitchen and see the colours surprise you. A grown-up does the stove work.',
      minutes: 120,
      mess: 2,
      adultHelp: 'needed',
      hazards: ['heat', 'hot-liquid'],
      materials: [
        { item: 'White eggs', qty: '6 to 12', substitute: 'brown eggs give deeper, earthier colours' },
        { item: 'Red cabbage', qty: 'a quarter of a head, torn into pieces (makes blue)' },
        { item: 'Yellow onion skins', qty: 'the papery skins of 5 or 6 onions (makes orange)' },
        { item: 'Ground turmeric', qty: '2 tablespoons (makes yellow)' },
        { item: 'Beetroot', qty: '1, grated by a grown-up (makes pink)', optional: true },
        { item: 'Old tights or a thin sock, cut into pieces', qty: 'one per patterned egg', optional: true, substitute: 'rubber bands on their own' },
        { item: 'Cooking oil', qty: 'a few drops, for shine', optional: true },
        { item: 'White vinegar', qty: '1 tablespoon per jar' },
        { item: 'Saucepans', qty: 'one per colour' },
        { item: 'Jars or mugs', qty: 'one per colour' },
        { item: 'Sieve and a slotted spoon' },
        { item: 'Rubber bands and small leaves', qty: 'a few', optional: true },
        { item: 'Empty egg carton, for drying' },
        { item: 'Old newspaper or a tray, to catch drips' },
      ],
      steps: [
        {
          text: 'A grown-up puts the eggs in a pan, covers them with cold water, brings it to the boil, then lets them cook for 10 minutes before cooling them in cold water.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 10,
        },
        {
          text: 'Get the dyes ready: tear the cabbage into pieces, peel the papery skins off the onions, measure out the turmeric, and add the grated beetroot if you have it. Each goes in its own pan.',
          kidSafeOverride: 'Peeling dry onion skins by hand; the stove is off.',
        },
        {
          text: 'A grown-up adds 2 cups (480 ml) of water to each pan and simmers them on the stove for 20 minutes, until the water is deeply coloured.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 20,
        },
        {
          text: 'A grown-up strains each dye into its own jar and leaves it to cool to room temperature.',
          adult: true,
          hazards: ['hot-liquid'],
          timerMinutes: 20,
        },
        { text: 'Stir a tablespoon of vinegar into every jar. The vinegar helps the colour stick to the shell.' },
        {
          text: 'For patterns, wrap rubber bands around an egg, or press a small leaf flat against it and hold it there with a piece of old tights tied tight. Where the dye cannot reach stays white.',
        },
        {
          text: 'Lower the eggs into the cool dye with a spoon. Leave them for 30 minutes for soft colours, or put the jars in the fridge overnight for deep ones.',
          timerMinutes: 30,
          tip: 'Peek, but do not poke: the colour is fragile until the egg dries.',
        },
        { text: 'Lift the eggs out, set them in the egg carton to dry, then rub each one with a drop of cooking oil for a shine.' },
        { text: 'Line them all up and guess which dye made which egg. The purple cabbage water making a blue egg surprises almost everyone.' },
      ],
      learn: 'Red cabbage holds a pigment called anthocyanin that changes colour depending on how acidic things are: purple in the pot, blue on the eggshell. People have dyed Easter eggs with onion skins for hundreds of years, long before shop dyes existed. The eggs are safe to eat if they stay in the fridge; eggs left out for more than two hours are for looking at only.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'Not all eggs are white or brown! Some kinds of hen, like the Araucana, lay eggs with blue or green shells.' },
    { sleeps: 11, kind: 'joke', text: 'Why did the Easter egg hide? It was a little bit chicken!' },
    { sleeps: 10, kind: 'craft', text: 'Sprinkle cress seeds on damp cotton wool in an empty eggshell or egg-box cup and draw a face on the side. By Easter it has green hair!' },
    { sleeps: 9, kind: 'colour', text: 'Pastel crayons ready? The Easter colouring page is full of eggs, flowers and spring animals. Open the colouring page!' },
    { sleeps: 8, kind: 'joke', text: 'How does the Easter Bunny keep its fur so neat? With a hare brush!' },
    { sleeps: 7, kind: 'say', text: 'Learn the Greek wish people say in the days before Easter!', greeting: 0 },
    { sleeps: 6, kind: 'fact', text: 'In Ukraine, pysanky are eggs decorated with beeswax and dye. The wax keeps each colour in place, so the patterns build up layer by layer.' },
    { sleeps: 5, kind: 'fact', text: 'In Sweden some children dress up as Easter witches, with headscarves and painted rosy cheeks, and go door to door swapping drawings for sweets. In Finland, little witches bring decorated willow twigs instead.' },
    { sleeps: 4, kind: 'seek', text: 'Hidden things are tucked away in the Easter picture, just like eggs in a garden. Can you find them? Open Seek & Find!' },
    { sleeps: 3, kind: 'craft', text: 'Make bunny ears: tape a strip of paper into a headband, tear two long ear shapes from paper, colour the middles pink and tape them on.' },
    { sleeps: 2, kind: 'fact', text: 'In Britain, Ireland, Australia and New Zealand, many families eat hot cross buns around Good Friday: soft spiced buns with a cross on top.' },
    { sleeps: 1, kind: 'say', text: 'Easter is tomorrow! In Poland many families take baskets of eggs, bread and salt to church today to be blessed. Learn the Polish Easter wish!', greeting: 3 },
  ],

  parentNote:
    'Easter Sunday is the first Sunday after the first full moon on or after 21 March, so it falls between 22 March and 25 April. Orthodox Easter is worked out on the older Julian calendar and usually lands one to five weeks later, though some years, like 2025, the two coincide; this app lists it separately. Good Friday, Easter Monday or both are public holidays in many countries (the UK, Ireland, Australia, Canada and much of Europe) but not in the US. The recipes use sugar-shelled mini eggs, which are a choking hazard under 4, and the egg craft needs a grown-up at the stove.',
  sources: [
    'Encyclopaedia Britannica, "Easter"',
    'US Naval Observatory, Astronomical Applications Department, "The Date of Easter"',
    'White House Historical Association, "The White House Easter Egg Roll"',
    'Guinness World Records, "Tallest chocolate Easter egg" (Tosca, Italy, 2011)',
  ],
};

export default easter;
