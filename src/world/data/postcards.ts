/**
 * Tracker postcards: one illustrated card for each headline city on Santa's route and the New
 * Year wave. When Santa (or midnight) reaches one of these cities the globe zooms in and its
 * postcard flips in (world/postcards.ts draws it; world/album.ts keeps the collected ones).
 *
 * Each city has the local Christmas and New Year greeting (native script, romanization when the
 * script is not Latin, a kid respelling with the stressed syllable in CAPS, and the plain
 * meaning), one true and checkable fact for each card, and a description of the skyline the card
 * draws. Skylines are inspired by real landmarks, never copied: no logos, signs, flags or
 * lettering, and no figures of saints or deities (Rio's card shows the mountain, not the statue).
 *
 * The content lint in test/postcards.test.ts checks: every id is a city in cities.ts, non-Latin
 * greetings have `roman`, facts are at most 220 characters, and nothing contains a URL.
 */
import type { Greeting } from '../../content/types';

/** The weather painted on the Christmas card (New Year cards use the same). */
export type PostcardClimate = 'snowy' | 'cold' | 'mild' | 'tropical';

export interface PostcardSide {
  readonly greeting: Greeting;
  /** One surprising, kid-friendly, true fact about how the city celebrates (≤ 220 chars). */
  readonly fact: string;
}

export interface PostcardCity {
  /** A city id from cities.ts. */
  readonly id: string;
  /** What the card's skyline shows, in words (also the picture's accessible description). */
  readonly skyline: string;
  readonly climate: PostcardClimate;
  readonly christmas: PostcardSide;
  readonly newYear: PostcardSide;
}

const EN_XMAS: Greeting = { lang: 'en', langName: 'English', text: 'Merry Christmas!', sayIt: 'MEH-ree KRIS-mus', meaning: 'Have a happy Christmas' };
const EN_NY: Greeting = { lang: 'en', langName: 'English', text: 'Happy New Year!', sayIt: 'HAP-ee noo YEER', meaning: 'Have a happy new year' };
const ES_XMAS: Greeting = { lang: 'es', langName: 'Spanish', text: '¡Feliz Navidad!', sayIt: 'feh-LEES nah-vee-DAHD', meaning: 'Happy Christmas (Navidad means the Nativity)' };
const ES_NY: Greeting = { lang: 'es', langName: 'Spanish', text: '¡Feliz Año Nuevo!', sayIt: 'feh-LEES AHN-yo NWEH-vo', meaning: 'Happy new year' };
const AR_XMAS: Greeting = { lang: 'ar', langName: 'Arabic', text: 'عيد ميلاد مجيد', roman: 'ʿĪd mīlād majīd', sayIt: 'EED mee-LAHD mah-JEED', meaning: 'Glorious birthday feast (Christmas)' };

