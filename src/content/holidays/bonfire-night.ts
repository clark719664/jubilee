import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Bonfire Night, on November 5, remembers the night in 1605 when a man named Guy Fawkes was caught guarding barrels of gunpowder under the Houses of Parliament in London.',
    'The plot to blow up Parliament failed, and people lit bonfires to celebrate that the king was safe.',
    'More than four hundred years later, people across Britain still wrap up warm, gather round big bonfires, watch fireworks, and eat toffee apples, jacket potatoes and sticky parkin cake.',
    'Always watch fireworks from a safe distance, keep sparklers at arm\'s length, and leave lighting them to the grown-ups.',
  ],
  facts: [
    {
      text: 'The plotters hid 36 barrels of gunpowder in a cellar under the House of Lords. A search party found them, and Guy Fawkes, around midnight, only hours before the king was due to open Parliament.',
      bigKids: true,
    },
    {
      text: 'Before every State Opening of Parliament, the Yeomen of the Guard still search the cellars by lantern light, a tradition that goes back to the Gunpowder Plot of 1605.',
      wow: true,
    },
    {
      text: 'A rhyme that starts "Remember, remember the fifth of November" has been recited for hundreds of years, and children once carried a stuffed "guy" through the streets asking for a penny.',
    },
  ],
  greetings: [
    {
      lang: 'en',
      langName: 'English',
      text: 'Happy Bonfire Night!',
      sayIt: 'HAP-ee BON-fire NITE',
      meaning: 'Happy Bonfire Night',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'Public displays are the safest way to see fireworks. If you hold sparklers at home, children should wear gloves, hold them at arm\'s length, and drop used ones into a bucket of water; sparklers are not recommended for children under five. Fireworks are loud, so ear defenders help little ones, and pets are best kept indoors.',
  sources: [
    'UK Parliament, "The Gunpowder Plot"',
    'Royal Society for the Prevention of Accidents (RoSPA), "Fireworks Safety"',
    'Encyclopaedia Britannica, "Guy Fawkes Day"',
  ],
};

export default content;
