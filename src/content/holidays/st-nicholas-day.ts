import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'St Nicholas Day on 6 December remembers Nicholas, a kind bishop who lived about 1,700 years ago in a town called Myra, in what is now Turkey, and who was famous for giving gifts in secret.',
    'On the night of 5 December, children in Germany, Austria, Belgium, Poland and parts of France put a shoe or boot by the door or window, and Dutch children have been setting out their shoes for weeks already.',
    'In the morning the shoe is filled with oranges, nuts, chocolate coins and spiced cookies, and in some places a hand-written poem too.',
  ],
  facts: [
    {
      text: 'A legend says Nicholas once dropped three bags of gold through a poor family\'s window at night, and one landed in a shoe left by the fire. That is why shoes are set out for him today.',
    },
    {
      text: 'The name "Santa Claus" comes from Sinterklaas, the Dutch name for St Nicholas. Writers in New York in the early 1800s loved the old Dutch Sinterklaas stories, and over time he grew into the Santa many children know.',
      wow: true,
    },
    {
      text: 'In the Netherlands, Sinterklaas arrives by steamboat in the middle of November and is greeted by crowds in a different town each year. The big gift evening, pakjesavond, is 5 December.',
      bigKids: true,
    },
  ],
  greetings: [
    {
      lang: 'de',
      langName: 'German',
      text: 'Frohen Nikolaustag!',
      sayIt: 'FROH-en NEE-koh-lows-tahk',
      meaning: 'Happy St Nicholas Day',
    },
    {
      lang: 'nl',
      langName: 'Dutch',
      text: 'Fijne Sinterklaas!',
      sayIt: 'FY-nuh SIN-ter-klahs',
      meaning: 'Happy Sinterklaas',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'In the Netherlands the main celebration is the evening of 5 December, pakjesavond, with presents and funny poems. In Belgium, Germany, Austria, Poland and the French regions of Alsace and Lorraine, children find treats in their shoes on the morning of 6 December. It is a separate day from Christmas.',
  sources: [
    'Encyclopaedia Britannica, "Saint Nicholas"',
    'Encyclopaedia Britannica, "Santa Claus"',
    'Meertens Instituut (Royal Netherlands Academy of Arts and Sciences), "Sinterklaas"',
  ],
};

export default content;
