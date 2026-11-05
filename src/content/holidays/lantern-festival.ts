import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'The Lantern Festival falls on the 15th day of the first lunar month, under the first full moon of the new lunar year, and it brings the Lunar New Year celebrations to a close.',
    'Families hang glowing lanterns, watch lion and dragon dances, and try to solve riddles written on tags that hang from the lanterns.',
    'Many people eat tangyuan, sweet chewy rice balls in a bowl of warm soup, because their round shape stands for a family being together.',
  ],
  facts: [
    {
      text: 'In Mandarin, tangyuan (the rice balls) sounds like tuanyuan, the word for a family reunion. That is why they are the festival food.',
      wow: true,
    },
    {
      text: 'The festival is more than 2,000 years old. One story says an emperor of the Han dynasty ordered lanterns lit in the palace and temples on this night, and the custom spread.',
      bigKids: true,
    },
    {
      text: 'Guessing lantern riddles is a game that goes back centuries. Solve the riddle on a tag and you may win a small prize.',
    },
  ],
  greetings: [
    {
      lang: 'zh-Hans',
      langName: 'Mandarin Chinese',
      text: '元宵节快乐',
      roman: 'Yuanxiao jie kuaile',
      sayIt: 'ywen-SHYAO jyeh kwye-LUH',
      meaning: 'Happy Lantern Festival',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'The date follows the Chinese lunisolar calendar (the 15th day of the first month), so it moves each year, usually between early February and early March. In Chinese it is Yuanxiao Festival; in Korea the same full moon is celebrated as Jeongwol Daeboreum.',
  sources: [
    'Encyclopaedia Britannica, \'Lantern Festival\'',
    'Encyclopaedia Britannica, \'Chinese New Year\'',
  ],
};

export default content;
