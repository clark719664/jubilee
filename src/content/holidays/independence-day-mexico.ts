import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Mexico\'s Independence Day on 16 September remembers the morning in 1810 when a priest named Miguel Hidalgo rang his church bell in the town of Dolores and called on people to fight for freedom from Spain.',
    'Late on the night of 15 September, the President of Mexico rings a bell at the National Palace, shouts the names of the heroes and cries "¡Viva México!", and the huge crowd in the square shouts it back.',
    'Then come fireworks, mariachi music, flags, paper streamers in green, white and red, and on 16 September a big parade through Mexico City.',
  ],
  facts: [
    {
      text: 'The shout on the night of 15 September is called the Grito de Dolores, "the cry of Dolores". Mayors and governors give their own Grito in town squares all over Mexico at the same hour.',
    },
    {
      text: 'The bell the President rings is said to be the very bell Hidalgo rang in 1810. It was moved to the National Palace in Mexico City in 1896.',
      wow: true,
    },
    {
      text: 'Hidalgo\'s call in 1810 began a war that lasted eleven years, until the independence army marched into Mexico City on 27 September 1821. Cinco de Mayo is a different holiday about a battle in 1862.',
      bigKids: true,
    },
  ],
  greetings: [
    {
      lang: 'es',
      langName: 'Spanish',
      text: '¡Viva México!',
      sayIt: 'VEE-vah MEH-hee-koh',
      meaning: 'Long live Mexico!',
    },
    {
      lang: 'es',
      langName: 'Spanish',
      text: '¡Feliz Día de la Independencia!',
      sayIt: 'feh-LEES DEE-ah deh lah een-deh-pen-DEN-syah',
      meaning: 'Happy Independence Day',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'The celebrations begin on the evening of 15 September with the Grito, and 16 September is the public holiday. A favorite dish of the season is chiles en nogada, served in the green, white and red of the flag.',
  sources: [
    'Gobierno de México, "Ceremonia del Grito de Independencia"',
    'Encyclopaedia Britannica, "Grito de Dolores"',
    'Encyclopaedia Britannica, "Mexican War of Independence"',
  ],
};

export default content;
