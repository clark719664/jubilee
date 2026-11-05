import type { HolidayContent, HolidayId } from './types';

/** Tier-3 content is one sentence and one fact: just enough for the Today ribbon and the Silly chip. */
function one(story: string, fact: string): HolidayContent {
  return { story: [story], facts: [{ text: fact }], greetings: [], recipes: [], crafts: [] };
}

/** Inline content for the 24 tier-3 silly days (their metas live in registry.ts). */
export const SILLY_CONTENT: Record<HolidayId, HolidayContent> = {
  'squirrel-day': one(
    'Squirrel Appreciation Day is a day to notice the bushy-tailed acrobats in your park.',
    'Squirrels bury thousands of nuts each fall and forget some of them, so they accidentally plant new trees.',
  ),
  'puzzle-day': one(
    'National Puzzle Day is for jigsaws, riddles and brain-teasers of every size.',
    'The first jigsaw puzzles were maps glued to wood and cut into pieces to help children learn geography.',
  ),
  'pizza-day': one(
    "Pizza Day celebrates one of the world's favorite foods, from a plain slice to a wild topping mix.",
    'Pizza as we know it comes from Naples in Italy, where it began as a cheap, tasty meal for busy workers.',
  ),
  'kind-acts-day': one(
    'Random Acts of Kindness Day is for doing something nice for someone, just because.',
    'Scientists have found that doing something kind for another person makes the helper feel happier too.',
  ),
  'tooth-fairy-day': one(
    'Tooth Fairy Day celebrates the tiny visitor who collects lost baby teeth.',
    'Most children lose their first baby tooth at around six years old, and everyone grows 20 baby teeth before any grown-up ones arrive.',
  ),
  'wildlife-day': one(
    'World Wildlife Day is a day to cheer for wild animals and the places they live.',
    "An elephant's trunk has tens of thousands of muscles, which is more than there are in a whole human body.",
  ),
  'happiness-day': one(
    'The International Day of Happiness reminds everyone that feeling good matters, for people everywhere.',
    'The United Nations started Happiness Day in 2012 after deciding that being happy is a goal every country should care about.',
  ),
  'book-day': one(
    'World Book Day is a day to get lost in a story, in any language.',
    'April 23 was chosen because it is the date remembered for two famous writers, William Shakespeare and Miguel de Cervantes, who both died in 1616.',
  ),
  'star-wars-day': one(
    "Star Wars Day is a day for space stories and the joke 'May the Fourth be with you'.",
    "The day is a pun: 'May the Force be with you' sounds like 'May the Fourth', so fans picked the fourth of May.",
  ),
  'bee-day': one(
    'World Bee Day is for the tiny buzzing workers who help our fruit and vegetables grow.',
    'A single honeybee makes only about one twelfth of a teaspoon of honey in its whole life.',
  ),
  'childrens-day': one(
    "International Children's Day is a party for kids, celebrated on June 1 in many countries.",
    'Different countries celebrate children on different dates: Japan on May 5, India on November 14 and many others on June 1.',
  ),
  'donut-day': one(
    'National Donut Day celebrates rings of sweet fried dough, with sprinkles if you like.',
    'The day started in 1938 to thank the volunteers who handed out doughnuts to soldiers during the First World War.',
  ),
  'oceans-day': one(
    'World Oceans Day is for the big blue that covers most of our planet.',
    'The ocean covers about seven tenths of the Earth, and more than eight tenths of it has never been explored by people.',
  ),
  'emoji-day': one(
    'World Emoji Day celebrates the tiny pictures we use to say things without words.',
    'July 17 was picked because that is the date shown on the calendar emoji on many phones.',
  ),
  'ice-cream-day': one(
    'National Ice Cream Day is for a scoop, a cone or a sundae in the summer sun.',
    'Brain freeze happens when something very cold touches the roof of your mouth and the blood vessels there react in a hurry.',
  ),
  'pi-approximation-day': one(
    'Pi Approximation Day celebrates 22/7, a fraction that is close to the number pi.',
    'If you divide 22 by 7 you get 3.142857, which is very close to pi, 3.14159, but a tiny bit too big.',
  ),
  'friendship-day': one(
    'International Friendship Day is a day to tell your friends why they are great.',
    'The United Nations made July 30 Friendship Day because friendships between people can help build peace between countries.',
  ),
  'left-handers-day': one(
    'Left-Handers Day celebrates everyone who writes, draws and throws with their left hand.',
    'About one in ten people is left-handed, and scissors, can openers and even school desks are usually designed for the other nine.',
  ),
  'dot-day': one(
    "International Dot Day began with a picture book about a girl who thought she couldn't draw and started with a single dot.",
    "Dot Day started in 2009 with one teacher's class, and now millions of children around the world make their mark on it.",
  ),
  'pirate-day': one(
    "Talk Like a Pirate Day is for saying 'Arr!' and 'Ahoy!' all day long.",
    "The day started as a joke between two friends in 1995, and the 'pirate voice' everyone copies comes from an actor in a 1950 film.",
  ),
  'smile-day': one(
    'World Smile Day is for sharing a smile and doing one kind thing.',
    'The yellow smiley face was drawn in 1963 by an artist named Harvey Ball, and it took him about ten minutes.',
  ),
  'animal-day': one(
    'World Animal Day is for every creature, from the dog next door to the whales in the sea.',
    'October 4 is also the feast day of Saint Francis, who is remembered for his love of animals.',
  ),
  'kindness-day': one(
    'World Kindness Day is for kind words, kind deeds and kind thoughts.',
    'Kindness is catching: when people see someone being kind, they are more likely to be kind too.',
  ),
  'hello-day': one(
    'World Hello Day is for saying hello to at least ten people you meet.',
    'The day began in 1973 with two brothers who wanted people to talk to each other instead of fighting.',
  ),
};
