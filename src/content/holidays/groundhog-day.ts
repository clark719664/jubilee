import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'On 2 February, people in the United States and Canada watch a groundhog come out of its burrow.',
    'The legend says that if the groundhog sees its shadow, there will be six more weeks of winter, and if it does not, spring is coming early.',
    'The most famous groundhog, Punxsutawney Phil, has been making predictions in a small town in Pennsylvania since 1887.',
  ],
  facts: [
    {
      text: 'Groundhogs, also called woodchucks, really do sleep through winter. While hibernating, a groundhog\'s heart slows from about 80 beats a minute to about 5.',
      wow: true,
    },
    {
      text: 'The tradition grew out of an old European custom on Candlemas, 2 February, when people watched for a badger or hedgehog. German settlers in Pennsylvania swapped in the groundhog, and the first official Punxsutawney forecast was in 1887.',
      bigKids: true,
    },
    {
      text: 'Weather scientists have checked Phil\'s record. He is right only about four times out of ten, which is worse than a coin flip.',
    },
  ],
  greetings: [
    { lang: 'en', langName: 'English', text: 'Happy Groundhog Day!', sayIt: 'HAP-ee GROWND-hog DAY', meaning: 'A greeting for the day' },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'Canada has its own forecasting groundhogs, including Wiarton Willie in Ontario and Shubenacadie Sam in Nova Scotia. The six-more-weeks rule is folklore, not science; it is a fun way to talk about seasons and shadows.',
  sources: [
    'Punxsutawney Groundhog Club, \'History\'',
    'NOAA National Centers for Environmental Information, \'Groundhog Day Forecasts and Climate History\'',
    'National Wildlife Federation, \'Groundhog\'',
  ],
};

export default content;
