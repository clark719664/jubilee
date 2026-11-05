import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Passover, or Pesach, is the Jewish festival that remembers how the Israelites escaped slavery in Egypt long ago.',
    'On the first night (and for many families the second night too), families gather for a special meal called a seder, where they tell the story from a book called the Haggadah, ask four questions, and taste symbolic foods from a seder plate.',
    'For the eight days of Passover, many Jewish families eat matzah, a flat cracker-like bread, instead of regular bread, because the Israelites left Egypt in such a hurry that their dough had no time to rise.',
  ],
  facts: [
    {
      text: 'During the seder a piece of matzah called the afikoman is hidden. The kids hunt for it, and the meal cannot finish until it is found, so the finder can ask for a prize.',
      wow: true,
    },
    {
      text: 'To count as matzah for Passover, the flour and water must be mixed, rolled and baked in under 18 minutes. Any longer and the dough could start to rise.',
      bigKids: true,
    },
    {
      text: 'The youngest person at the table traditionally asks the Four Questions, which begin: "Why is this night different from all other nights?"',
    },
  ],
  greetings: [
    { lang: 'he', langName: 'Hebrew', text: 'חג פסח שמח', roman: 'Chag Pesach Sameach', sayIt: 'KHAHG PEH-sakh sah-MAY-akh', meaning: 'Happy Passover holiday' },
    { lang: 'he', langName: 'Hebrew', text: 'חג כשר ושמח', roman: 'Chag kasher v\'sameach', sayIt: 'KHAHG kah-SHEHR vuh-sah-MAY-akh', meaning: 'A kosher and happy holiday' },
  ],
  recipes: [
    {
      id: 'charoset',
      title: 'Charoset',
      emoji: '🍎',
      blurb: 'A sweet apple, nut and cinnamon mix for the seder plate. Its crumbly look stands for the mortar the Israelites used when they were slaves.',
      minutes: 20,
      serves: 8,
      difficulty: 1,
      adultHelp: 'some',
      noHeat: true,
      allergens: ['tree-nut'],
      swaps: [{ avoid: 'tree-nut', use: 'toasted sunflower seeds, or leave the nuts out' }],
      chokingNote: 'Nut pieces are a choking hazard for children under 4: crush them very fine or leave them out of their portion.',
      equipment: ['medium bowl', 'small cutting board', 'knife and vegetable peeler (for a grown-up)', 'zip-top bag', 'rolling pin', 'spoon'],
      ingredients: [
        { item: 'apples', us: { qty: 2, unit: 'piece' }, metric: { qty: 2, unit: 'piece' }, note: 'sweet and crisp' },
        { item: 'walnuts', us: { qty: 0.5, unit: 'cup' }, metric: { qty: 60, unit: 'g' } },
        { item: 'ground cinnamon', us: { qty: 1, unit: 'tsp' }, metric: { qty: 2, unit: 'g' } },
        { item: 'grape juice', us: { qty: 3, unit: 'tbsp' }, metric: { qty: 45, unit: 'ml' }, note: 'red, or sweet kosher wine for the grown-ups' },
        { item: 'honey', us: { qty: 1, unit: 'tbsp' }, metric: { qty: 20, unit: 'g' }, optional: true, note: 'not for children under one' },
      ],
      steps: [
        { text: 'Peel the apples and chop them into very small pieces, about the size of a pea.', adult: true, hazards: ['sharp'] },
        { text: 'Put the walnuts in the zip-top bag, squeeze out the air and seal it. Bash and roll with the rolling pin until the nuts are in small crumbs.' },
        { text: 'Tip the apples and nut crumbs into the bowl and mix.' },
        { text: 'Sprinkle on the cinnamon and stir again.' },
        { text: 'Pour in the grape juice and the honey, if using, and stir until everything is sticky and glossy.', tip: 'No honey for babies under 1.' },
        { text: 'Let the charoset sit for 10 minutes so the flavors mix.', timerMinutes: 10 },
        { text: 'Taste test! Then spoon some onto the seder plate and keep the rest for spreading on matzah.' },
      ],
      tip: 'Families from different places make charoset differently: some use dates, figs or oranges instead of apples.',
    },
  ],
  crafts: [],
  parentNote:
    'Passover begins at sundown as the 15th of Nisan starts on the Hebrew calendar (Hebrew days run from evening to evening), so it falls between late March and late April. It lasts eight days for most families outside Israel and seven days in Israel. The first seder is on the eve of day 1.',
  sources: [
    'Encyclopaedia Britannica, \'Passover\'',
    'Book of Exodus, chapter 12',
    'My Jewish Learning, \'Passover (Pesach) 101\'',
  ],
};

export default content;
