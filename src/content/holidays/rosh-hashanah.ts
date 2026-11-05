import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Rosh Hashanah is the Jewish New Year, and its name means "head of the year" in Hebrew.',
    'It begins at sundown and lasts two days, filled with prayers, the blast of the shofar, and wishes for a good and sweet year ahead.',
    'Many families dip apple wedges in honey, eat round challah bread, and go to a river or pond to toss in breadcrumbs, a custom called tashlich that stands for letting go of last year\'s mistakes.',
  ],
  facts: [
    {
      text: 'The shofar is a trumpet made from a ram\'s horn. In many synagogues it is blown 100 times on each day of Rosh Hashanah (except when that day is Shabbat), with long calls, broken calls and quick blasts.',
      wow: true,
    },
    {
      text: 'The challah is baked as a round spiral instead of a long braid to stand for the year going round and round, and sometimes raisins are added to make it sweeter.',
    },
    {
      text: 'The Hebrew calendar counts years in the thousands: the years that begin in the 2020s are in the 5780s. Rosh Hashanah starts the Ten Days of Repentance, which end with Yom Kippur.',
      bigKids: true,
    },
  ],
  greetings: [
    {
      lang: 'he',
      langName: 'Hebrew',
      text: 'שנה טובה',
      roman: 'Shanah Tovah',
      sayIt: 'shah-NAH toh-VAH',
      meaning: 'A good year',
    },
    {
      lang: 'he',
      langName: 'Hebrew',
      text: 'שנה טובה ומתוקה',
      roman: 'Shanah Tovah u\'Metukah',
      sayIt: 'shah-NAH toh-VAH oo-meh-too-KAH',
      meaning: 'A good and sweet year',
    },
  ],
  recipes: [
    {
      id: 'apples-and-honey-plate',
      title: 'Apples & Honey Plate',
      emoji: '🍎',
      blurb: 'The classic Rosh Hashanah treat: crisp apple wedges arranged like sun rays around a little bowl of honey for dipping.',
      minutes: 15,
      serves: 4,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: [],
      equipment: ['cutting board', 'knife (for a grown-up)', 'small bowl', 'large plate', 'spoon'],
      ingredients: [
        { item: 'apples', us: { qty: 3, unit: 'piece' }, metric: { qty: 3, unit: 'piece' }, note: 'crisp ones, like Honeycrisp or Gala' },
        { item: 'honey', us: { qty: 3, unit: 'tbsp' }, metric: { qty: 45, unit: 'ml' } },
        { item: 'lemon juice', us: { qty: 1, unit: 'tsp' }, metric: { qty: 5, unit: 'ml' } },
        { item: 'pomegranate seeds', us: { qty: 0.25, unit: 'cup' }, metric: { qty: 40, unit: 'g' }, optional: true },
        { item: 'ground cinnamon', us: { qty: 1, unit: 'pinch' }, metric: { qty: 1, unit: 'pinch' }, optional: true },
      ],
      steps: [
        { text: 'Wash the apples under the tap and dry them with a clean towel.' },
        { text: 'Ask a grown-up to cut each apple into thin wedges and remove the core.', adult: true, hazards: ['sharp'] },
        { text: 'Sprinkle the lemon juice over the wedges and toss them gently with your hands.', tip: 'Lemon juice stops the apple from turning brown.' },
        { text: 'Spoon the honey into the small bowl and set it in the middle of the plate.', tip: 'No honey for babies under 1.' },
        { text: 'Lay the apple wedges around the bowl so they point outwards like the rays of the sun.' },
        { text: 'Scatter the pomegranate seeds over the plate and dust on a little cinnamon if you like.' },
        { text: 'Taste test! Dip a wedge in the honey, say "Shanah tovah u\'metukah", and wish everyone a sweet year.' },
      ],
      tip: 'Honey must never be given to babies under 1 year old. For a honey-free plate, dip the apples in maple syrup or date syrup instead.',
    },
  ],
  crafts: [],
  parentNote:
    'Rosh Hashanah begins at sundown the evening before the first day and lasts two days. It follows the Hebrew calendar, so it falls between early September and early October. Yom Kippur comes ten days later.',
  sources: [
    'Encyclopaedia Britannica, "Rosh Hashana"',
    'Jewish Virtual Library, "Rosh Hashanah"',
    'My Jewish Learning, "Rosh Hashanah 101"',
  ],
};

export default content;