export const POSTCARDS: readonly PostcardCity[] = [
  {
    id: 'kiritimati',
    skyline: 'A coral atoll: leaning coconut palms, a calm lagoon, an outrigger canoe and a frigatebird gliding overhead.',
    climate: 'tropical',
    christmas: {
      greeting: {
        lang: 'gil', langName: 'Gilbertese (Kiribati)',
        text: 'Te Mauri, te Raoi ao te Tabomoa nakoimi nte Kirimati ao te Ririki ae Bou!',
        sayIt: 'teh MOW-ree, teh RAH-oy ah-oh teh tah-boh-MOH-ah nah-KOY-mee n-teh kee-ree-MAHS ah-oh teh ree-REE-kee eye BOH',
        meaning: 'Health, peace and blessings to you at Christmas and in the New Year',
      },
      fact: 'This island is called Christmas Island because Captain James Cook arrived here on Christmas Eve in 1777. Kiritimati is how you say Christmas in Gilbertese.',
    },
    newYear: {
      greeting: {
        lang: 'gil', langName: 'Gilbertese (Kiribati)',
        text: 'Te Mauri, te Raoi ao te Tabomoa nakoimi nte Kirimati ao te Ririki ae Bou!',
        sayIt: 'teh MOW-ree, teh RAH-oy ah-oh teh tah-boh-MOH-ah nah-KOY-mee n-teh kee-ree-MAHS ah-oh teh ree-REE-kee eye BOH',
        meaning: 'Health, peace and blessings to you at Christmas and in the New Year',
      },
      fact: 'Kiritimati is one of the very first places on Earth to reach the new year. Its clocks are 14 hours ahead of London, so it gets there before almost everyone.',
    },
  },
  {
    id: 'auckland',
    skyline: 'A tall needle tower with a round lookout pod, the low volcano cone of an island across the harbor, sailboats and a red-flowering pōhutukawa tree.',
    climate: 'mild',
    christmas: {
      greeting: { lang: 'mi', langName: 'Māori', text: 'Meri Kirihimete!', sayIt: 'MEH-ree kee-ree-HEE-meh-teh', meaning: 'Merry Christmas' },
      fact: 'In New Zealand the pōhutukawa tree bursts into bright red flowers just in time for December, so people call it the New Zealand Christmas tree.',
    },
    newYear: {
      greeting: { lang: 'mi', langName: 'Māori', text: 'Ngā mihi o te Tau Hou!', sayIt: 'ngah MEE-hee oh teh toe HOE', meaning: 'Greetings for the New Year' },
      fact: 'Auckland is one of the first big cities in the world to reach the new year, and fireworks burst from the top of its tall Sky Tower at midnight.',
    },
  },
  {
    id: 'sydney',
    skyline: 'An opera house roofed with white shell-shaped sails, a great steel arch bridge across the harbor and a tower with a golden lookout.',
    climate: 'mild',
    christmas: {
      greeting: EN_XMAS,
      fact: 'Christmas is in summer in Sydney, and shrimp are a favorite for Christmas lunch. Before Christmas the Sydney Fish Market has stayed open for 36 hours non-stop!',
    },
    newYear: {
      greeting: EN_NY,
      fact: 'Sydney has two firework shows on New Year’s Eve: an early one at 9 pm for children who can’t stay up, and a giant one over the Harbor Bridge at midnight.',
    },
  },
  {
    id: 'tokyo',
    skyline: 'A red-and-white lattice tower, a five-storey pagoda with curving roofs, city towers and snowy Mount Fuji far away.',
    climate: 'cold',
    christmas: {
      greeting: { lang: 'ja', langName: 'Japanese', text: 'メリークリスマス', roman: 'Merī Kurisumasu', sayIt: 'meh-REE koo-ree-SOO-mah-soo', meaning: 'Merry Christmas (borrowed from English)' },
      fact: 'In Japan, Christmas Eve means strawberry shortcake and buckets of fried chicken. So many families want chicken that they order it weeks ahead!',
    },
    newYear: {
      greeting: { lang: 'ja', langName: 'Japanese', text: 'あけましておめでとう', roman: 'Akemashite omedetō', sayIt: 'ah-keh-MAHSH-teh oh-meh-deh-TOH', meaning: 'Congratulations on the opening of the new year' },
      fact: 'On New Year’s Eve, temples all over Tokyo ring their big bells 108 times, one ring at a time, to say goodbye to the old year.',
    },
  },
  {
    id: 'seoul',
    skyline: 'A slim tower on a wooded mountain, a palace gate with a sweeping double roof, and glittering towers by the river.',
    climate: 'cold',
    christmas: {
      greeting: { lang: 'ko', langName: 'Korean', text: '메리 크리스마스', roman: 'Meri keuriseumaseu', sayIt: 'MEH-ree keu-ree-seu-MAH-seu', meaning: 'Merry Christmas' },
      fact: 'In Korea, Christmas Day is a public holiday, and children call Santa “Santa Haraboji”, which means Grandpa Santa.',
    },
    newYear: {
      greeting: { lang: 'ko', langName: 'Korean', text: '새해 복 많이 받으세요', roman: 'Saehae bok mani badeuseyo', sayIt: 'SEH-heh bohk MAH-nee bah-deu-SEH-yo', meaning: 'Receive lots of luck in the new year' },
      fact: 'At midnight on New Year’s Eve, a huge old bell in the middle of Seoul, called Bosingak, is rung 33 times while crowds count down.',
    },
  },
  {
    id: 'beijing',
    skyline: 'A round temple hall with three stacked blue roofs, red walls, the Great Wall winding over the hills, and modern towers.',
    climate: 'cold',
    christmas: {
      greeting: { lang: 'zh-Hans', langName: 'Mandarin Chinese', text: '圣诞快乐', roman: 'Shèngdàn kuàilè', sayIt: 'shung-DAHN kwye-LUH', meaning: 'Happy holy birth (Christmas)' },
      fact: 'In China, friends give each other shiny wrapped apples on Christmas Eve, because Christmas Eve, Píng’ān Yè, sounds a bit like píngguǒ, the word for apple.',
    },
    newYear: {
      greeting: { lang: 'zh-Hans', langName: 'Mandarin Chinese', text: '新年快乐', roman: 'Xīnnián kuàilè', sayIt: 'shin-NYEN kwye-LUH', meaning: 'Happy new year' },
      fact: 'Beijing has a holiday on January 1, but its biggest New Year is the Spring Festival in January or February, with dumplings, red lanterns and firecrackers.',
    },
  },
  {
    id: 'manila',
    skyline: 'Palm trees along the bay, an old stone church front with bell towers, city towers, star lanterns and a colorful jeepney.',
    climate: 'tropical',
    christmas: {
      greeting: { lang: 'tl', langName: 'Filipino (Tagalog)', text: 'Maligayang Pasko!', sayIt: 'mah-lee-GAH-yahng PAHS-koh', meaning: 'Happy Christmas' },
      fact: 'In Manila, Christmas songs start playing in September! Windows glow with parols, star-shaped lanterns that stand for the star of Bethlehem.',
    },
    newYear: {
      greeting: { lang: 'tl', langName: 'Filipino (Tagalog)', text: 'Manigong Bagong Taon!', sayIt: 'mah-NEE-gong bah-GONG tah-OHN', meaning: 'Prosperous new year' },
      fact: 'Filipino families set out 12 round fruits for luck at New Year, and many children jump as high as they can at midnight, hoping to grow taller.',
    },
  },
  {
    id: 'jakarta',
    skyline: 'A tall white monument topped with a golden flame, a wide dome with a slim tower, palm trees and city towers.',
    climate: 'tropical',
    christmas: {
      greeting: { lang: 'id', langName: 'Indonesian', text: 'Selamat Natal!', sayIt: 'seh-LAH-maht NAH-tahl', meaning: 'Happy Christmas (selamat means safe and well)' },
      fact: 'In Jakarta, the great Istiqlal Mosque stands across the road from the cathedral, and it has often opened its car park for families going to Christmas services.',
    },
    newYear: {
      greeting: { lang: 'id', langName: 'Indonesian', text: 'Selamat Tahun Baru!', sayIt: 'seh-LAH-maht TAH-hoon BAH-roo', meaning: 'Happy new year' },
      fact: 'Before New Year’s Eve, street sellers in Jakarta sell bright paper trumpets called terompet, and at midnight the whole city toots them.',
    },
  },
  {
    id: 'bangkok',
    skyline: 'A tall temple spire covered in patterns beside the river, golden pointed roofs, a long-tail boat and city towers.',
    climate: 'tropical',
    christmas: {
      greeting: { lang: 'th', langName: 'Thai', text: 'สุขสันต์วันคริสต์มาส', roman: 'Suk san wan Khrit-mat', sayIt: 'sook-SAHN wahn KRIT-maht', meaning: 'Happy Christmas Day' },
      fact: 'Most people in Bangkok are Buddhist and Christmas is a normal school day, but the city’s shopping streets still glitter with giant Christmas trees.',
    },
    newYear: {
      greeting: { lang: 'th', langName: 'Thai', text: 'สวัสดีปีใหม่', roman: 'Sawatdi pi mai', sayIt: 'sah-waht-DEE pee MY', meaning: 'Hello, new year!' },
      fact: 'Thailand gets three New Years: January 1, Chinese New Year, and Songkran in April, when everyone splashes each other with water.',
    },
  },
  {
    id: 'kolkata',
    skyline: 'A giant steel bridge over the river, a white marble memorial hall with a dome, and a yellow taxi.',
    climate: 'mild',
    christmas: {
      greeting: { lang: 'bn', langName: 'Bengali', text: 'শুভ বড়দিন', roman: 'Shubho Borodin', sayIt: 'SHOO-bho BOH-roh-din', meaning: 'Happy Big Day (Christmas)' },
      fact: 'In Kolkata, Christmas is called Boro Din, the Big Day. Park Street is hung with thousands of lights, and families of every faith come to see them.',
    },
    newYear: {
      greeting: { lang: 'bn', langName: 'Bengali', text: 'শুভ নববর্ষ', roman: 'Shubho Noboborsho', sayIt: 'SHOO-bho noh-boh-BOR-show', meaning: 'Happy new year' },
      fact: 'January 1 is picnic day in Kolkata! Families head to parks, gardens and the zoo, which has some of its busiest days of the whole year.',
    },
  },
  {
    id: 'dubai',
    skyline: 'The world’s tallest needle-shaped tower, a hotel shaped like a billowing sail, a wooden dhow boat and golden dunes.',
    climate: 'mild',
    christmas: {
      greeting: AR_XMAS,
      fact: 'People from all over the world live in Dubai, so St Mary’s Church holds Christmas services in many languages, including Arabic, Tagalog and Malayalam.',
    },
    newYear: {
      greeting: { lang: 'ar', langName: 'Arabic', text: 'سنة جديدة سعيدة', roman: 'Sana jadīda saʿīda', sayIt: 'SAH-nah jah-DEE-dah sah-EE-dah', meaning: 'Happy new year' },
      fact: 'At midnight, fireworks shoot out of the world’s tallest building, which is 828 meters high. That is taller than two Eiffel Towers on top of each other!',
    },
  },
  {
    id: 'nairobi',
    skyline: 'A round tower with a flat cap and a cone-roofed hall, city towers, flat-topped acacia trees and a giraffe in the park.',
    climate: 'mild',
    christmas: {
      greeting: { lang: 'sw', langName: 'Swahili', text: 'Krismasi Njema!', sayIt: 'krees-MAH-see n-JEH-mah', meaning: 'Good Christmas' },
      fact: 'At Christmas many Nairobi families travel “upcountry” to their home villages to celebrate with grandparents, and share nyama choma, roasted meat.',
    },
    newYear: {
      greeting: { lang: 'sw', langName: 'Swahili', text: 'Heri ya Mwaka Mpya!', sayIt: 'HEH-ree yah MWAH-kah m-PYAH', meaning: 'Happiness for the new year' },
      fact: 'Nairobi reaches the new year at the very same moment as Moscow, three hours before London. Many churches hold “crossover” services through midnight.',
    },
  },
  {
    id: 'moscow',
    skyline: 'A cathedral crowned with bright striped onion domes, a red fortress wall with a pointed tower, and falling snow.',
    climate: 'snowy',
    christmas: {
      greeting: { lang: 'ru', langName: 'Russian', text: 'С Рождеством!', roman: 'S Rozhdestvom!', sayIt: 's rozh-dest-VOM', meaning: '(Greetings) on the Nativity' },
      fact: 'Most families in Moscow celebrate Christmas on January 7, not December 25, because the Russian Orthodox Church follows the old Julian calendar.',
    },
    newYear: {
      greeting: { lang: 'ru', langName: 'Russian', text: 'С Новым годом!', roman: 'S Novym godom!', sayIt: 'SNO-vim GO-dum', meaning: '(Greetings) on the new year' },
      fact: 'In Moscow, presents come at New Year, not Christmas! They are brought by Ded Moroz, Grandfather Frost, and his granddaughter Snegurochka, the Snow Maiden.',
    },
  },
  {
    id: 'istanbul',
    skyline: 'A great mosque with a cascade of domes and slim minarets, a round stone tower with a cone roof, and a ferry on the strait.',
    climate: 'cold',
    christmas: {
      greeting: { lang: 'tr', langName: 'Turkish', text: 'Mutlu Noeller!', sayIt: 'moot-LOO no-el-LEHR', meaning: 'Happy Christmases' },
      fact: 'The real Saint Nicholas, who inspired Santa Claus, was a bishop in Myra, a town in what is now Turkey, about 1,700 years ago.',
    },
    newYear: {
      greeting: { lang: 'tr', langName: 'Turkish', text: 'Mutlu Yıllar!', sayIt: 'moot-LOO yuh-LAHR', meaning: 'Happy years' },
      fact: 'In Istanbul many families decorate a “New Year tree”, and Noel Baba, Father Christmas, brings small presents on New Year’s Eve.',
    },
  },
  {
    id: 'cairo',
    skyline: 'The pyramids on the edge of the desert, a lattice tower shaped like a lotus, domes and minarets, and a felucca sailing on the Nile.',
    climate: 'mild',
    christmas: {
      greeting: { ...AR_XMAS, langName: 'Arabic (Egypt)' },
      fact: 'Most Christians in Cairo are Copts. They celebrate Christmas on January 7, after 43 days of fasting, with a midnight church service and a big feast.',
    },
    newYear: {
      greeting: { lang: 'arz', langName: 'Egyptian Arabic', text: 'كل سنة وانت طيب', roman: 'Kull sana w enta tayyeb', sayIt: 'kull SAH-nah wen-tah TAY-yeb', meaning: 'May you be well every year' },
      fact: 'Egypt has three New Years: January 1, Nayrouz, the Coptic New Year in September, and the Islamic New Year, which moves with the moon.',
    },
  },
  {
    id: 'athens',
    skyline: 'An ancient temple with rows of columns on top of a rocky hill, olive trees and white houses below.',
    climate: 'mild',
    christmas: {
      greeting: { lang: 'el', langName: 'Greek', text: 'Καλά Χριστούγεννα!', roman: 'Kalá Christoúgenna!', sayIt: 'kah-LAH hree-STOO-yeh-nah', meaning: 'Good Christmas' },
      fact: 'On the morning of Christmas Eve, children in Athens go door to door singing carols called kalanta, ringing little metal triangles, and get treats.',
    },
    newYear: {
      greeting: { lang: 'el', langName: 'Greek', text: 'Καλή Χρονιά!', roman: 'Kalí Chroniá!', sayIt: 'kah-LEE hro-NYAH', meaning: 'Good year' },
      fact: 'In Greece, presents come from Saint Basil on January 1, and families cut a vasilopita cake with a coin hidden inside. Whoever finds it has luck all year.',
    },
  },
  {
    id: 'paris',
    skyline: 'An iron lattice tower, gray slate rooftops with chimney pots, and the river Seine with a stone bridge.',
    climate: 'cold',
    christmas: {
      greeting: { lang: 'fr', langName: 'French', text: 'Joyeux Noël !', sayIt: 'zhwah-YUH no-EL', meaning: 'Joyful Christmas' },
      fact: 'Many French families end their Christmas Eve feast, le réveillon, with a bûche de Noël: a rolled-up cake decorated to look like a log.',
    },
    newYear: {
      greeting: { lang: 'fr', langName: 'French', text: 'Bonne année !', sayIt: 'bun ah-NAY', meaning: 'Good year' },
      fact: 'In France, people kiss under the mistletoe at New Year, not at Christmas. The old saying is “Au gui l’an neuf!”: to the mistletoe, the new year!',
    },
  },
  {
    id: 'london',
    skyline: 'A tall clock tower beside the river, a giant observation wheel and a red double-decker bus on the embankment.',
    climate: 'cold',
    christmas: {
      greeting: { lang: 'en', langName: 'English (British)', text: 'Happy Christmas!', sayIt: 'HAP-ee KRIS-mus', meaning: 'What many people in Britain say instead of Merry Christmas' },
      fact: 'Christmas crackers were invented in London by a sweet maker called Tom Smith in the 1840s. Pull one with a friend: snap! Out falls a paper crown.',
    },
    newYear: {
      greeting: EN_NY,
      fact: 'At midnight the great bell known as Big Ben bongs 12 times, and fireworks fill the sky over the River Thames.',
    },
  },
  {
    id: 'reykjavik',
    skyline: 'A tall church tower stepped like columns of rock, colorful little houses with snowy roofs, a flat-topped mountain and the northern lights.',
    climate: 'snowy',
    christmas: {
      greeting: { lang: 'is', langName: 'Icelandic', text: 'Gleðileg jól!', sayIt: 'GLEH-thi-leg YOHL', meaning: 'Joyful Yule' },
      fact: 'Icelanders give each other books on Christmas Eve and stay up reading them. So many books are sold that it is called the Christmas Book Flood, Jólabókaflóð.',
    },
    newYear: {
      greeting: { lang: 'is', langName: 'Icelandic', text: 'Gleðilegt nýtt ár!', sayIt: 'GLEH-thi-lekt neet OWR', meaning: 'Joyful new year' },
      fact: 'On New Year’s Eve, people in Reykjavík gather round big bonfires, then nearly everyone sets off fireworks at midnight and the whole sky sparkles.',
    },
  },
  {
    id: 'lagos',
    skyline: 'A very long bridge across the lagoon, tall city towers, palm trees and a yellow minibus.',
    climate: 'tropical',
    christmas: {
      greeting: { lang: 'yo', langName: 'Yoruba', text: 'Ẹ kú ọdún!', sayIt: 'eh KOO aw-DOON', meaning: 'Greetings for the festive season' },
      fact: 'In Lagos, Christmas lunch is often a big pot of smoky jollof rice with fried plantain, called dodo, and chicken, shared with family, friends and neighbors.',
    },
    newYear: {
      greeting: { lang: 'yo', langName: 'Yoruba', text: 'Ẹ kú ọdún tuntun!', sayIt: 'eh KOO aw-DOON toon-TOON', meaning: 'Greetings for the new year' },
      fact: 'Many Lagos families spend New Year’s Eve at a “crossover” church service, singing and dancing as the clock ticks over into the new year.',
    },
  },
  {
    id: 'rio',
    skyline: 'A rounded granite mountain with a cable car, a tall peak behind the bay, a wavy beach promenade and palm trees.',
    climate: 'tropical',
    christmas: {
      greeting: { lang: 'pt', langName: 'Portuguese (Brazil)', text: 'Feliz Natal!', sayIt: 'feh-LEEZ nah-TOW', meaning: 'Happy Christmas' },
      fact: 'Christmas is in summer in Rio. Families share a big supper called the ceia late on Christmas Eve, and many head to the beach on Christmas Day.',
    },
    newYear: {
      greeting: { lang: 'pt', langName: 'Portuguese (Brazil)', text: 'Feliz Ano Novo!', sayIt: 'feh-LEEZ AH-noo NOH-voo', meaning: 'Happy new year' },
      fact: 'On New Year’s Eve, people in Rio dress in white and crowd onto Copacabana beach. For luck, they jump over seven little waves at midnight.',
    },
  },
  {
    id: 'buenos-aires',
    skyline: 'A tall white obelisk in a wide avenue, a domed palace, and brightly painted houses by the old port.',
    climate: 'mild',
    christmas: {
      greeting: ES_XMAS,
      fact: 'It is summer at Christmas in Buenos Aires, so families eat cold dishes like vitel toné, veal with tuna sauce, and set off fireworks at midnight.',
    },
    newYear: {
      greeting: ES_NY,
      fact: 'On the last working day of the year, office workers in Buenos Aires throw shredded paper out of the windows, and the streets fill with paper snow.',
    },
  },
  {
    id: 'mexico-city',
    skyline: 'A tall column with a golden top on a roundabout, a skyscraper, colorful houses, and a snowy volcano in the distance.',
    climate: 'mild',
    christmas: {
      greeting: ES_XMAS,
      fact: 'From December 16 to 24, Mexico City has nine nights of posadas: parties with candles, songs and a star-shaped piñata to break.',
    },
    newYear: {
      greeting: ES_NY,
      fact: 'At midnight, people in Mexico City eat 12 grapes, one for each chime of the clock, and make a wish with every grape.',
    },
  },
  {
    id: 'new-york',
    skyline: 'A stepped skyscraper with a tall spire, a tower with a sunburst crown, and a stone bridge with pointed arches over the river.',
    climate: 'cold',
    christmas: {
      greeting: EN_XMAS,
      fact: 'A giant tree is lit each year at Rockefeller Center. After Christmas, its wood has been milled into planks to help build homes for families.',
    },
    newYear: {
      greeting: EN_NY,
      fact: 'A glowing ball has dropped in Times Square every New Year’s Eve since 1907, except in 1942 and 1943, when the lights were dimmed during the war.',
    },
  },
  {
    id: 'chicago',
    skyline: 'A tall black stepped tower with two antennas, a tapering tower with criss-cross bracing, a bridge over the river and falling snow.',
    climate: 'snowy',
    christmas: {
      greeting: EN_XMAS,
      fact: 'Since 1996, Chicago has held a German-style Christmas market downtown, the Christkindlmarket, with wooden huts, gingerbread and hot drinks.',
    },
    newYear: {
      greeting: EN_NY,
      fact: 'When midnight reaches Chicago, New York has already been in the new year for an hour, and Los Angeles must wait two hours more.',
    },
  },
  {
    id: 'los-angeles',
    skyline: 'An observatory with three domes on a hill, tall palm trees, downtown towers and mountains behind.',
    climate: 'mild',
    christmas: {
      greeting: EN_XMAS,
      fact: 'Los Angeles has held a Hollywood Christmas Parade since 1928. It started as the Santa Claus Lane Parade, with Santa riding down Hollywood Boulevard.',
    },
    newYear: {
      greeting: EN_NY,
      fact: 'On January 1 the Rose Parade rolls through Pasadena, next door to LA. Every bit of each float must be covered in flowers, seeds or other plants.',
    },
  },
  {
    id: 'anchorage',
    skyline: 'Snowy mountains behind a small downtown, spruce trees, a moose, and green northern lights in the sky.',
    climate: 'snowy',
    christmas: {
      greeting: EN_XMAS,
      fact: 'At Christmas the sun rises in Anchorage at about 10 am and sets before 4 pm, so the holiday lights glow for most of the day.',
    },
    newYear: {
      greeting: EN_NY,
      fact: 'Anchorage is one of the last places in the USA to reach the new year. Only Hawaii, the far Aleutian Islands and American Samoa get there later.',
    },
  },
  {
    id: 'honolulu',
    skyline: 'A volcanic crater headland by the sea, palm trees, a clock tower by the harbor, surfboards and gentle waves.',
    climate: 'tropical',
    christmas: {
      greeting: { lang: 'haw', langName: 'Hawaiian', text: 'Mele Kalikimaka!', sayIt: 'MEH-leh kah-lee-kee-MAH-kah', meaning: 'Merry Christmas' },
      fact: 'Every December a giant Santa in an aloha shirt, called Shaka Santa, sits outside Honolulu Hale, the city hall, waving the shaka sign with his hand.',
    },
    newYear: {
      greeting: { lang: 'haw', langName: 'Hawaiian', text: 'Hauʻoli Makahiki Hou!', sayIt: 'how-OH-lee mah-kah-HEE-kee HOH', meaning: 'Happy new year' },
      fact: 'In Honolulu, many families welcome the new year with mochi rice cakes and noisy firecrackers, traditions brought to Hawaii by Japanese and Chinese families.',
    },
  },
];

const BY_ID = new Map(POSTCARDS.map((p) => [p.id, p] as const));

/** The postcard for a city, if it is a headline city. */
export function postcardFor(cityId: string): PostcardCity | undefined {
  return BY_ID.get(cityId);
}
