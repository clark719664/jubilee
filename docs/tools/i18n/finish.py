"""Applies every safety fix to raw translations, then writes them for install.py.

    python finish.py <results-dir> <ingredients.json> <output-dir>

Machine translation got allergens dangerously wrong in testing (sesame became ginger, peanuts became
corn), so allergen words come from the hand-checked overrides.json, and ingredient lines keep the
English beside the translation so a parent can check them.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = {
    'latin': r'[A-Za-zÀ-ɏ]', 'cyrillic': r'[Ѐ-ӿ]', 'arabic': r'[؀-ۿ]', 'devanagari': r'[ऀ-ॣ०-ॿ]',
    'bengali': r'[ঀ-৿]', 'han': r'[一-鿿]', 'telugu': r'[ఀ-౿]', 'tamil': r'[஀-௿]', 'hangul': r'[가-힣]', 'kana': r'[぀-ヿ]',
}
OWN = {'es': 'latin', 'fr': 'latin', 'pt': 'latin', 'id': 'latin', 'ru': 'cyrillic', 'ar': 'arabic', 'ur': 'arabic', 'hi': 'devanagari', 'bn': 'bengali', 'zh': 'han',
       'de': 'latin', 'tr': 'latin', 'vi': 'latin', 'tl': 'latin', 'ja': 'han', 'ko': 'hangul', 'ta': 'tamil', 'te': 'telugu', 'mr': 'devanagari'}
VERB_LAST = {'hi', 'bn', 'ur', 'mr', 'te', 'ta', 'ja', 'ko', 'tr'}
HAND = {
    'hi': {'Surprise!': 'आश्चर्य!'}, 'bn': {'Back': 'পেছনে'}, 'zh': {'World': '世界'}, 'ur': {'Stickers': 'اسٹیکر', 'Play': 'کھیلیں', 'Undo': 'واپس کریں', 'Play now': 'ابھی کھیلیں!'},
}
# Santa's reindeer and the dreidel's letters are names. Machine translation guessed at them (and twice
# turned one into Rudolph, who stays out of the app), so they are written by hand. None keeps the English.
REINDEER = ('Dasher', 'Dancer', 'Prancer', 'Vixen', 'Comet', 'Cupid', 'Donder', 'Blitzen')
LETTERS = ('Nun', 'Gimel', 'Hei', 'Shin')
NAMES = {
    'es': (('Brioso', 'Bailarín', 'Pompón', 'Juguetón', 'Cometa', 'Cupido', 'Trueno', 'Relámpago'), ('Nun', 'Guímel', 'He', 'Shin')),
    'fr': (('Tornade', 'Danseur', 'Furie', 'Fringant', 'Comète', 'Cupidon', 'Tonnerre', 'Éclair'), ('Noun', 'Guimel', 'Hé', 'Shin')),
    'pt': (('Corredor', 'Dançarino', 'Empinador', 'Raposa', 'Cometa', 'Cupido', 'Trovão', 'Relâmpago'), ('Nun', 'Guímel', 'Hê', 'Shin')),
    'de': (('Dasher', 'Dancer', 'Prancer', 'Vixen', 'Komet', 'Amor', 'Donner', 'Blitzen'), ('Nun', 'Gimel', 'He', 'Schin')),
    'ru': (('Дэшер', 'Дэнсер', 'Прэнсер', 'Виксен', 'Комета', 'Купидон', 'Доннер', 'Блитцен'), ('Нун', 'Гимель', 'Хей', 'Шин')),
    'zh': (('冲刺者', '舞蹈者', '腾跃者', '小狐狸', '彗星', '丘比特', '雷霆', '闪电'), None),
    'ja': (('ダッシャー', 'ダンサー', 'プランサー', 'ヴィクセン', 'コメット', 'キューピッド', 'ドンダー', 'ブリッツェン'), ('ヌン', 'ギメル', 'ヘー', 'シン')),
    'ko': (('대셔', '댄서', '프랜서', '빅슨', '코밋', '큐피드', '돈더', '블리첸'), ('눈', '기멜', '헤이', '신')),
    'hi': (('डैशर', 'डांसर', 'प्रैंसर', 'विक्सन', 'कॉमेट', 'क्यूपिड', 'डोंडर', 'ब्लिट्ज़ेन'), ('नून', 'गिमेल', 'हे', 'शिन')),
    'mr': (('डॅशर', 'डान्सर', 'प्रान्सर', 'विक्सन', 'कॉमेट', 'क्युपिड', 'डॉन्डर', 'ब्लिट्झेन'), ('नून', 'गिमेल', 'हे', 'शिन')),
    'bn': (('ড্যাশার', 'ড্যান্সার', 'প্র্যান্সার', 'ভিক্সেন', 'কমেট', 'কিউপিড', 'ডনডার', 'ব্লিটজেন'), ('নুন', 'গিমেল', 'হে', 'শিন')),
    'ar': (('داشر', 'دانسر', 'برانسر', 'فيكسن', 'كوميت', 'كيوبيد', 'دوندر', 'بليتزن'), ('نون', 'جيمل', 'هيه', 'شين')),
    'ur': (('ڈیشر', 'ڈانسر', 'پرانسر', 'وکسن', 'کومٹ', 'کیوپڈ', 'ڈونڈر', 'بلٹزن'), ('نون', 'گیمل', 'ہے', 'شین')),
    'ta': (('டாஷர்', 'டான்சர்', 'பிரான்சர்', 'விக்சன்', 'காமெட்', 'கியூபிட்', 'டோண்டர்', 'பிளிட்சன்'), ('நூன்', 'கிமெல்', 'ஹே', 'ஷின்')),
    'te': (('డాషర్', 'డాన్సర్', 'ప్రాన్సర్', 'విక్సెన్', 'కామెట్', 'క్యూపిడ్', 'డోండర్', 'బ్లిట్జెన్'), ('నూన్', 'గిమెల్', 'హే', 'షిన్')),
    'tr': (None, ('Nun', 'Gimel', 'He', 'Şin')),
    'vi': (None, None), 'id': (None, None), 'tl': (None, None),
}
# Lines the translator took in the wrong sense: a firework "Ring" as a finger ring, "Following Santa" as an order,
# "in {time}" as a year.
WORDS = {
    'es': {'Ring': 'Aro', 'Lead': 'Líder', 'Following Santa': 'Siguiendo a Papá Noel'},
    'pt': {'Ring': 'Aro', 'Lead': 'Líder', 'Following Santa': 'Acompanhando o Papai Noel'},
    'fr': {'Lotus': 'Lotus', 'Lead': 'En tête', 'Following Santa': 'Suivi du Père Noël'},
    'de': {'Lead': 'Anführer', 'Following Santa': 'Weihnachtsmann im Blick', 'Live flight': 'Im Flug'},
    'ru': {'Lead': 'Вожак', 'Following Santa': 'Следим за Сантой', 'Source': 'Источник'},
    'zh': {'Source': '来源', 'Lead': '领头', 'Following Santa': '正在跟随圣诞老人', 'Coming up': '下一站', 'Live flight': '飞行中',
           'Santa takes off from the North Pole in {time}!': '{time}后，圣诞老人就要从北极出发啦！', 'Your tower was {n} {noun} tall!': '你的塔有 {n} {noun}高！'},
    'ja': {'Source': '出典', 'Ring': '輪', 'Lotus': '蓮の花', 'Lead': '先頭', 'Following Santa': 'サンタさんを追跡中', 'Live flight': '飛行中'},
    'ko': {'Ring': '고리', 'You': '나', 'Lead': '선두', 'Following Santa': '산타 따라가는 중', 'Coming up': '다음 장소', 'Live flight': '비행 중'},
    'tr': {'Lotus': 'Nilüfer', 'Lead': 'Öncü', 'Following Santa': "Noel Baba'yı takip ediyoruz"},
    'vi': {'Saffron': 'Nghệ tây', 'Lead': 'Dẫn đầu', 'Following Santa': 'Đang theo dõi Ông già Noel'},
    'id': {'Ring': 'Lingkaran', 'Lead': 'Pemimpin', 'Following Santa': 'Mengikuti Santa'},
    'tl': {'Lead': 'Nangunguna', 'Following Santa': 'Sinusundan si Santa'},
    'hi': {'Ring': 'छल्ला'}, 'bn': {'Ring': 'বলয়'}, 'ur': {'Aqua': 'آبی', 'Madrid': 'میڈرڈ'},
}
# The runner hides each {slot} as XQ0X; sometimes the model spelled that out in its own script, too.
SPELLED = r'(?:एक्स|এক্স|எக்ஸ்|ఎక్స్|ایکس|إكس|エックス|엑스|[Ээ]кс)[\s\u200c]*(?:क्यू|কিউ|க்யூ|క్యూ|کیو|كيو|キュー|큐|[Кк]ью)'
JUNK = re.compile(r'XQ|' + SPELLED)
# Usually it is the spelled-out token followed by the real slot in brackets, so the slot alone is kept.
REPAIR = re.compile(r'[\'"‘“]?' + SPELLED + r'[^()\n]{0,16}?[\'"’”]?\s*\((\{\w+\})\)')
BRACKETED = re.compile(r'\((\{\w+\})\)')
RUDOLPH = re.compile(r'Rudol|Rodolf|Рудольф|ルドルフ|루돌프|鲁道夫|魯道夫|रुडोल्फ|রুডল্ফ|رودولف|روڈولف|ருடால்ஃப்|రుడాల్ఫ్', re.I)

# Holiday names the translator turned into greetings ("Holi" into "Hello!", "Thanksgiving" into "Thank you!").
HOLIDAY_NAMES = {
    'es': {'Holi': 'Holi', 'Canada Day': 'Día de Canadá'},
    'zh': {'Holi': '洒红节', "New Year's Day": '元旦', 'Pi Day': '圆周率日'},
    'hi': {'Holi': 'होली'}, 'ar': {'Holi': 'هولي'}, 'fr': {'Holi': 'Holi', 'Thanksgiving': 'Thanksgiving'},
    'pt': {'Holi': 'Holi'}, 'ru': {'Holi': 'Холи'}, 'ur': {'Earth Day': 'یومِ ارض'}, 'id': {'Holi': 'Holi'},
    'de': {'Holi': 'Holi', 'Pancake Day': 'Pfannkuchentag'}, 'ja': {'Holi': 'ホーリー', 'Easter': 'イースター'},
    'tr': {'Holi': 'Holi', 'Pancake Day': 'Krep Günü'}, 'vi': {'Holi': 'Holi'},
    'ko': {'Holi': '홀리', 'Halloween': '핼러윈', 'Nowruz': '노루즈', 'Pancake Day': '팬케이크 데이', 'Pi Day': '파이 데이', 'Purim': '부림절',
           'Ramadan': '라마단', "St Patrick's Day": '성 패트릭의 날'},
    'ta': {"New Year's Day": 'புத்தாண்டு தினம்'}, 'mr': {'Grandparents Day': 'आजी-आजोबा दिन', 'Three Kings Day': 'तीन राजांचा दिवस'},
    'tl': {'Holi': 'Holi'},
}
# "in {sleeps}" around a whole count ("3 nights"), which now carries its own noun.
IN_SLEEPS = {
    'es': 'en {sleeps}', 'zh': '{sleeps}后', 'hi': '{sleeps} में', 'ar': 'بعد {sleeps}', 'fr': 'dans {sleeps}', 'bn': '{sleeps} পরে',
    'pt': 'em {sleeps}', 'ru': 'через {sleeps}', 'ur': '{sleeps} میں', 'id': 'dalam {sleeps}', 'de': 'in {sleeps}', 'ja': 'あと{sleeps}と',
    'tr': '{sleeps} sonra', 'vi': 'sau {sleeps}', 'ko': '{sleeps} 뒤', 'ta': '{sleeps} கழித்து', 'te': '{sleeps} తర్వాత', 'mr': '{sleeps} नंतर',
    'tl': 'sa loob ng {sleeps}',
}
# Recipe amounts get followed, so like the allergen words they are written by hand: machine translation turned
# "½ tbsp" into teaspoons and "1 can" into "1 is able".
UNIT_KEYS = ('{n} cup', '{n} cups', '{n} tbsp', '{n} tsp', '{n} pinch', '{n} pinches', '{n} slice', '{n} slices', '{n} can', '{n} cans',
             '{n} sheet', '{n} sheets', '{n} min', '{n} hour', '{n} hours', 'Serves {n}')
UNITS = {
    'es': ('{n} taza', '{n} tazas', '{n} cda.', '{n} cdta.', '{n} pizca', '{n} pizcas', '{n} rebanada', '{n} rebanadas', '{n} lata', '{n} latas',
           '{n} hoja', '{n} hojas', '{n} min', '{n} hora', '{n} horas', 'Para {n} personas'),
    'fr': ('{n} tasse', '{n} tasses', '{n} c. à soupe', '{n} c. à café', '{n} pincée', '{n} pincées', '{n} tranche', '{n} tranches', '{n} boîte', '{n} boîtes',
           '{n} feuille', '{n} feuilles', '{n} min', '{n} heure', '{n} heures', 'Pour {n} personnes'),
    'pt': ('{n} xícara', '{n} xícaras', '{n} c. de sopa', '{n} c. de chá', '{n} pitada', '{n} pitadas', '{n} fatia', '{n} fatias', '{n} lata', '{n} latas',
           '{n} folha', '{n} folhas', '{n} min', '{n} hora', '{n} horas', 'Serve {n} pessoas'),
    'de': ('{n} Tasse', '{n} Tassen', '{n} EL', '{n} TL', '{n} Prise', '{n} Prisen', '{n} Scheibe', '{n} Scheiben', '{n} Dose', '{n} Dosen',
           '{n} Blatt', '{n} Blätter', '{n} Min.', '{n} Stunde', '{n} Stunden', 'Für {n} Personen'),
    'ru': ('{n} чашка', '{n} чашки', '{n} ст. л.', '{n} ч. л.', '{n} щепотка', '{n} щепотки', '{n} ломтик', '{n} ломтика', '{n} банка', '{n} банки',
           '{n} лист', '{n} листа', '{n} мин', '{n} ч', '{n} ч', 'Порций: {n}'),
    'zh': ('{n} 杯', '{n} 杯', '{n} 汤匙', '{n} 茶匙', '{n} 撮', '{n} 撮', '{n} 片', '{n} 片', '{n} 罐', '{n} 罐',
           '{n} 张', '{n} 张', '{n} 分钟', '{n} 小时', '{n} 小时', '{n} 人份'),
    'ja': ('{n}カップ', '{n}カップ', '大さじ{n}', '小さじ{n}', '{n}つまみ', '{n}つまみ', '{n}枚', '{n}枚', '{n}缶', '{n}缶',
           '{n}枚', '{n}枚', '{n}分', '{n}時間', '{n}時間', '{n}人分'),
    'ko': ('{n}컵', '{n}컵', '{n}큰술', '{n}작은술', '{n}꼬집', '{n}꼬집', '{n}조각', '{n}조각', '{n}캔', '{n}캔',
           '{n}장', '{n}장', '{n}분', '{n}시간', '{n}시간', '{n}인분'),
    'tr': ('{n} su bardağı', '{n} su bardağı', '{n} yemek kaşığı', '{n} çay kaşığı', '{n} tutam', '{n} tutam', '{n} dilim', '{n} dilim', '{n} kutu', '{n} kutu',
           '{n} yaprak', '{n} yaprak', '{n} dk', '{n} saat', '{n} saat', '{n} kişilik'),
    'vi': ('{n} cốc', '{n} cốc', '{n} muỗng canh', '{n} muỗng cà phê', '{n} nhúm', '{n} nhúm', '{n} lát', '{n} lát', '{n} lon', '{n} lon',
           '{n} tờ', '{n} tờ', '{n} phút', '{n} giờ', '{n} giờ', 'Đủ cho {n} người'),
    'id': ('{n} cangkir', '{n} cangkir', '{n} sdm', '{n} sdt', '{n} jumput', '{n} jumput', '{n} iris', '{n} iris', '{n} kaleng', '{n} kaleng',
           '{n} lembar', '{n} lembar', '{n} menit', '{n} jam', '{n} jam', 'Untuk {n} orang'),
    'tl': ('{n} tasa', '{n} tasa', '{n} kutsara', '{n} kutsarita', '{n} kurot', '{n} kurot', '{n} hiwa', '{n} hiwa', '{n} lata', '{n} lata',
           '{n} piraso', '{n} piraso', '{n} minuto', '{n} oras', '{n} oras', 'Para sa {n} tao'),
    'hi': ('{n} कप', '{n} कप', '{n} बड़ा चम्मच', '{n} छोटा चम्मच', '{n} चुटकी', '{n} चुटकी', '{n} स्लाइस', '{n} स्लाइस', '{n} डिब्बा', '{n} डिब्बे',
           '{n} शीट', '{n} शीट', '{n} मिनट', '{n} घंटा', '{n} घंटे', '{n} लोगों के लिए'),
    'mr': ('{n} कप', '{n} कप', '{n} मोठा चमचा', '{n} छोटा चमचा', '{n} चिमूट', '{n} चिमूट', '{n} काप', '{n} काप', '{n} डबा', '{n} डबे',
           '{n} शीट', '{n} शीट', '{n} मिनिटे', '{n} तास', '{n} तास', '{n} जणांसाठी'),
    'bn': ('{n} কাপ', '{n} কাপ', '{n} টেবিল চামচ', '{n} চা চামচ', '{n} চিমটি', '{n} চিমটি', '{n} টুকরো', '{n} টুকরো', '{n} ক্যান', '{n} ক্যান',
           '{n} শিট', '{n} শিট', '{n} মিনিট', '{n} ঘণ্টা', '{n} ঘণ্টা', '{n} জনের জন্য'),
    'ar': ('{n} كوب', '{n} أكواب', '{n} ملعقة كبيرة', '{n} ملعقة صغيرة', '{n} رشة', '{n} رشات', '{n} شريحة', '{n} شرائح', '{n} علبة', '{n} علب',
           '{n} ورقة', '{n} أوراق', '{n} دقيقة', '{n} ساعة', '{n} ساعات', 'يكفي {n} أشخاص'),
    'ur': ('{n} کپ', '{n} کپ', '{n} کھانے کا چمچ', '{n} چائے کا چمچ', '{n} چٹکی', '{n} چٹکی', '{n} سلائس', '{n} سلائس', '{n} ڈبہ', '{n} ڈبے',
           '{n} شیٹ', '{n} شیٹ', '{n} منٹ', '{n} گھنٹہ', '{n} گھنٹے', '{n} افراد کے لیے'),
    'ta': ('{n} கப்', '{n} கப்', '{n} மேசைக்கரண்டி', '{n} தேக்கரண்டி', '{n} சிட்டிகை', '{n} சிட்டிகை', '{n} துண்டு', '{n} துண்டுகள்', '{n} டப்பா', '{n} டப்பாக்கள்',
           '{n} தாள்', '{n} தாள்கள்', '{n} நிமிடம்', '{n} மணி நேரம்', '{n} மணி நேரம்', '{n} பேருக்கு'),
    'te': ('{n} కప్పు', '{n} కప్పులు', '{n} టేబుల్ స్పూన్', '{n} టీస్పూన్', '{n} చిటికెడు', '{n} చిటికెలు', '{n} ముక్క', '{n} ముక్కలు', '{n} డబ్బా', '{n} డబ్బాలు',
           '{n} షీట్', '{n} షీట్లు', '{n} నిమిషాలు', '{n} గంట', '{n} గంటలు', '{n} మందికి'),
}

FOUND = {
    'es': '{n} de {total} encontrados', 'zh': '已找到 {n} / {total}', 'hi': '{total} में से {n} मिले', 'ar': 'تم العثور على {n} من {total}',
    'fr': '{n} sur {total} trouvés', 'bn': '{total}টির মধ্যে {n}টি পাওয়া গেছে', 'pt': '{n} de {total} encontrados', 'ru': 'Найдено {n} из {total}',
    'ur': '{total} میں سے {n} ملے', 'id': '{n} dari {total} ditemukan',
    'de': '{n} von {total} gefunden', 'ja': '{total} こ中 {n} こ見つけた', 'tr': '{total} içinden {n} bulundu', 'vi': 'Đã tìm thấy {n}/{total}', 'ko': '{total}개 중 {n}개 찾음',
    'ta': '{total} இல் {n} கண்டுபிடிக்கப்பட்டது', 'te': '{total} లో {n} దొరికాయి', 'mr': '{total} पैकी {n} सापडले', 'tl': '{n} sa {total} ang nakita',
}


# "Sleeps" is the app's own word for nights left, and machine translation can't guess that.
SLEEPS = {
    'es': ('noches', 'noche', '{sleeps} para {name}', 'en {n} noches', '{n} noches para {name}'),
    'zh': ('个晚上', '个晚上', '{sleeps}后就是{name}', '{n} 个晚上后', '再过 {n} 个晚上就是{name}'),
    'hi': ('रातें', 'रात', '{sleeps} {name} तक', '{n} रातों में', '{name} तक {n} रातें'),
    'ar': ('ليالٍ', 'ليلة', '{sleeps} حتى {name}', 'بعد {n} ليالٍ', '{n} ليالٍ حتى {name}'),
    'fr': ('nuits', 'nuit', '{sleeps} avant {name}', 'dans {n} nuits', '{n} nuits avant {name}'),
    'bn': ('রাত', 'রাত', '{sleeps} বাকি, {name} পর্যন্ত', '{n} রাত পরে', '{name} পর্যন্ত {n} রাত'),
    'pt': ('noites', 'noite', '{sleeps} até {name}', 'em {n} noites', '{n} noites até {name}'),
    'ru': ('ночей', 'ночь', '{sleeps} до праздника {name}', 'через {n} ночей', '{n} ночей до праздника {name}'),
    'ur': ('راتیں', 'رات', '{name} تک {sleeps}', '{n} راتوں میں', '{name} تک {n} راتیں'),
    'id': ('malam', 'malam', '{sleeps} lagi menuju {name}', 'dalam {n} malam', '{n} malam lagi menuju {name}'),
    'de': ('Nächte', 'Nacht', '{sleeps} bis {name}', 'in {n} Nächten', '{n} Nächte bis {name}'),
    'ja': ('回ねると', '回ねると', 'あと{sleeps}と{name}', 'あと {n} 回ねると', 'あと {n} 回ねると{name}'),
    'tr': ('gece', 'gece', '{sleeps} kaldı: {name}', '{n} gece sonra', '{name} için {n} gece kaldı'),
    'vi': ('đêm', 'đêm', '{sleeps} nữa là đến {name}', 'sau {n} đêm', 'còn {n} đêm nữa là đến {name}'),
    'ko': ('밤', '밤', '{sleeps} 자면 {name}', '{n}밤 뒤', '{n}밤 자면 {name}'),
    'ta': ('இரவுகள்', 'இரவு', '{name} வர {sleeps}', '{n} இரவுகளில்', '{name} வர {n} இரவுகள்'),
    'te': ('రాత్రులు', 'రాత్రి', '{name} వరకు {sleeps}', '{n} రాత్రులలో', '{name} వరకు {n} రాత్రులు'),
    'mr': ('रात्री', 'रात्र', '{name} पर्यंत {sleeps}', '{n} रात्रींत', '{name} पर्यंत {n} रात्री'),
    'tl': ('gabi', 'gabi', '{sleeps} bago ang {name}', 'sa loob ng {n} gabi', '{n} gabi bago ang {name}'),
}


def own_text(key, text):
    """The translation without characters the English already has (the 福 a lesson teaches stays 福)."""
    return ''.join(ch for ch in text if ch not in key)


def foreign(code, text):
    """True when text uses a script from neither its own language nor a kept name in Latin letters."""
    allowed = {OWN[code], 'latin'} | ({'kana'} if code == 'ja' else set())
    return any(re.search(p, text) for name, p in SCRIPTS.items() if name not in allowed)


def main():
    src, ingredient_file, out = sys.argv[1:4]
    over = json.load(open(os.path.join(HERE, 'overrides.json'), encoding='utf-8'))
    # Short labels with slots, checked line by line in every language: machine translation had no way to know
    # what "{date}" or "{name}" would hold, so many read wrong ("Written {date}" as "written by").
    reviewed = json.load(open(os.path.join(HERE, 'reviewed.json'), encoding='utf-8'))
    items = set(json.load(open(ingredient_file, encoding='utf-8')))
    os.makedirs(out, exist_ok=True)
    for code in OWN:
        if not os.path.exists(f'{src}/{code}.json'):
            continue
        raw = json.load(open(f'{src}/{code}.json', encoding='utf-8'))
        done = {}
        dropped = 0
        for k, v in raw.items():
            if '\n' not in k and '\n' in v:
                v = v.strip().split('\n')[-1].strip()
            if k[-1:] not in '.!?…' and v[-1:] in '.。।۔':
                v = v[:-1].rstrip()
            v = REPAIR.sub(r'\1', v)
            if '(' not in k:
                v = BRACKETED.sub(r'\1', v)
            doubled = any(v.count(slot) > k.count(slot) for slot in set(re.findall(r'\{\w+\}', k)))
            if foreign(code, own_text(k, v)) or not v or len(v) > len(k) * 4 + 30 or JUNK.search(v) or doubled or (RUDOLPH.search(v) and not RUDOLPH.search(k)):
                dropped += 1
                continue
            m = re.search(r'\{(\w+)\} (?:out )?of \{(\w+)\}', k)
            if m and code != 'zh':
                a, b = f'{{{m[1]}}}', f'{{{m[2]}}}'
                first, second = (b, a) if code in VERB_LAST else (a, b)
                if a in v and b in v and v.index(first) > v.index(second):
                    v = v.replace(a, '\0').replace(b, a).replace('\0', b)
            done[k] = v
        for i, word in enumerate(over['words']):
            done[word] = over[code][i]
            done[word.capitalize()] = over[code][i].capitalize()
        done['Eggs'] = done['Egg']
        done['{n} of {total} found'] = FOUND[code]
        done.update(HAND.get(code, {}))
        done.update(WORDS.get(code, {}))
        done.update(HOLIDAY_NAMES.get(code, {}))
        units = dict(zip(UNIT_KEYS, UNITS[code]))
        for unit in ('cups', 'tbsp', 'tsp'):
            for part in '¼½¾':
                units[f'{{n}}{part} {unit}'] = units[f'{{n}} {unit}'].replace('{n}', '{n}' + part)
        done.update(units)
        for english, own in zip((REINDEER, LETTERS), NAMES[code]):
            done.update(zip(english, own or english))
        done.update(reviewed.get(code, {}))
        many, one, until, soon, left = SLEEPS[code]
        done.update({'sleeps': many, 'sleep': one, '{sleeps} until {name}': until, 'in {sleeps}': IN_SLEEPS[code], 'in {n} sleeps': soon, '{n} sleeps until {name}': left})
        for brand in ('Jubilee', 'Jubi'):
            done.pop(brand, None)
        # Collecting page text once matched "Holi" inside "Holiday", leaving fake "{name}day" templates, and took
        # in a scrap of code.
        for k in [k for k in done if '{name}day' in k or '.replace(' in k]:
            del done[k]
        # Allergen lines go through "contains {list}" so the hand-checked words above are used; an old whole-line
        # translation once said "contains wheat and tar".
        for k in [k for k in done if re.match(r'(?i)(?:contains|may contain)\b', k) and '{' not in k]:
            del done[k]
        for k, v in list(done.items()):
            bare = re.sub(r'^(a|an|the|some) ', '', k)
            if bare != k:
                done.setdefault(bare[:1].upper() + bare[1:], v[:1].upper() + v[1:])
        dual = 0
        for k in list(done):
            if k in items and done[k].casefold() != k.casefold():
                done[k] = f'{done[k]} ({k})'
                dual += 1
        json.dump(done, open(f'{out}/{code}.json', 'w', encoding='utf-8'), ensure_ascii=False)
        print(code, len(done), 'dropped', dropped, 'ingredients in both languages', dual)


if __name__ == '__main__':
    main()
