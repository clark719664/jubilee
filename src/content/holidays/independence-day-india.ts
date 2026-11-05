import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'On 15 August 1947 India became an independent country after almost two hundred years of British rule.',
    'Every year the Prime Minister raises the Indian flag at the Red Fort in Delhi and gives a speech to the whole nation.',
    'Schools hold flag ceremonies and sing the national anthem, and in many cities the sky fills with kites in saffron, white and green.',
  ],
  facts: [
    {
      text: 'India\'s flag is nicknamed the Tiranga, which means "tricolour". The navy-blue wheel in the middle is the Ashoka Chakra, copied from a 2,000-year-old stone pillar at Sarnath, and it has exactly 24 spokes. Many people say the spokes stand for the 24 hours of the day.',
      bigKids: true,
    },
    {
      text: 'In Delhi, kite flying is the big Independence Day game: rooftops fill with families, and the goal is to keep your kite up while cutting the strings of the others.',
      wow: true,
    },
    {
      text: 'India has 22 languages listed in its constitution, so Independence Day speeches, songs and greetings are heard in many languages on the same morning.',
    },
  ],
  greetings: [
    {
      lang: 'hi',
      langName: 'Hindi',
      text: 'स्वतंत्रता दिवस की शुभकामनाएं',
      roman: 'Swatantrata Diwas ki shubhkamnayein',
      sayIt: 'swah-TUN-trah-tah DEE-vus kee shoob-KAHM-nah-yen',
      meaning: 'Good wishes for Independence Day',
    },
    {
      lang: 'hi',
      langName: 'Hindi',
      text: 'जय हिन्द',
      roman: 'Jai Hind',
      sayIt: 'JAY HIND',
      meaning: 'Victory to India',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'Independence Day is a national holiday across India on 15 August every year. Pakistan celebrates its own independence the day before, on 14 August. Republic Day on 26 January is a different holiday that marks India\'s constitution.',
  sources: [
    'Government of India, "Flag Code of India, 2002"',
    'Encyclopaedia Britannica, "Independence Day (Indian holiday)"',
    'Constitution of India, Eighth Schedule (22 scheduled languages)',
  ],
};

export default content;
