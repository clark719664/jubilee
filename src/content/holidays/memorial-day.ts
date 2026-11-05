import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Memorial Day is a quiet, thankful day in the United States, on the last Monday in May, for remembering soldiers who died while serving their country.',
    'It began after the Civil War as Decoration Day, when families laid flowers on the graves of soldiers.',
    'Today many people visit cemeteries, watch parades, fly the flag at half-staff until noon, and pause for a minute of silence at 3 o\'clock in the afternoon.',
  ],
  facts: [
    {
      text: 'Every year before Memorial Day, soldiers place a small flag in front of each of the more than 260,000 graves at Arlington National Cemetery, and it takes only a few hours.',
      wow: true,
    },
    {
      text: 'The first big Decoration Day was held on 30 May 1868. In 1971 Congress made Memorial Day a national holiday and moved it to the last Monday in May.',
      bigKids: true,
    },
    {
      text: 'Some people wear a red paper poppy, a flower that grew on the battlefields of the First World War and was made famous by the poem "In Flanders Fields".',
    },
  ],
  greetings: [
    {
      lang: 'en',
      langName: 'English',
      text: 'We remember.',
      sayIt: 'wee ree-MEM-ber',
      meaning: 'A simple way to say the day is about remembering',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'Memorial Day honours those who died in military service; Veterans Day in November honours everyone who has served. Many families prefer "have a meaningful Memorial Day" to "happy Memorial Day". The National Moment of Remembrance is at 3 p.m. local time.',
  sources: [
    'U.S. Department of Veterans Affairs, "Memorial Day History"',
    'Arlington National Cemetery, "Flags In"',
    'Library of Congress, "Today in History: May 30"',
  ],
};

export default content;
