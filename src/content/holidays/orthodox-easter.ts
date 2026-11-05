import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Orthodox Easter, also called Pascha, is the day Orthodox Christians celebrate Jesus rising from the dead.',
    'Many families in Greece, Russia, Serbia, Ethiopia and other countries go to church late on Saturday night, and at midnight the lights go out and one candle flame is passed from person to person until the whole church glows.',
    'In the morning people greet each other with "Christ is risen!", crack bright red eggs together and share a big meal after weeks of fasting.',
  ],
  facts: [
    {
      text: 'Red eggs are for a cracking game: you tap your egg against a friend\'s, and the last egg left uncracked is said to bring good luck for the year.',
    },
    {
      text: 'At midnight on Holy Saturday one flame is shared candle to candle until hundreds of little lights fill the dark church.',
      wow: true,
    },
    {
      text: 'Orthodox churches work out the date using the older Julian calendar, so Orthodox Easter can be the same Sunday as Western Easter (like in 2025) or up to five weeks later.',
      bigKids: true,
    },
  ],
  greetings: [
    {
      lang: 'el',
      langName: 'Greek',
      text: 'Χριστός Ανέστη',
      roman: 'Christos Anesti',
      sayIt: 'khree-STOS ah-NES-tee',
      meaning: 'Christ is risen (the reply is "Alithos Anesti", truly he is risen)',
    },
    {
      lang: 'ru',
      langName: 'Russian',
      text: 'Христос воскрес',
      roman: 'Khristos voskres',
      sayIt: 'khrees-TOS vahs-KRYES',
      meaning: 'Christ is risen (the reply is "Voistinu voskres", truly he is risen)',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'The date is computed with the Julian calendar, so it usually differs from Western Easter and always falls between early April and early May. In some years the two Easters land on the same Sunday.',
  sources: [
    'Greek Orthodox Archdiocese of America, "Pascha (Easter)"',
    'Encyclopaedia Britannica, "Easter: the date of Easter"',
  ],
};

export default content;
