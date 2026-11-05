import type { HolidayContent } from '../types';

const newYearsEve: HolidayContent = {
  story: [
    "New Year's Eve is December 31, the last night of the year, when people all over the world stay up late to count down to midnight.",
    'Parties at the turn of the year are thousands of years old, and the date of January 1 comes from the Roman calendar, whose first month is named after Janus, a god with two faces who looks backwards and forwards at once.',
    'Every country has its own midnight tradition: in Spain people eat twelve grapes, in Scotland Hogmanay means first-footing, in Japan temple bells ring 108 times and in New York a giant crystal ball drops in Times Square.',
    'Many families bang pots and pans at midnight, let off party poppers, hug everyone in the room and shout Happy New Year!',
  ],

  facts: [
    {
      text: 'In Spain, people eat one grape on each of the twelve chimes of midnight, one for every month of the new year, and if you finish all twelve the year is supposed to be lucky.',
      wow: true,
    },
    {
      text: "In Japan, temple bells ring 108 times on New Year's Eve, a custom called joya no kane, to ring out 108 worries from the old year.",
    },
    {
      text: 'The Times Square ball in New York has dropped at midnight almost every year since 1907; today\'s ball weighs more than 5,000 kilograms and sparkles with thousands of crystal triangles.',
      bigKids: true,
    },
    {
      text: "Hogmanay is Scotland's New Year's Eve, and the first person to step through your door after midnight, the first-footer, is supposed to bring a gift such as coal, shortbread or a coin.",
    },
    {
      text: 'Because of time zones, midnight reaches Kiribati in the Pacific about 26 hours before it reaches Baker Island, so New Year takes more than a whole day to travel around the planet.',
      wow: true,
      bigKids: true,
    },
    {
      text: "In Denmark, some people save chipped plates all year and smash them on friends' doorsteps on New Year's Eve: a big pile of broken china means you have lots of friends.",
    },
  ],

  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Año Nuevo!', sayIt: 'feh-LEES AH-nyoh NWEH-voh', meaning: 'Happy New Year!' },
    { lang: 'zh-Hans', langName: 'Chinese (Mandarin)', text: '新年快乐', roman: 'Xīnnián kuàilè', sayIt: 'shin-NYEN KWHY-luh', meaning: 'Happy New Year! (said for January 1 and for Lunar New Year)' },
    { lang: 'ja', langName: 'Japanese', text: 'あけましておめでとうございます', roman: 'Akemashite omedetō gozaimasu', sayIt: 'ah-keh-mah-SHTEH oh-meh-deh-TOH goh-zah-ee-MAHS', meaning: "Happy New Year! (said from midnight; before then people say 'yoi otoshi o', have a good year)" },
    { lang: 'de', langName: 'German', text: 'Guten Rutsch!', sayIt: 'GOO-ten ROOTSH', meaning: "Have a good start to the new year! (literally 'good slide', said before midnight)" },
    { lang: 'de', langName: 'German', text: 'Frohes neues Jahr!', sayIt: 'FROH-es NOY-es YAHR', meaning: 'Happy New Year!' },
    { lang: 'fr', langName: 'French', text: 'Bonne année !', sayIt: 'bun ah-NAY', meaning: "Happy New Year! (literally 'good year')" },
  ],

  recipes: [
    {
      id: 'sparkling-mocktail-toast',
      title: 'Sparkling Mocktail Toast',
      emoji: '🥂',
      blurb: 'Pink, fizzy and full of frozen-berry ice cubes: a glass to raise at midnight.',
      minutes: 10,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: [],
      equipment: ['Jug', 'Wooden spoon', 'Four glasses or cups', 'Paper straws'],
      ingredients: [
        { item: 'Cranberry juice', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' } },
        { item: 'White grape juice', us: { qty: 1, unit: 'cup' }, metric: { qty: 240, unit: 'ml' }, note: 'or apple juice' },
        { item: 'Lime', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' } },
        { item: 'Sparkling water', us: { qty: 2, unit: 'cup' }, metric: { qty: 480, unit: 'ml' }, note: 'cold' },
        { item: 'Frozen berries', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 75, unit: 'g' }, note: 'raspberries or blueberries' },
        { item: 'Cocktail umbrellas', us: { qty: 4, unit: 'piece' }, metric: { qty: 4, unit: 'piece' }, note: 'pointy sticks: for bigger kids only', optional: true },
      ],
      steps: [
        { text: 'Drop a few frozen berries into each glass: they work as ice cubes and look like jewels.' },
        { text: 'Pour the cranberry juice and the grape juice into the jug and stir.' },
        { text: 'A grown-up cuts the lime in half with a knife; you squeeze the juice into the jug.', adult: true, hazards: ['sharp'] },
        { text: 'Just before midnight, top the jug up with sparkling water and stir once, gently, so the bubbles stay.', tip: 'Add the fizz last or it goes flat before the countdown.' },
        { text: 'Pour into the glasses and add a paper straw or a little umbrella.' },
        { text: 'Count down from ten, clink glasses carefully and say cheers in as many languages as you know.' },
        { text: 'Taste test! Does it fizz on your tongue? Try saying Happy New Year with a mouthful of bubbles.' },
      ],
    },
    {
      id: 'confetti-popcorn',
      title: 'Confetti Popcorn',
      emoji: '🍿',
      blurb: 'Popcorn drizzled with white chocolate and showered in rainbow sprinkles, ready for the countdown.',
      minutes: 25,
      serves: 6,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['milk', 'soy'],
      swaps: [
        { avoid: 'milk', use: 'dairy-free white chocolate buttons' },
        { avoid: 'soy', use: 'a soy-free chocolate (check the label) or skip the chocolate and toss the popcorn with a little melted coconut oil and sprinkles' },
      ],
      chokingNote: 'Popcorn is a choking hazard for children under four: save this one for the bigger kids and sit down to eat it.',
      equipment: ['Microwave', 'Big bowl', 'Small bowl', 'Two spoons', 'Baking sheet', 'Baking paper'],
      ingredients: [
        { item: 'Plain microwave popcorn', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, note: 'one bag, unsalted or lightly salted' },
        { item: 'White chocolate', us: { qty: 3.5, unit: 'oz' }, metric: { qty: 100, unit: 'g' }, allergens: ['milk', 'soy'] },
        { item: 'Rainbow sprinkles', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 20, unit: 'g' } },
        { item: 'Salt', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' }, optional: true },
      ],
      steps: [
        { text: 'A grown-up pops the popcorn in the microwave for the time on the bag, about 3 minutes.', adult: true, hazards: ['heat'], timerMinutes: 3 },
        { text: 'A grown-up opens the hot bag away from faces and tips the popcorn into the big bowl; then you pick out any unpopped kernels, which are hard and can hurt teeth.', adult: true, hazards: ['heat'] },
        { text: 'Break the white chocolate into the small bowl.' },
        { text: 'A grown-up melts the chocolate in the microwave, 30 seconds at a time, stirring between goes.', adult: true, hazards: ['heat', 'hot-liquid'] },
        { text: 'A grown-up drizzles the melted chocolate over the popcorn with a spoon while you turn the bowl.', adult: true, hazards: ['hot-liquid'] },
        { text: 'Shake the sprinkles over the top straight away, before the chocolate sets, and toss gently with the two spoons.' },
        { text: 'Spread the popcorn out on the lined tray and wait 10 minutes for the chocolate to set hard.', timerMinutes: 10 },
        { text: 'Taste test! Find the piece with the most confetti on it, then share the rest at midnight.' },
      ],
      tip: 'White chocolate burns easily: short bursts and lots of stirring.',
    },
  ],

  crafts: [
    {
      id: 'confetti-poppers',
      title: 'Confetti Poppers',
      emoji: '🎉',
      blurb: 'A cardboard tube, a balloon and a handful of confetti make a popper you can fire at the ceiling at midnight.',
      minutes: 25,
      mess: 2,
      adultHelp: 'some',
      hazards: ['sharp', 'small-parts'],
      materials: [
        { item: 'Cardboard tubes', qty: '2', substitute: 'a paper cup with the bottom removed' },
        { item: 'Balloons', qty: '2' },
        { item: 'Scissors', substitute: 'ask a grown-up to cut the balloons' },
        { item: 'Sticky tape' },
        { item: 'Wrapping paper or stickers', optional: true, substitute: 'crayons' },
        { item: 'Tissue paper or scraps of colored paper', qty: 'a handful, for confetti' },
        { item: 'Hole punch', optional: true },
      ],
      steps: [
        { text: 'Tie a knot in the neck of a balloon without blowing it up, then use scissors to cut off the round end.', hazards: ['sharp'] },
        { text: 'Stretch the cut end of the balloon over one end of the tube so the knot sits in the middle, and tape it in place.' },
        { text: 'Wrap the tube in colorful paper or cover it in stickers.' },
        { text: 'Make confetti: tear tissue paper into tiny bits, or use the hole punch on scraps of colored paper.' },
        { text: 'Drop a small handful of confetti into the open end of the tube.' },
        { text: 'Hold the tube pointing up, pull the knot back and let go: pop!', tip: 'Point it at the ceiling, never at a face. Balloons and balloon pieces can choke children under eight, so a grown-up stays close and bins the cut-off ends; skip this craft if anyone has a latex allergy, and sweep up the confetti so nobody slips.' },
      ],
      learn: 'Pulling the balloon back stores energy like a spring, and letting go turns it into a burst of flying confetti: that is physics.',
    },
  ],

  doors: [
    { sleeps: 12, kind: 'fact', text: "Many people sing 'Auld Lang Syne' just after midnight. The Scottish poet Robert Burns wrote the words down in 1788, and 'auld lang syne' means 'long ago', so the song is about remembering old friends." },
    { sleeps: 11, kind: 'joke', text: "What do you say to a kangaroo on New Year's Eve? Hoppy New Year!" },
    { sleeps: 10, kind: 'craft', text: 'Pour a spoonful of dry rice into an empty plastic bottle, screw the lid on tight, tape it shut and decorate it: a shaker for the countdown!' },
    { sleeps: 9, kind: 'fact', text: "In the Philippines, many families put 12 round fruits on the table on New Year's Eve, one for each month. Round fruits look like coins, so they stand for a good year ahead." },
    { sleeps: 8, kind: 'say', text: 'In Japan, this greeting is said from the stroke of midnight. Learn to say Happy New Year in Japanese!', greeting: 2 },
    { sleeps: 7, kind: 'color', text: "Color in the New Year's Eve page. Make the fireworks and confetti as bright and sparkly as you can!" },
    { sleeps: 6, kind: 'fact', text: "In Japan, many families eat toshikoshi soba, or year-crossing noodles, on New Year's Eve. The long noodles stand for a long, healthy life." },
    { sleeps: 5, kind: 'joke', text: 'What does a clock do when it gets hungry at midnight? It goes back four seconds!' },
    { sleeps: 4, kind: 'seek', text: "Some sneaky surprises are hiding in the New Year's Eve picture. Can you find every single one? Open Seek & Find!" },
    { sleeps: 3, kind: 'fact', text: "In Colombia, some people grab an empty suitcase and run around the block on New Year's Eve, hoping it brings a year full of travel." },
    { sleeps: 2, kind: 'craft', text: "Write a wish for next year on a strip of paper, fold it up and pop it in a jar. Open it next New Year's Eve to see if it came true!" },
    { sleeps: 1, kind: 'say', text: "Tomorrow is New Year's Eve! In Germany people wish each other Guten Rutsch in the last days of the year: a good slide into the new one. Learn to say it!", greeting: 3 },
  ],

  parentNote:
    "New Year's Eve runs late, so the countdown clock in the app shows hours, minutes and seconds to midnight in your own time zone. Popcorn is not for under-fours, and uninflated balloons and balloon pieces are a choking risk for children under eight, so supervise the poppers, bin the scraps and check for latex allergies.",

  sources: [
    "Encyclopaedia Britannica, 'New Year festival' (Janus and January 1; Hogmanay and first-footing; customs around the world)",
    "Times Square Alliance, 'About the New Year's Eve ball' (since 1907; weight and crystal panels of the current ball)",
    "Japan National Tourism Organization, 'New Year in Japan' (joya no kane, the 108 bells)",
    "BBC Travel, 'Spain's twelve lucky grapes' (las doce uvas de la suerte)",
    "VisitDenmark, 'Danish New Year traditions' (smashing plates on doorsteps)",
    "Encyclopaedia Britannica, 'Kiribati' (the Line Islands and the first midnight of the year)",
  ],
};

export default newYearsEve;
