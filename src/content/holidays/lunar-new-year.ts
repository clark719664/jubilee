import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Lunar New Year is the biggest celebration of the year for many families in China, Vietnam, Korea and in communities all over the world.',
    'It is also called Chinese New Year or the Spring Festival, and it has its own names in other countries: Tết in Vietnam and Seollal in Korea.',
    'It begins on a new moon between late January and late February, and in China the festival lasts fifteen days, until the full moon and the Lantern Festival.',
    'Before the day, families clean the house from top to bottom to sweep out the old year, hang red decorations and travel a long way to be together for a huge New Year\'s Eve dinner.',
    'Each year is named after one of twelve animals, and children get lucky money: in red envelopes called hongbao in China and lì xì in Vietnam, and as sebaetdon in Korea after a New Year bow.',
  ],

  facts: [
    {
      text: 'The twelve zodiac animals go in order: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig. Each year takes the next animal, so your animal comes back when you turn twelve. A legend says the order came from a river race that the clever Rat won by riding on the Ox\'s back.',
      bigKids: true,
    },
    {
      text: 'In the weeks around the festival, billions of journeys are made across China by people traveling home to their families. It is the biggest yearly movement of people anywhere on Earth, and it has its own name: chunyun, the Spring Festival travel rush.',
      wow: true,
    },
    {
      text: 'Many families hang the character 福 (fú, "good luck") upside down on the door on purpose. The word for "upside down" sounds just like the word for "arrives", so an upside-down 福 says "luck arrives here".',
    },
    {
      text: 'Lucky foods are often word jokes. Fish is served because "fish" sounds like "plenty". Mandarin oranges are given in pairs because their name sounds like "gold" in Cantonese. Dumplings are shaped like old-fashioned gold ingots.',
    },
    {
      text: 'On New Year\'s Day many families put the brooms away, because sweeping might sweep the new luck straight out of the door. In Vietnam, the first visitor to step through the door in the new year is believed to set the family\'s luck, so some families choose that person carefully.',
    },
    {
      text: 'On Seollal morning in Korea, children in bright hanbok bow deeply to their grandparents, a bow called sebae, and people say that a bowl of tteokguk, rice-cake soup, is what makes you a year older.',
    },
  ],

  greetings: [
    {
      lang: 'zh-Hans',
      langName: 'Mandarin Chinese',
      text: '新年快乐',
      roman: 'Xinnian kuaile',
      sayIt: 'shin-NYEN kwye-LUH',
      meaning: 'Happy new year',
    },
    {
      lang: 'zh-Hans',
      langName: 'Mandarin Chinese',
      text: '恭喜发财',
      roman: 'Gongxi facai',
      sayIt: 'gong-SHEE fah-TSYE',
      meaning: 'Wishing you a prosperous year',
    },
    {
      lang: 'yue',
      langName: 'Cantonese',
      text: '恭喜發財',
      roman: 'Gung hei faat coi',
      sayIt: 'GOONG-hay faht-CHOY',
      meaning: 'Wishing you a prosperous year',
    },
    {
      lang: 'yue',
      langName: 'Cantonese',
      text: '新年快樂',
      roman: 'San nin faai lok',
      sayIt: 'sun-NEEN fye-LOK',
      meaning: 'Happy new year',
    },
    {
      lang: 'vi',
      langName: 'Vietnamese',
      text: 'Chúc mừng năm mới',
      sayIt: 'CHOOK moong nahm MUH-ee',
      meaning: 'Happy new year',
    },
    {
      lang: 'ko',
      langName: 'Korean',
      text: '새해 복 많이 받으세요',
      roman: 'Saehae bok mani badeuseyo',
      sayIt: 'seh-HEH bohk MAH-nee bah-duh-SEH-yo',
      meaning: 'May you receive lots of luck in the new year',
    },
  ],

  recipes: [
    {
      id: 'mandarin-lantern-fruit-cups',
      title: 'Mandarin "Lantern" Fruit Cups',
      emoji: '🍊',
      blurb: 'Clear cups wrapped in red paper, filled with glowing orange mandarin segments and ruby pomegranate seeds. They look like little lanterns on the table and taste like sunshine. Makes 4.',
      minutes: 20,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: [],
      equipment: ['4 clear cups or small glasses', 'Red paper and tape', 'Gold or yellow string', 'Large bowl of cold water', 'Wooden spoon', 'Small bowl', 'Cutting board and knife (grown-up)'],
      ingredients: [
        { item: 'Mandarins or clementines', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' } },
        { item: 'Pomegranate', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'or 1/2 cup (80 g) ready-to-eat pomegranate seeds' },
        { item: 'Blueberries', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' } },
        { item: 'Strawberries', us: { qty: 8, unit: 'piece' }, metric: { qty: 8, unit: 'piece' } },
        { item: 'Lime', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, optional: true },
        { item: 'Fresh mint leaves', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' }, optional: true },
      ],
      steps: [
        {
          text: 'Make the lanterns first: wrap a strip of red paper (torn, or pre-cut by a grown-up) round the middle of each cup and tape it. Tape a short gold tassel of string to the bottom of each cup.',
        },
        {
          text: 'Peel the mandarins with your thumbs, pull them into segments and pick off the white strings. Count the segments: eight is the luckiest number.',
          kidSafeOverride: 'mandarins are peeled by hand; no tools are used',
        },
        {
          text: 'A grown-up cuts the pomegranate in half across the middle.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Hold a pomegranate half cut-side down over the bowl of water and whack the back of it with the wooden spoon. The seeds pop out and sink; the white bits float, so you can scoop them off and pour the water away.',
          kidSafeOverride: 'the cutting is finished; this step only knocks seeds out with a spoon',
          tip: 'Pomegranate juice stains. Wear an apron or an old shirt.',
        },
        { text: 'Pull the green tops off the strawberries and tear each one in half with your fingers.' },
        { text: 'Fill each cup in layers like a lantern glowing from the inside: mandarin segments against the glass, then pomegranate seeds, then blueberries, then strawberries, and more mandarin on top.' },
        { text: 'Squeeze a little lime juice over the top of each cup and tuck in a mint leaf for a green flag.' },
        { text: 'Turn the big light down and line the cups up on the table so they glow like a row of lanterns.' },
        { text: 'Taste test! Eat your lantern one glowing segment at a time.' },
      ],
      tip: 'Mandarins are given in pairs at Lunar New Year because the word for them sounds like "gold" in Cantonese. Give a cup to someone you love.',
    },
    {
      id: 'lucky-dumplings',
      title: 'Lucky Dumplings',
      emoji: '🥟',
      blurb: 'Jiaozi, little pleated parcels shaped like old gold coins, are folded by the whole family on New Year\'s Eve in northern China. Kids mix the filling and fold; a grown-up does the chopping and the boiling. Makes about 30.',
      minutes: 60,
      serves: 4,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'soy', 'sesame'],
      swaps: [
        { avoid: 'wheat', use: 'gluten-free dumpling wrappers (rice-paper rounds fall apart when boiled)' },
        { avoid: 'gluten', use: 'gluten-free dumpling wrappers and tamari or coconut aminos instead of soy sauce' },
        { avoid: 'soy', use: 'coconut aminos instead of soy sauce, and pork rather than tofu in the filling' },
        { avoid: 'sesame', use: 'leave out the sesame oil; a little vegetable oil instead' },
      ],
      equipment: ['Large bowl', 'Cutting board and knife (grown-up)', 'Box grater (grown-up)', 'Small bowl of water', 'Teaspoon', 'Tray dusted with flour', 'Large pot', 'Slotted spoon', 'Serving plate', '2 small dipping bowls'],
      ingredients: [
        { item: 'Round dumpling wrappers', us: { qty: 30, unit: 'piece' }, metric: { qty: 30, unit: 'piece' }, note: 'from the freezer or chilled aisle; keep them under a damp cloth', allergens: ['wheat', 'gluten'] },
        { item: 'Ground pork', us: { qty: 8, unit: 'oz' }, metric: { qty: 225, unit: 'g' }, note: 'or crumbled firm tofu for a vegetarian version' },
        { item: 'Napa cabbage', us: { qty: 1.5, unit: 'cup' }, metric: { qty: 120, unit: 'g' }, note: 'finely chopped' },
        { item: 'Green onions', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, note: 'finely chopped' },
        { item: 'Fresh ginger', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, note: 'grated' },
        { item: 'Soy sauce', us: { qty: 1.5, unit: 'tbsp' }, metric: { qty: 22, unit: 'ml' }, note: 'plus extra for dipping', allergens: ['soy', 'wheat', 'gluten'] },
        { item: 'Toasted sesame oil', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' }, allergens: ['sesame'] },
        { item: 'Salt', us: { qty: 0.5, unit: 'tsp' }, metric: { qty: 2, unit: 'ml' } },
        { item: 'White or black pepper', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' } },
        { item: 'Rice vinegar', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 30, unit: 'ml' }, note: 'for dipping' },
      ],
      steps: [
        {
          text: 'A grown-up finely chops the cabbage and green onions and grates the ginger, and puts them in the big bowl.',
          adult: true,
          hazards: ['sharp'],
        },
        {
          text: 'Wash your hands. Add the pork, soy sauce, sesame oil, salt and pepper to the bowl and squish everything together with a spoon or clean hands until it is well mixed. Wash your hands again straight after.',
          tip: 'Raw meat stays in the bowl and off the table. Hands get washed before and after.',
        },
        { text: 'Lay a wrapper flat on your palm and put one teaspoon of filling in the middle. Not more, or it will burst.' },
        { text: 'Dip a finger in the water bowl and run it round the edge of the wrapper, then fold the wrapper in half over the filling to make a half-moon.' },
        {
          text: 'Pinch the edges shut tightly all the way round. For a fancy dumpling, make little pleats along one side as you pinch. Set each one on the floured tray.',
          tip: 'Make one special dumpling with a star-shaped pinch. Whoever finds it on their plate gets extra luck this year.',
        },
        {
          text: 'A grown-up brings a large pot of water to the boil and gently drops in half the dumplings. When they float to the top, add half a cup of cold water, and when they float again, cook 2 more minutes: about 8 minutes in total.',
          adult: true,
          hazards: ['heat', 'hot-liquid'],
          timerMinutes: 8,
        },
        {
          text: 'A grown-up lifts the dumplings out with the slotted spoon onto the plate, then cooks the second batch the same way.',
          adult: true,
          hazards: ['hot-liquid'],
          timerMinutes: 8,
        },
        { text: 'Mix 2 tablespoons soy sauce with the rice vinegar in the dipping bowls while the dumplings cool for a minute.' },
        {
          text: 'Taste test! Pick up a dumpling with a fork or chopsticks, dip, and bite carefully; the inside stays hot and juicy. Did you find the lucky one?',
          kidSafeOverride: 'Chopsticks are for eating; nothing is chopped in this step.',
        },
      ],
      tip: 'In northern China families fold dumplings together at midnight on New Year\'s Eve. The word jiaozi sounds like the words for "the moment the year changes".',
    },
  ],

  crafts: [
    {
      id: 'red-envelope-lanterns',
      title: 'Red Envelope Lanterns',
      emoji: '🧧',
      blurb: 'Turn red envelopes into a string of little lanterns to hang in the window. Red is the luckiest color of the year, and gold tassels make them shine.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Red envelopes (hongbao)', qty: '6', substitute: 'red paper cut into 3 by 6 inch (8 by 16 cm) rectangles' },
        { item: 'Scissors' },
        { item: 'Ruler' },
        { item: 'Pencil' },
        { item: 'Tape or a stapler' },
        { item: 'Gold or yellow string or yarn', qty: 'about 6 feet (2 m)' },
        { item: 'Gold marker or gold stickers', optional: true },
        { item: 'Hole punch', optional: true },
      ],
      steps: [
        {
          text: 'Decorate each envelope with a gold marker: draw the lucky character 福 (fú), your zodiac animal or a swirl of stars. The plain side will be the inside.',
          tip: 'Not sure how to write 福? Copy it slowly, stroke by stroke, from a picture: it means "good luck".',
        },
        { text: 'Fold one envelope in half the long way, decorated side out, and press the fold flat with your thumbnail.' },
        {
          text: 'Use the ruler and pencil to draw lines from the fold toward the open edge, about half an inch (1 cm) apart. Stop each line a thumb-width before the open edge.',
        },
        {
          text: 'Cut along each line from the fold, stopping where the line stops, so the envelope stays in one piece.',
          hazards: ['sharp'],
          kidSafeOverride: 'safety scissors on paper; a grown-up helps younger children',
        },
        { text: 'Unfold the envelope and gently bend it round so the two short ends meet. Tape or staple the ends together at the top and the bottom.' },
        { text: 'Push the top and bottom of the tube toward each other so the strips puff out into a round lantern shape.' },
        {
          text: 'Cut a short piece of string for a tassel, tape it inside the bottom of the lantern, and tape a loop of string to the top for hanging.',
          hazards: ['sharp'],
          kidSafeOverride: 'safety scissors on string; a grown-up helps younger children',
        },
        { text: 'Make five more lanterns, then thread all the loops onto the long string, space them out, and hang the string across a window or doorway.' },
      ],
      learn: 'Red envelopes carry lucky money from grown-ups to children at Lunar New Year. The amount matters less than the color: red frightens away bad luck. In Vietnam the envelopes are called lì xì, and in Korea Seollal money comes in a pretty pouch or a white envelope after the sebae bow.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: 'A legend says a monster called Nian came out at New Year, but it was scared of the color red, bright lights and loud noises. That is one reason red is everywhere!' },
    { sleeps: 11, kind: 'joke', text: "Why are dumplings so good at keeping secrets? They keep everything folded up inside!" },
    { sleeps: 10, kind: 'color', text: 'Red and gold crayons ready? The Lunar New Year coloring page is waiting for you. Open the coloring page!' },
    { sleeps: 9, kind: 'fact', text: 'Many families hang spring couplets beside the front door: a pair of lucky lines of poetry written in black or gold on long strips of red paper.' },
    { sleeps: 8, kind: 'craft', text: 'Fold a sheet of red paper back and forth into a zigzag fan, then decorate it with gold or yellow swirls.' },
    { sleeps: 7, kind: 'say', text: 'Learn to say happy new year in Vietnamese, ready for Tết!', greeting: 4 },
    { sleeps: 6, kind: 'fact', text: 'For Tết, families in northern Vietnam fill their homes with pink peach blossom, while families in the south choose bright yellow apricot blossom.' },
    { sleeps: 5, kind: 'joke', text: 'Why did the mandarin orange win the New Year talent show? It had real ap-peel!' },
    { sleeps: 4, kind: 'seek', text: 'The Lunar New Year picture has hidden things tucked in among the lanterns. Can you find them? Open Seek & Find!' },
    { sleeps: 3, kind: 'fact', text: 'In a lion dance, two dancers share one lion: one works the head, making the eyes blink and the mouth snap, and the other is the back legs and the tail.' },
    { sleeps: 2, kind: 'craft', text: "Write the character 福, 'good luck', on a square of red paper with a marker, turn the square like a diamond and hang it on your door." },
    { sleeps: 1, kind: 'say', text: "It is New Year's Eve! Families gather for a big reunion dinner and many stay up late to welcome the new year. Learn to say happy new year in Mandarin!", greeting: 0 },
  ],

  parentNote:
    'Lunar New Year follows the Chinese lunisolar calendar, so it falls on a different date each year between January 21 and February 20. Tết in Vietnam and Seollal in Korea almost always land on the same day; very occasionally one of them is a day apart, because Vietnam and Korea each calculate the new moon in their own time zone. The app shows the 15-day Chinese festival, ending at the Lantern Festival; in Vietnam and Korea the main celebrations last about three days. Firecrackers are not for children and are restricted in many places.',

  sources: [
    "Encyclopaedia Britannica, 'Chinese New Year'",
    "National Folk Museum of Korea, 'Encyclopedia of Korean Seasonal Customs', entries 'Seollal' and 'Tteokguk'",
    "Smithsonian Institution, Smithsonian Folklife, 'Lunar New Year' resources",
    "Fuchsia Dunlop, 'Every Grain of Rice' (jiaozi method)",
  ],
};

export default content;
