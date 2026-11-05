import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Martin Luther King Jr. Day honors Dr. Martin Luther King Jr., a minister who led the fight for equal rights for Black Americans using peaceful protest.',
    'The holiday falls on the third Monday in January, close to his birthday on January 15.',
    'Many people spend the day volunteering, because it is the only US federal holiday officially named a national day of service.',
  ],
  facts: [
    {
      text: 'On August 28, 1963, Dr. King gave his famous "I Have a Dream" speech on the steps of the Lincoln Memorial in Washington, DC, to a crowd of about 250,000 people.',
      bigKids: true,
    },
    {
      text: 'In 1964 Dr. King won the Nobel Peace Prize. He was 35 years old, the youngest person to win it at that time.',
      wow: true,
    },
    {
      text: 'The holiday became law in 1983 and was first celebrated in 1986. It took until the year 2000 for all 50 states to observe it.',
    },
  ],
  greetings: [
    {
      lang: 'en',
      langName: 'English',
      text: 'Happy Martin Luther King Jr. Day!',
      sayIt: 'HAP-ee MAR-tin LOO-ther KING JOON-yer DAY',
      meaning: 'A greeting for the day; many people also say "a day on, not a day off"',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'Dr. King was born on January 15, 1929. The holiday always lands on the third Monday in January, so it moves between January 15 and 21. Schools, banks and federal offices close in the United States.',
  sources: [
    'The King Center, \'About Dr. King\'',
    'National Archives, \'Dr. Martin Luther King Jr. Day\'',
    'The Nobel Prize, \'Martin Luther King Jr. – Facts\'',
  ],
};

export default content;
