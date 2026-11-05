import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'April Fools\' Day is the first day of April, when people play gentle tricks on friends and family.',
    'The best jokes are silly and kind, like a fake spider on the table, and they end with a big "April Fools!"',
    'Nobody knows exactly how the day started, but people have been fooling each other on April 1 for hundreds of years.',
  ],
  facts: [
    {
      text: 'In France kids secretly stick a paper fish on someone\'s back and shout "poisson d\'avril!", which means "April fish!" Italian kids play the same trick and shout "pesce d\'aprile!"',
      wow: true,
    },
    {
      text: 'In 1957 a British TV news program showed Swiss farmers "harvesting" spaghetti from trees, and many viewers phoned in asking how to grow their own.',
      bigKids: true,
    },
    {
      text: 'In Scotland the fun used to last two days: the first was for sending people on silly errands, and the second was for pinning paper tails on them.',
    },
  ],
  greetings: [
    {
      lang: 'en',
      langName: 'English',
      text: 'April Fools!',
      sayIt: 'AY-prul FOOLZ',
      meaning: 'What you shout when the joke is over',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'A good family rule: jokes should make everyone laugh, including the person being fooled. Tricks that scare, break things or make a mess for someone else are not April Fools jokes.',
  sources: [
    'Library of Congress, Everyday Mysteries, "How did April Fools\' Day begin?"',
    'Encyclopaedia Britannica, "April Fools\' Day"',
    'BBC Archive, "Panorama: the spaghetti harvest (1957)"',
  ],
};

export default content;
