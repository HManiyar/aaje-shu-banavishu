'use strict';

/* =====================================================================
   Aaje Shu Banavishu? (આજે શું બનાવીશું?) — Jain Evening Food Planner
   ---------------------------------------------------------------------
   Plain HTML + CSS + vanilla JavaScript. No server, no API keys.

   HOW THIS FILE IS ORGANISED
     1. Ingredient database   (edit names, aliases, icons here)
     2. Recipe database       (add or edit dishes here)
     3. Small helpers
     4. Storage (localStorage + IndexedDB for photos)
     5. App state
     6. Text normalisation & multilingual ingredient search
     7. Dietary rules (Jain settings)
     8. Recommendation engine
     9. Rendering (Home, Favourites, Recipes, Settings)
    10. Recipe detail, editors and dialogs
    11. Event handling & start-up

   Everything you add from inside the app (ingredients, recipes, photos,
   favourites, settings) is saved in this browser only.
   ===================================================================== */


/* =====================================================================
   1. INGREDIENT DATABASE
   ---------------------------------------------------------------------
   Each ingredient:
     id        – short unique code used by recipes (do not change once used)
     local     – everyday Gujarati name in English letters ("Methi")
     name      – English name ("Fenugreek")
     gu        – Gujarati script ("મેથી")
     category  – veg | grain | dairy | other
     icon      – an emoji, or "svg:<shape>" / "svg:<shape>:<colour>"
     bg        – background colour of the round icon
     aliases   – every other spelling people might type
     root / onionGarlic / hardVeg – flags used by the Jain settings
   ===================================================================== */

const INGREDIENT_CATEGORIES = [
  { id: 'veg',   label: 'Vegetables',     gu: 'શાકભાજી' },
  { id: 'grain', label: 'Flour & Grains', gu: 'લોટ અને અનાજ' },
  { id: 'dairy', label: 'Dairy',          gu: 'દૂધની બનાવટ' },
  { id: 'other', label: 'Other',          gu: 'અન્ય' }
];

const BUILTIN_INGREDIENTS = [
  /* ---------- Vegetables ---------- */
  { id: 'methi', local: 'Methi', name: 'Fenugreek', gu: 'મેથી', category: 'veg', icon: '🌿', bg: '#e2f0d9',
    aliases: ['methi', 'methee', 'meethi', 'fenugreek', 'fenugreek leaves', 'methi bhaji', 'methi ni bhaji', 'methi leaves', 'મેથીની ભાજી', 'મેથી ભાજી'] },
  { id: 'tameta', local: 'Tameta', name: 'Tomato', gu: 'ટામેટા', category: 'veg', icon: '🍅', bg: '#fde0dc',
    aliases: ['tameta', 'tameto', 'tamata', 'tamatar', 'tamater', 'tomato', 'tomatoes', 'tamota', 'ટામેટું', 'ટમેટા', 'ટમેટાં', 'ટામેટાં', 'ટામેટુ'] },
  { id: 'bataka', local: 'Bataka', name: 'Potato', gu: 'બટાકા', category: 'veg', icon: '🥔', bg: '#f3e6cf', root: true,
    aliases: ['bataka', 'batata', 'bateta', 'batako', 'bataku', 'aloo', 'alu', 'aalu', 'potato', 'potatoes', 'બટેટા', 'બટાકું', 'બટાટા', 'આલુ', 'બટાકુ'] },
  { id: 'dungri', local: 'Dungri', name: 'Onion', gu: 'ડુંગળી', category: 'veg', icon: '🧅', bg: '#f6e3ef', root: true, onionGarlic: true,
    aliases: ['dungri', 'dungli', 'dungari', 'kanda', 'pyaz', 'pyaaz', 'piyaz', 'onion', 'onions', 'ડુંગરી', 'કાંદા', 'કાંદો'] },
  { id: 'lasan', local: 'Lasan', name: 'Garlic', gu: 'લસણ', category: 'veg', icon: '🧄', bg: '#f1ede4', root: true, onionGarlic: true,
    aliases: ['lasan', 'lasun', 'lahsun', 'lehsun', 'garlic', 'લસન'] },
  { id: 'capsicum', local: 'Capsicum', name: 'Bell Pepper', gu: 'કેપ્સીકમ', category: 'veg', icon: '🫑', bg: '#dff0d2',
    aliases: ['capsicum', 'bell pepper', 'shimla mirch', 'simla mirch', 'simla marcha', 'simla marchu', 'simla mirchi', 'capcicum', 'કેપ્સિકમ', 'સિમલા મરચાં', 'સિમલા મરચું'] },
  { id: 'cabbage', local: 'Kobi', name: 'Cabbage', gu: 'કોબીજ', category: 'veg', icon: 'svg:cabbage', bg: '#e6f2dc', hardVeg: true,
    aliases: ['cabbage', 'kobi', 'kobij', 'kobij', 'kobi ni bhaji', 'patta gobi', 'band gobi', 'કોબી', 'કોબીજ'] },
  { id: 'cauliflower', local: 'Flower', name: 'Cauliflower', gu: 'ફ્લાવર', category: 'veg', icon: 'svg:cauliflower', bg: '#eef2e6', hardVeg: true,
    aliases: ['cauliflower', 'flower', 'flavar', 'fulavar', 'phool gobi', 'phoolgobi', 'gobi', 'gobhi', 'cauli flower', 'ફુલાવર', 'ફ્લાવર', 'ફૂલકોબી', 'ફુલકોબી'] },
  { id: 'dudhi', local: 'Dudhi', name: 'Bottle Gourd', gu: 'દૂધી', category: 'veg', icon: 'svg:gourd', bg: '#e8f3dc',
    aliases: ['dudhi', 'doodhi', 'dudi', 'lauki', 'louki', 'ghiya', 'bottle gourd', 'gourd', 'calabash', 'દુધી'] },
  { id: 'bhinda', local: 'Bhinda', name: 'Okra', gu: 'ભીંડા', category: 'veg', icon: 'svg:okra', bg: '#e1f0d6',
    aliases: ['bhinda', 'bhindi', 'bhindo', 'bhindaa', 'bhendi', 'okra', 'ladyfinger', 'lady finger', 'ladies finger', "lady's finger", 'ભીંડો', 'ભીંડી'] },
  { id: 'ringan', local: 'Ringan', name: 'Brinjal', gu: 'રીંગણ', category: 'veg', icon: '🍆', bg: '#ece1f3', hardVeg: true,
    aliases: ['ringan', 'ringna', 'ringda', 'ringan na', 'vengan', 'baingan', 'baigan', 'brinjal', 'eggplant', 'aubergine', 'રીંગણા', 'રિંગણ', 'વેંગણ', 'રીંગણાં'] },
  { id: 'gajar', local: 'Gajar', name: 'Carrot', gu: 'ગાજર', category: 'veg', icon: '🥕', bg: '#fde6d2', root: true,
    aliases: ['gajar', 'gajjar', 'gajer', 'carrot', 'carrots'] },
  { id: 'vatana', local: 'Vatana', name: 'Green Peas', gu: 'વટાણા', category: 'veg', icon: '🫛', bg: '#e0f1d8',
    aliases: ['vatana', 'vatanaa', 'vatano', 'matar', 'mutter', 'mattar', 'peas', 'green peas', 'lila vatana'] },
  { id: 'palak', local: 'Palak', name: 'Spinach', gu: 'પાલક', category: 'veg', icon: '🥬', bg: '#dcefd9',
    aliases: ['palak', 'paalak', 'spinach', 'palak bhaji', 'પાલખ'] },
  { id: 'kothmir', local: 'Kothmir', name: 'Coriander', gu: 'કોથમીર', category: 'veg', icon: '🍃', bg: '#dff3e2',
    aliases: ['kothmir', 'kothmeer', 'kotmir', 'kothimbir', 'dhana', 'dhaniya', 'dhania', 'cilantro', 'coriander', 'coriander leaves', 'lila dhana', 'ધાણા', 'કોથમરી', 'કોથમિર'] },
  { id: 'marcha', local: 'Marcha', name: 'Green Chilli', gu: 'લીલા મરચાં', category: 'veg', icon: '🌶️', bg: '#e3f1d6',
    aliases: ['marcha', 'marchu', 'marcha lila', 'lila marcha', 'mirchi', 'mirch', 'hari mirch', 'green chilli', 'green chili', 'chilli', 'chili', 'chillies', 'મરચાં', 'મરચું', 'લીલું મરચું', 'મરચા'] },
  { id: 'corn', local: 'Makai', name: 'Sweet Corn', gu: 'મકાઈ', category: 'veg', icon: '🌽', bg: '#fdf1c9',
    aliases: ['corn', 'sweet corn', 'sweetcorn', 'makai', 'makkai', 'makka', 'bhutta', 'મકાઇ', 'મકાઈ ના દાણા'] },
  { id: 'kachakela', local: 'Kacha Kela', name: 'Raw Banana', gu: 'કાચા કેળા', category: 'veg', icon: '🍌', bg: '#eef3cf',
    aliases: ['kacha kela', 'kachu kelu', 'kacha kele', 'kachakela', 'raw banana', 'green banana', 'plantain', 'kela', 'કાચું કેળું', 'કેળા', 'કાચા કેળાં'] },
  { id: 'kakdi', local: 'Kakdi', name: 'Cucumber', gu: 'કાકડી', category: 'veg', icon: '🥒', bg: '#e1f2de',
    aliases: ['kakdi', 'kakadi', 'kakri', 'kheera', 'khira', 'cucumber', 'cucumbers'] },
  { id: 'adu', local: 'Adu', name: 'Ginger', gu: 'આદુ', category: 'veg', icon: '🫚', bg: '#f5ead5', root: true,
    aliases: ['adu', 'aadu', 'adrak', 'adarak', 'ginger', 'fresh ginger'] },
  { id: 'alvipaan', local: 'Alvi Paan', name: 'Colocasia Leaves', gu: 'અળવીના પાન', category: 'veg', icon: 'svg:leaf', bg: '#dbeed6',
    aliases: ['alvi paan', 'alvi na paan', 'arvi leaves', 'arbi leaves', 'patra leaves', 'patra na paan', 'colocasia leaves', 'taro leaves', 'alu leaves', 'અળવી', 'પાતરાના પાન', 'અળવીનાં પાન'] },

  /* ---------- Flour & Grains ---------- */
  { id: 'besan', local: 'Besan', name: 'Gram Flour', gu: 'બેસન', category: 'grain', icon: 'svg:sack:#f2c94c', bg: '#fbf0cc',
    aliases: ['besan', 'beson', 'chana no lot', 'chana flour', 'gram flour', 'chickpea flour', 'ચણાનો લોટ'] },
  { id: 'ghaunolot', local: 'Ghau no Lot', name: 'Wheat Flour', gu: 'ઘઉંનો લોટ', category: 'grain', icon: 'svg:sack:#d9b77e', bg: '#f4e8d2',
    aliases: ['wheat flour', 'atta', 'aata', 'ata', 'ghau no lot', 'ghau nu lot', 'ghau', 'gehu', 'gehun', 'chapati flour', 'rotli no lot', 'wheat', 'ઘઉં', 'આટો', 'ઘઉંનો લોટ', 'રોટલીનો લોટ'] },
  { id: 'chokhanolot', local: 'Chokha no Lot', name: 'Rice Flour', gu: 'ચોખાનો લોટ', category: 'grain', icon: 'svg:sack:#f1ece0', bg: '#f6f2ea',
    aliases: ['rice flour', 'chokha no lot', 'chokha nu lot', 'chawal ka atta', 'papdi no lot', 'ચોખાનો લોટ'] },
  { id: 'bajrinolot', local: 'Bajri no Lot', name: 'Pearl Millet Flour', gu: 'બાજરીનો લોટ', category: 'grain', icon: 'svg:sack:#a8a189', bg: '#ecebe2',
    aliases: ['bajri', 'bajra', 'bajri no lot', 'bajra flour', 'pearl millet', 'millet flour', 'બાજરી'] },
  { id: 'rava', local: 'Rava', name: 'Semolina', gu: 'રવો', category: 'grain', icon: 'svg:sack:#ead79e', bg: '#f8f0d6',
    aliases: ['rava', 'ravo', 'rawa', 'sooji', 'suji', 'soji', 'semolina', 'upma rava', 'સોજી', 'રવા'] },
  { id: 'maida', local: 'Maida', name: 'All-purpose Flour', gu: 'મેંદો', category: 'grain', icon: 'svg:sack:#ffffff', bg: '#f1eee8',
    aliases: ['maida', 'mendo', 'menda', 'all purpose flour', 'plain flour', 'refined flour', 'મૈદા', 'મેંદા'] },
  { id: 'poha', local: 'Pauva', name: 'Poha (Flattened Rice)', gu: 'પૌંઆ', category: 'grain', icon: 'svg:sack:#f6e7c1', bg: '#fbf3df',
    aliases: ['poha', 'pauva', 'pauaa', 'pauwa', 'pohe', 'flattened rice', 'beaten rice', 'પૌઆ', 'પોહા', 'પૌવા'] },
  { id: 'chokha', local: 'Chokha', name: 'Rice', gu: 'ચોખા', category: 'grain', icon: '🍚', bg: '#eef1f4',
    aliases: ['rice', 'chokha', 'chaval', 'chawal', 'basmati', 'bhat', 'ભાત'] },
  { id: 'moongdal', local: 'Mag ni Dal', name: 'Moong Dal', gu: 'મગની દાળ', category: 'grain', icon: '🫘', bg: '#f7f1c8',
    aliases: ['moong dal', 'mung dal', 'mag ni dal', 'moong', 'mung', 'mag', 'yellow moong', 'green gram', 'moong daal', 'મગ', 'મગની દાળ'] },
  { id: 'toordal', local: 'Tuver Dal', name: 'Toor Dal', gu: 'તુવેરની દાળ', category: 'grain', icon: '🫘', bg: '#fbe2c5',
    aliases: ['toor dal', 'tuver dal', 'tur dal', 'tuvar dal', 'arhar dal', 'pigeon pea', 'dal', 'daal', 'tuver', 'તુવેર દાળ', 'દાળ', 'તુવેર'] },
  { id: 'mamra', local: 'Mamra', name: 'Puffed Rice', gu: 'મમરા', category: 'grain', icon: 'svg:sack:#fbf6ea', bg: '#f6efe0',
    aliases: ['mamra', 'murmura', 'kurmura', 'puffed rice', 'mumra', 'મમરાં'] },

  /* ---------- Dairy ---------- */
  { id: 'paneer', local: 'Paneer', name: 'Cottage Cheese', gu: 'પનીર', category: 'dairy', icon: 'svg:cubes', bg: '#f4f1ea',
    aliases: ['paneer', 'panir', 'cottage cheese', 'indian cheese'] },
  { id: 'dahi', local: 'Dahi', name: 'Curd', gu: 'દહીં', category: 'dairy', icon: '🥣', bg: '#eef3f6',
    aliases: ['dahi', 'dahin', 'dahee', 'curd', 'curds', 'yogurt', 'yoghurt', 'દહી'] },
  { id: 'cheese', local: 'Cheese', name: 'Cheese', gu: 'ચીઝ', category: 'dairy', icon: '🧀', bg: '#fdf0c8',
    aliases: ['cheese', 'cheez', 'chees', 'cheese slice', 'processed cheese', 'mozzarella', 'cheddar'] },
  { id: 'makhan', local: 'Makhan', name: 'Butter', gu: 'માખણ', category: 'dairy', icon: '🧈', bg: '#fdf4d0',
    aliases: ['butter', 'makhan', 'makkhan', 'maska', 'બટર'] },
  { id: 'doodh', local: 'Doodh', name: 'Milk', gu: 'દૂધ', category: 'dairy', icon: '🥛', bg: '#eef2f8',
    aliases: ['milk', 'doodh', 'dudh', 'dood', 'દુધ'] },

  /* ---------- Other ---------- */
  { id: 'bread', local: 'Bread', name: 'Bread', gu: 'બ્રેડ', category: 'other', icon: '🍞', bg: '#f6e6cc',
    aliases: ['bread', 'bread slices', 'sandwich bread', 'double roti', 'bred', 'brown bread'] },
  { id: 'breadcrumbs', local: 'Bread Crumbs', name: 'Bread Crumbs', gu: 'બ્રેડ ક્રમ્સ', category: 'other', icon: 'svg:sack:#c9935a', bg: '#f3e3cf',
    aliases: ['bread crumbs', 'breadcrumbs', 'crumbs', 'panko', 'bread crumb'] },
  { id: 'pav', local: 'Pav', name: 'Pav Buns', gu: 'પાઉં', category: 'other', icon: 'svg:buns', bg: '#f8e7cf',
    aliases: ['pav', 'pao', 'paav', 'paau', 'buns', 'bun', 'ladi pav', 'dinner roll', 'પાવ', 'પાંઉ'] },
  { id: 'sev', local: 'Sev', name: 'Sev', gu: 'સેવ', category: 'other', icon: 'svg:sack:#f0a640', bg: '#fde9cc',
    aliases: ['sev', 'nylon sev', 'zini sev', 'jini sev', 'ratlami sev', 'bhujia', 'bhujiya', 'farsan', 'ઝીણી સેવ'] },
  { id: 'sing', local: 'Sing', name: 'Peanuts', gu: 'સીંગદાણા', category: 'other', icon: '🥜', bg: '#f6e4c8',
    aliases: ['sing', 'shing', 'singdana', 'shingdana', 'peanuts', 'peanut', 'groundnut', 'groundnuts', 'moongphali', 'mungfali', 'શીંગ', 'સીંગ', 'શીંગદાણા'] },
  { id: 'topru', local: 'Topru', name: 'Coconut', gu: 'ટોપરું', category: 'other', icon: '🥥', bg: '#efe7dc',
    aliases: ['coconut', 'topru', 'topra', 'kopru', 'nariyal', 'naliyer', 'nariyel', 'desiccated coconut', 'નાળિયેર', 'કોપરું', 'ટોપરુ'] },
  { id: 'aamli', local: 'Aamli', name: 'Tamarind', gu: 'આમલી', category: 'other', icon: 'svg:jar:#7a4a25', bg: '#f1e2d4',
    aliases: ['aamli', 'amli', 'imli', 'tamarind', 'khajur amli', 'sweet chutney', 'khajur amli chutney', 'tamarind chutney', 'આંબલી'] },
  { id: 'papdi', local: 'Papdi', name: 'Papdi / Chaat Puri', gu: 'પાપડી', category: 'other', icon: 'svg:discs', bg: '#fbecd3',
    aliases: ['papdi', 'papri', 'puri', 'chaat puri', 'bhel puri puri', 'પુરી'] }
];


/* =====================================================================
   2. RECIPE DATABASE
   ---------------------------------------------------------------------
   Ingredient lines are written as  [ingredientId, quantity, 'unit']
   An optional 4th value is a Jain swap: when the first ingredient is not
   allowed (for example potato), the app uses the swap instead
   (for example raw banana) — but only if "Suggest Jain swaps" is on.

   pantry  – basics we assume every kitchen has (salt, oil, spices …)
   fried   – true when the dish is deep-fried
   filling – true when it works as a proper evening meal
   gujarati– true for Gujarati favourites
   ===================================================================== */

const BUILTIN_RECIPES = [
  /* ------------------ Gujarati favourites ------------------ */
  {
    id: 'methi-thepla', name: 'Methi Thepla', gu: 'મેથીના થેપલા', aka: ['thepla', 'methi na thepla', 'methi paratha'],
    category: 'meal', gujarati: true, time: 30, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Soft, spiced wheat flatbreads with fresh methi — lovely with curd, chhundo or tea.',
    required: [['ghaunolot', 2, 'cup'], ['methi', 1, 'cup, finely chopped']],
    optional: [['besan', 2, 'tbsp'], ['dahi', 3, 'tbsp'], ['marcha', 1, 'finely chopped'], ['adu', 1, 'tsp, grated'], ['kothmir', 2, 'tbsp, chopped']],
    pantry: 'Salt, haldi, red chilli powder, a pinch of sugar, sesame seeds (til), oil',
    steps: [
      'Wash the methi well, drain and chop finely.',
      'In a bowl mix wheat flour, methi, besan, curd, chilli (if using), spices, til and 2 tbsp oil.',
      'Add water little by little and knead a soft dough. Cover and rest for 10 minutes.',
      'Make small balls and roll thin rounds, dusting with a little dry flour.',
      'Cook on a hot tawa, applying a little oil on both sides, until light brown spots appear.',
      'Serve warm with curd, chhundo or masala tea.'
    ]
  },
  {
    id: 'plain-thepla', name: 'Plain Masala Thepla', gu: 'સાદા થેપલા', aka: ['thepla', 'masala thepla', 'sada thepla'],
    category: 'meal', gujarati: true, time: 25, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Everyday spiced theplas made with pantry spices — no greens needed.',
    required: [['ghaunolot', 2, 'cup']],
    optional: [['dahi', 3, 'tbsp'], ['besan', 2, 'tbsp'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped']],
    pantry: 'Salt, haldi, red chilli powder, ajwain, sesame seeds, a pinch of sugar, oil',
    steps: [
      'Mix wheat flour, besan, curd, spices, ajwain, til and 2 tbsp oil.',
      'Knead a soft dough with a little water and rest 10 minutes.',
      'Roll thin rounds and cook on a hot tawa with a little oil on both sides.',
      'Stack in a cloth to keep soft. Serve with curd, pickle or tea.'
    ]
  },
  {
    id: 'methi-muthiya', name: 'Methi Muthiya', gu: 'મેથીના મુઠિયા', aka: ['muthiya', 'muthia', 'methi muthia', 'vaghareli muthiya'],
    category: 'snack', gujarati: true, time: 40, difficulty: 'Medium', servings: 4, fried: false, filling: true, emoji: '🌿',
    description: 'Steamed wheat-and-besan rolls with methi, finished with a crackling rai-til tadka.',
    required: [['ghaunolot', 1, 'cup'], ['besan', 0.5, 'cup'], ['methi', 1, 'cup, chopped']],
    optional: [['rava', 2, 'tbsp'], ['dahi', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['adu', 1, 'tsp, grated'], ['kothmir', 2, 'tbsp']],
    pantry: 'Salt, haldi, sugar, lemon juice, a pinch of soda, oil, rai, til, hing',
    steps: [
      'Mix flours, methi, curd, spices, sugar, lemon juice, a pinch of soda and 2 tbsp oil.',
      'Add very little water and make a firm dough. Shape into 3–4 finger-thick logs.',
      'Steam on a greased plate for 18–20 minutes, until a knife comes out clean.',
      'Cool for 5 minutes and cut into slices.',
      'Heat 2 tbsp oil, add rai, til and hing, then toss the slices until the edges turn crisp.',
      'Garnish with coriander and serve with tea.'
    ]
  },
  {
    id: 'dudhi-muthiya', name: 'Dudhi Muthiya', gu: 'દૂધીના મુઠિયા', aka: ['dudhi na muthiya', 'lauki muthiya', 'muthiya', 'muthia'],
    category: 'snack', gujarati: true, time: 40, difficulty: 'Medium', servings: 4, fried: false, filling: true, emoji: '🥒',
    description: 'Soft steamed muthiya made with grated dudhi, tempered with rai and til.',
    required: [['dudhi', 1.5, 'cup, grated'], ['ghaunolot', 1, 'cup'], ['besan', 0.5, 'cup']],
    optional: [['rava', 2, 'tbsp'], ['dahi', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['adu', 1, 'tsp, grated'], ['kothmir', 2, 'tbsp']],
    pantry: 'Salt, haldi, sugar, lemon juice, a pinch of soda, oil, rai, til, hing',
    steps: [
      'Grate the dudhi (no need to squeeze — its water helps bind the dough).',
      'Add flours, spices, sugar, lemon, soda and 2 tbsp oil; mix into a firm dough without extra water.',
      'Shape into logs and steam for 20–22 minutes.',
      'Cool, slice and toss in a tadka of rai, til and hing until lightly crisp.',
      'Garnish with coriander.'
    ]
  },
  {
    id: 'handvo', name: 'Instant Rava Handvo', gu: 'હાંડવો', aka: ['handvo', 'handwa', 'handvo cake', 'rava handvo'],
    category: 'meal', gujarati: true, time: 40, difficulty: 'Medium', servings: 4, fried: false, filling: true, emoji: '🥧',
    description: 'Golden, crusty savoury cake with vegetables — no overnight soaking needed.',
    required: [['rava', 1, 'cup'], ['dahi', 0.75, 'cup']],
    optional: [['dudhi', 0.75, 'cup, grated'], ['gajar', 0.5, 'cup, grated'], ['vatana', 0.25, 'cup'], ['corn', 0.25, 'cup'], ['besan', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['adu', 1, 'tsp, grated']],
    pantry: 'Salt, haldi, sugar, eno or soda, oil, rai, til, hing, curry leaves',
    steps: [
      'Mix rava and curd with a little water to a thick batter; rest 10 minutes.',
      'Add grated vegetables, salt, haldi, sugar and chilli.',
      'In a non-stick pan heat 2 tbsp oil and add rai, til, hing and curry leaves.',
      'Just before cooking, stir 1 tsp eno into the batter and pour it over the tadka.',
      'Cover and cook on low for 10–12 minutes until the base is golden; flip and cook 6–8 minutes more.',
      'Cut into wedges and serve with green chutney or tea.'
    ]
  },
  {
    id: 'khaman-dhokla', name: 'Khaman Dhokla', gu: 'ખમણ ઢોકળા', aka: ['dhokla', 'khaman', 'dhokra', 'besan dhokla'],
    category: 'snack', gujarati: true, time: 30, difficulty: 'Medium', servings: 4, fried: false, filling: false, emoji: '🍰',
    description: 'Spongy, tangy-sweet steamed besan squares with a juicy tadka.',
    required: [['besan', 1.5, 'cup']],
    optional: [['dahi', 2, 'tbsp'], ['marcha', 2, 'slit'], ['kothmir', 2, 'tbsp'], ['topru', 2, 'tbsp, grated'], ['adu', 1, 'tsp, grated']],
    pantry: 'Salt, sugar, lemon juice or citric acid, eno, haldi, oil, rai, hing, curry leaves',
    steps: [
      'Whisk besan, about 1 cup water, 1 tbsp sugar, salt, lemon juice and a pinch of haldi into a smooth batter.',
      'Heat the steamer and grease a plate.',
      'Add 1 tsp eno, stir quickly and pour into the plate straight away.',
      'Steam on medium heat for 15 minutes; check with a toothpick.',
      'Temper rai, chillies, hing and curry leaves in oil; add ½ cup water and 1 tbsp sugar, boil once.',
      'Pour over the cut dhokla and garnish with coriander and coconut.'
    ]
  },
  {
    id: 'rava-dhokla', name: 'Instant Rava Dhokla', gu: 'રવા ઢોકળા', aka: ['white dhokla', 'safed dhokla', 'sooji dhokla', 'dhokla'],
    category: 'snack', gujarati: true, time: 25, difficulty: 'Easy', servings: 3, fried: false, filling: false, emoji: '🍰',
    description: 'Soft white dhokla made in minutes from rava and curd.',
    required: [['rava', 1, 'cup'], ['dahi', 0.5, 'cup']],
    optional: [['marcha', 1, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['adu', 1, 'tsp, grated']],
    pantry: 'Salt, eno, oil, rai, til, hing, black pepper',
    steps: [
      'Mix rava, curd, salt and ½ cup water; rest 10 minutes.',
      'Add chilli, then 1 tsp eno; mix gently and pour into a greased plate.',
      'Sprinkle crushed black pepper and steam for 12–15 minutes.',
      'Pour a tadka of rai, til and hing on top and cut into squares.'
    ]
  },
  {
    id: 'khandvi', name: 'Khandvi', gu: 'ખાંડવી', aka: ['khandvi', 'suralichi vadi', 'patuli', 'khandavi'],
    category: 'snack', gujarati: true, time: 30, difficulty: 'Medium', servings: 3, fried: false, filling: false, emoji: '🌀',
    description: 'Silky besan rolls with a rai-til tadka — a festive favourite.',
    required: [['besan', 0.5, 'cup'], ['dahi', 0.5, 'cup']],
    optional: [['topru', 2, 'tbsp, grated'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped']],
    pantry: 'Salt, haldi, oil, rai, til, hing',
    steps: [
      'Whisk besan, curd, 1 cup water, salt and haldi until completely smooth.',
      'Cook on low heat, stirring all the time, for 10–12 minutes until thick and glossy.',
      'Test: spread a spoonful on a plate — if it peels off after a minute, it is ready.',
      'Quickly spread very thin on greased plates or the back of a thali.',
      'Cool 5 minutes, cut into strips and roll each one.',
      'Pour a tadka of rai, til and hing on top; garnish with coconut and coriander.'
    ]
  },
  {
    id: 'patra', name: 'Patra', gu: 'પાતરા', aka: ['patra', 'patrode', 'alu vadi', 'alvi patra', 'patarveliya'],
    category: 'snack', gujarati: true, time: 50, difficulty: 'Medium', servings: 4, fried: false, filling: true, emoji: '🍃',
    description: 'Colocasia leaves rolled with sweet-sour besan masala, steamed and tempered.',
    required: [['alvipaan', 8, 'leaves'], ['besan', 1, 'cup']],
    optional: [['aamli', 2, 'tbsp pulp'], ['topru', 2, 'tbsp, grated'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped']],
    pantry: 'Jaggery, salt, haldi, red chilli powder, dhana-jiru, oil, rai, til, hing',
    steps: [
      'Wash and dry the leaves; shave off the thick veins with a knife.',
      'Make a thick paste of besan, tamarind, jaggery and spices with very little water.',
      'Lay a leaf vein-side up, spread paste, place another leaf on top — stack 3–4 leaves.',
      'Fold in the sides and roll tightly.',
      'Steam the rolls for 20–25 minutes; cool and slice.',
      'Temper rai, til and hing and toss the slices (or shallow-fry them) until crisp.'
    ]
  },
  {
    id: 'methi-gota', name: 'Methi na Gota', gu: 'મેથીના ગોટા', aka: ['dakor na gota', 'gota', 'methi pakoda', 'methi bhajiya', 'methi pakora'],
    category: 'snack', gujarati: true, time: 25, difficulty: 'Easy', servings: 4, fried: true, filling: false, emoji: '🧆',
    description: 'Fluffy Dakor-style methi fritters — perfect for a rainy evening.',
    required: [['besan', 1, 'cup'], ['methi', 1, 'cup, chopped']],
    optional: [['kothmir', 2, 'tbsp'], ['marcha', 2, 'finely chopped'], ['dahi', 2, 'tbsp']],
    pantry: 'Salt, sugar, crushed black pepper, coarse dhana, a pinch of soda, oil for frying',
    steps: [
      'Mix besan, methi, curd, chilli, spices and sugar.',
      'Add water to make a thick batter; beat well for 2 minutes.',
      'Add a pinch of soda and 1 tbsp hot oil and mix.',
      'Drop small portions into hot oil and fry on medium until golden.',
      'Serve hot with fried chillies and tea.'
    ]
  },
  {
    id: 'mixed-bhajiya', name: 'Gujarati Bhajiya', gu: 'ભજીયા', aka: ['bhajiya', 'bhajia', 'pakoda', 'pakora', 'bhaji', 'mirchi bhajiya'],
    category: 'snack', gujarati: true, time: 25, difficulty: 'Easy', servings: 4, fried: true, filling: false, emoji: '🧆',
    description: 'Crispy besan fritters with whatever vegetables you have — potato, chilli, palak or methi.',
    required: [['besan', 1, 'cup']],
    optional: [['bataka', 2, 'thinly sliced', 'kachakela'], ['marcha', 4, 'large, slit'], ['palak', 10, 'leaves'], ['methi', 0.5, 'cup, chopped'], ['dungri', 1, 'sliced']],
    pantry: 'Salt, haldi, red chilli powder, ajwain, a pinch of soda, oil for frying',
    steps: [
      'Make a smooth batter of besan, salt, spices, ajwain and water — like thick cream.',
      'Add a pinch of soda and 1 tbsp hot oil to the batter.',
      'Dip vegetable slices (or drop spoonfuls of methi mix) into the batter.',
      'Fry in hot oil on medium until golden and crisp.',
      'Serve with green chutney and tea.'
    ]
  },
  {
    id: 'sev-tameta', name: 'Sev Tameta nu Shaak', gu: 'સેવ ટામેટાનું શાક', aka: ['sev tameta', 'sev tamatar', 'sev tomato', 'sev tameta nu shak'],
    category: 'meal', gujarati: true, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🍅',
    description: 'Sweet-tangy tomato curry topped with crunchy sev — great with rotli or bhakri.',
    required: [['tameta', 4, 'medium, chopped'], ['sev', 1, 'cup']],
    optional: [['marcha', 1, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['dungri', 1, 'chopped']],
    pantry: 'Oil, rai, jeeru, hing, haldi, red chilli powder, dhana-jiru, jaggery, salt',
    steps: [
      'Heat oil; add rai, jeeru and hing.',
      'Add tomatoes, chilli, haldi, chilli powder, dhana-jiru and salt; cook until soft and saucy.',
      'Add ½ cup water and a little jaggery; simmer 3–4 minutes.',
      'Add the sev only just before serving — it softens quickly.',
      'Garnish with coriander and serve with rotli, bhakri or thepla.'
    ]
  },

  /* ------------------ Evening snacks ------------------ */
  {
    id: 'vada-pav', name: 'Vada Pav', gu: 'વડાપાઉં', aka: ['vadapav', 'wada pav', 'batata vada pav'],
    category: 'snack', gujarati: false, time: 40, difficulty: 'Medium', servings: 6, fried: true, filling: true, emoji: '🍔',
    description: 'Spiced potato vada in a soft pav with chutneys — Mumbai’s favourite.',
    required: [['bataka', 4, 'medium, boiled', 'kachakela'], ['besan', 1, 'cup'], ['pav', 6, '']],
    optional: [['marcha', 2, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['adu', 1, 'tsp, grated'], ['sing', 2, 'tbsp (for dry chutney)'], ['lasan', 3, 'cloves (for red chutney)']],
    pantry: 'Oil, rai, hing, haldi, curry leaves, lemon, salt, a pinch of soda, red chilli powder',
    steps: [
      'Mash the boiled potatoes.',
      'Temper rai, hing, curry leaves, chilli and haldi in oil; add the mash, salt, lemon and coriander. Shape into balls.',
      'Make a thick besan batter with salt, haldi and a pinch of soda.',
      'Dip the balls and deep-fry on medium until golden.',
      'Slit the pav, spread chutneys, place a vada inside and serve hot.'
    ]
  },
  {
    id: 'batata-vada', name: 'Batata Vada', gu: 'બટાકા વડા', aka: ['aloo bonda', 'bataka vada', 'potato vada', 'bonda'],
    category: 'snack', gujarati: true, time: 35, difficulty: 'Medium', servings: 4, fried: true, filling: true, emoji: '🧆',
    description: 'Golden besan-coated potato balls with a gentle sweet-spicy masala.',
    required: [['bataka', 4, 'medium, boiled', 'kachakela'], ['besan', 1, 'cup']],
    optional: [['marcha', 2, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['adu', 1, 'tsp, grated'], ['sing', 2, 'tbsp, crushed']],
    pantry: 'Oil, rai, hing, haldi, sugar, lemon, salt, a pinch of soda',
    steps: [
      'Mash the boiled potatoes with chilli, salt, sugar, lemon and coriander.',
      'Add a rai-hing tadka to the mash and shape into small balls.',
      'Make a thick besan batter with salt, haldi and a pinch of soda.',
      'Dip and deep-fry until golden. Serve with green and sweet chutney.'
    ]
  },
  {
    id: 'samosa', name: 'Samosa', gu: 'સમોસા', aka: ['samosa', 'samosu', 'punjabi samosa'],
    category: 'snack', gujarati: false, time: 60, difficulty: 'Medium', servings: 6, fried: true, filling: true, emoji: '🥟',
    description: 'Crisp pastry cones filled with spiced potato and peas.',
    required: [['maida', 1.5, 'cup'], ['bataka', 4, 'medium, boiled', 'kachakela']],
    optional: [['vatana', 0.5, 'cup'], ['marcha', 2, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['adu', 1, 'tsp, grated']],
    pantry: 'Ajwain, ghee or oil for the dough, salt, jeeru, dhana-jiru, garam masala, amchur, oil for frying',
    steps: [
      'Rub 4 tbsp ghee into maida with ajwain and salt; knead a stiff dough with water. Rest 20 minutes.',
      'For filling, sauté jeeru, peas and chilli; add crumbled potato, spices and amchur.',
      'Roll an oval, cut in half, form a cone, fill and seal the edges with water.',
      'Fry on LOW heat for 12–15 minutes until crisp and golden.',
      'Serve with sweet chutney and green chutney.'
    ]
  },
  {
    id: 'moong-dal-kachori', name: 'Moong Dal Kachori', gu: 'મગની દાળની કચોરી', aka: ['kachori', 'khasta kachori', 'kachodi', 'dal kachori'],
    category: 'snack', gujarati: false, time: 60, difficulty: 'Medium', servings: 6, fried: true, filling: true, emoji: '🥟',
    description: 'Flaky, crisp kachori stuffed with a spicy-tangy moong dal masala.',
    required: [['maida', 1.5, 'cup'], ['moongdal', 0.5, 'cup, soaked 2 hours']],
    optional: [['marcha', 2, 'finely chopped'], ['adu', 1, 'tsp, grated']],
    pantry: 'Ghee, saunf, coarse dhana, red chilli powder, amchur, hing, salt, sugar, besan or flour for binding, oil',
    steps: [
      'Knead a soft dough of maida, 4 tbsp ghee and salt; rest 20 minutes.',
      'Drain the soaked dal and grind coarsely without water.',
      'Roast the dal with saunf, dhana, hing and spices until dry; add sugar and amchur. Cool.',
      'Fill small dough balls with the stuffing, seal and flatten gently.',
      'Fry on very low heat for 15–18 minutes until crisp and puffed.'
    ]
  },
  {
    id: 'aloo-tikki', name: 'Aloo Tikki', gu: 'આલુ ટિક્કી', aka: ['tikki', 'bataka tikki', 'ragda patties', 'patties', 'pattice'],
    category: 'snack', gujarati: false, time: 30, difficulty: 'Easy', servings: 4, fried: false, filling: true, emoji: '🍘',
    description: 'Crisp pan-fried potato patties — serve plain or as chaat with curd and chutney.',
    required: [['bataka', 4, 'medium, boiled', 'kachakela']],
    optional: [['vatana', 0.25, 'cup'], ['breadcrumbs', 2, 'tbsp'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['dahi', 0.5, 'cup (to serve)'], ['aamli', 2, 'tbsp sweet chutney'], ['sev', 0.25, 'cup (to serve)']],
    pantry: 'Salt, red chilli powder, chaat masala, roasted jeeru powder, cornflour, oil for shallow frying',
    steps: [
      'Mash the potatoes with spices, peas, chilli and coriander.',
      'Bind with bread crumbs or 2 tbsp cornflour.',
      'Shape into flat patties.',
      'Shallow-fry on a tawa with a little oil until crisp on both sides.',
      'Serve with curd, sweet chutney, green chutney and sev.'
    ]
  },
  {
    id: 'veg-cutlet', name: 'Vegetable Cutlet', gu: 'વેજ કટલેટ', aka: ['cutlet', 'veg cutlet', 'vegetable tikki'],
    category: 'snack', gujarati: false, time: 35, difficulty: 'Easy', servings: 4, fried: false, filling: true, emoji: '🍘',
    description: 'Crumb-coated vegetable patties, shallow-fried until crunchy.',
    required: [['bataka', 3, 'medium, boiled', 'kachakela'], ['breadcrumbs', 0.5, 'cup']],
    optional: [['gajar', 0.5, 'cup, grated'], ['vatana', 0.25, 'cup'], ['capsicum', 0.25, 'cup, chopped'], ['corn', 0.25, 'cup'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped']],
    pantry: 'Salt, garam masala, chaat masala, cornflour or maida (for coating slurry), oil',
    steps: [
      'Mash potatoes with the vegetables and spices.',
      'Shape into oval cutlets.',
      'Dip each in a thin cornflour–water slurry and roll in bread crumbs.',
      'Shallow-fry on a tawa (or air-fry) until golden on both sides.',
      'Serve with ketchup or green chutney.'
    ]
  },
  {
    id: 'bread-pakoda', name: 'Bread Pakoda', gu: 'બ્રેડ પકોડા', aka: ['bread pakora', 'bread bhajiya', 'bread bhajia'],
    category: 'snack', gujarati: false, time: 25, difficulty: 'Easy', servings: 4, fried: true, filling: true, emoji: '🍞',
    description: 'Bread slices dipped in spiced besan batter and fried until crisp.',
    required: [['bread', 6, 'slices'], ['besan', 1, 'cup']],
    optional: [['bataka', 2, 'medium, boiled (for stuffing)', 'kachakela'], ['marcha', 1, 'finely chopped'], ['kothmir', 2, 'tbsp']],
    pantry: 'Salt, haldi, red chilli powder, ajwain, green chutney, oil for frying',
    steps: [
      'Make a thick besan batter with salt, haldi, chilli powder and ajwain.',
      'Optional: spread green chutney and a thin layer of spiced potato between two slices.',
      'Cut slices into triangles and dip fully in the batter.',
      'Fry on medium until golden. Serve hot with ketchup or chutney.'
    ]
  },
  {
    id: 'dabeli', name: 'Kutchi Dabeli', gu: 'કચ્છી દાબેલી', aka: ['dabeli', 'dabheli', 'kutchi dabeli'],
    category: 'snack', gujarati: true, time: 30, difficulty: 'Medium', servings: 6, fried: false, filling: true, emoji: '🍔',
    description: 'Sweet-spicy potato filling in toasted pav with peanuts, sev and chutneys.',
    required: [['pav', 6, ''], ['bataka', 3, 'medium, boiled', 'kachakela']],
    optional: [['sing', 0.25, 'cup (masala peanuts)'], ['aamli', 3, 'tbsp khajur-amli chutney'], ['sev', 0.5, 'cup'], ['topru', 2, 'tbsp, grated'], ['kothmir', 2, 'tbsp'], ['dungri', 1, 'finely chopped']],
    pantry: 'Dabeli masala, salt, oil, butter for toasting, pomegranate seeds if available',
    steps: [
      'Cook mashed potato with dabeli masala, a little sweet chutney and salt in oil.',
      'Spread on a plate; top with coconut, coriander, peanuts and pomegranate.',
      'Slit pav, apply sweet chutney inside, fill generously with the masala.',
      'Toast on a buttered tawa and roll the edges in sev.'
    ]
  },
  {
    id: 'masala-toast', name: 'Masala Toast', gu: 'મસાલા ટોસ્ટ', aka: ['bombay toast', 'tomato toast', 'veg toast', 'open toast'],
    category: 'snack', gujarati: false, time: 15, difficulty: 'Easy', servings: 2, fried: false, filling: false, emoji: '🍞',
    description: 'Crispy toast topped with a quick tomato–capsicum masala.',
    required: [['bread', 4, 'slices'], ['tameta', 1, 'finely chopped']],
    optional: [['capsicum', 0.5, 'finely chopped'], ['corn', 0.25, 'cup'], ['cheese', 0.25, 'cup, grated'], ['makhan', 1, 'tbsp'], ['marcha', 1, 'finely chopped'], ['kothmir', 1, 'tbsp']],
    pantry: 'Salt, chaat masala, oregano or chilli flakes',
    steps: [
      'Mix the chopped vegetables with salt, chaat masala and herbs.',
      'Butter the bread and spread the topping evenly; add cheese if you like.',
      'Toast on a covered tawa on low heat (or in the oven) until the base is crisp.',
      'Cut and serve hot with ketchup.'
    ]
  },
  {
    id: 'grilled-sandwich', name: 'Veg Grilled Sandwich', gu: 'વેજ ગ્રીલ સેન્ડવીચ', aka: ['sandwich', 'bombay sandwich', 'grill sandwich', 'veg sandwich', 'vegetable sandwich'],
    category: 'snack', gujarati: false, time: 20, difficulty: 'Easy', servings: 4, fried: false, filling: true, emoji: '🥪',
    description: 'Bombay-style layered sandwich with green chutney, grilled until crisp.',
    required: [['bread', 8, 'slices'], ['kakdi', 1, 'sliced'], ['tameta', 2, 'sliced']],
    optional: [['bataka', 2, 'medium, boiled & sliced', 'kachakela'], ['capsicum', 1, 'sliced'], ['cheese', 4, 'slices'], ['makhan', 2, 'tbsp'], ['kothmir', 0.5, 'cup (for green chutney)'], ['marcha', 1, '']],
    pantry: 'Salt, sandwich masala or chaat masala, black pepper',
    steps: [
      'Grind coriander, chilli, salt and lemon into a green chutney.',
      'Butter the bread and spread chutney.',
      'Layer cucumber, tomato and other vegetables; sprinkle sandwich masala; add cheese.',
      'Close and grill until golden. Cut and serve with ketchup.'
    ]
  },
  {
    id: 'paneer-sandwich', name: 'Paneer Sandwich', gu: 'પનીર સેન્ડવીચ', aka: ['paneer toast', 'paneer grill sandwich', 'paneer bhurji sandwich'],
    category: 'snack', gujarati: false, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🥪',
    description: 'Crumbled spiced paneer with veggies, grilled between buttery bread.',
    required: [['bread', 6, 'slices'], ['paneer', 150, 'g']],
    optional: [['capsicum', 0.5, 'finely chopped'], ['tameta', 1, 'finely chopped'], ['makhan', 2, 'tbsp'], ['cheese', 3, 'slices'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped']],
    pantry: 'Salt, black pepper, chaat masala, a spoon of curd or ketchup to bind',
    steps: [
      'Crumble paneer and mix with vegetables, spices and a little curd or ketchup.',
      'Butter the bread, spread the filling and close.',
      'Grill or toast on a tawa until golden and crisp.'
    ]
  },
  {
    id: 'cheese-toast', name: 'Cheese Toast', gu: 'ચીઝ ટોસ્ટ', aka: ['cheese chilli toast', 'chilli cheese toast', 'corn cheese toast'],
    category: 'snack', gujarati: false, time: 12, difficulty: 'Easy', servings: 2, fried: false, filling: false, emoji: '🧀',
    description: 'Melty cheese on crisp toast — ready in minutes.',
    required: [['bread', 4, 'slices'], ['cheese', 1, 'cup, grated']],
    optional: [['makhan', 1, 'tbsp'], ['capsicum', 0.25, 'cup, finely chopped'], ['corn', 0.25, 'cup'], ['marcha', 1, 'finely chopped']],
    pantry: 'Oregano, chilli flakes, black pepper',
    steps: [
      'Lightly butter the bread.',
      'Top with cheese and any chopped vegetables; sprinkle herbs.',
      'Cook on a covered tawa on low heat until the cheese melts and the base is crisp.'
    ]
  },
  {
    id: 'corn-chaat', name: 'Corn Chaat', gu: 'મકાઈ ચાટ', aka: ['corn salad', 'masala corn', 'sweet corn chaat', 'corn bhel', 'butter corn'],
    category: 'snack', gujarati: false, time: 10, difficulty: 'Easy', servings: 2, fried: false, filling: false, emoji: '🌽',
    description: 'Warm buttery corn tossed with veggies, lemon and chaat masala.',
    required: [['corn', 2, 'cup']],
    optional: [['tameta', 1, 'finely chopped'], ['kakdi', 0.5, 'finely chopped'], ['capsicum', 0.25, 'cup, chopped'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['sev', 0.25, 'cup'], ['makhan', 1, 'tbsp']],
    pantry: 'Salt, chaat masala, red chilli powder, lemon juice',
    steps: [
      'Boil or steam the corn for 5–7 minutes and drain.',
      'Toss with butter while warm.',
      'Add vegetables, spices and lemon juice; mix well.',
      'Top with sev just before serving.'
    ]
  },
  {
    id: 'bhel-puri', name: 'Bhel Puri', gu: 'ભેળ', aka: ['bhel', 'bhelpuri', 'sukhi bhel', 'mamra bhel', 'chatpati bhel'],
    category: 'snack', gujarati: false, time: 15, difficulty: 'Easy', servings: 3, fried: false, filling: false, emoji: '🥗',
    description: 'Crunchy, tangy puffed-rice chaat with chutneys and sev.',
    required: [['mamra', 3, 'cup'], ['sev', 0.5, 'cup']],
    optional: [['papdi', 8, 'crushed'], ['bataka', 1, 'boiled & chopped', 'kachakela'], ['tameta', 1, 'finely chopped'], ['kakdi', 0.5, 'finely chopped'], ['aamli', 3, 'tbsp sweet chutney'], ['kothmir', 2, 'tbsp'], ['sing', 2, 'tbsp, roasted'], ['dungri', 1, 'finely chopped']],
    pantry: 'Salt, chaat masala, red chilli powder, lemon juice, green chutney',
    steps: [
      'Dry-roast the mamra for 2 minutes if it is not crisp.',
      'In a big bowl mix mamra, vegetables, peanuts and crushed papdi.',
      'Add sweet and green chutney, spices and lemon; toss quickly.',
      'Top with sev and coriander and serve immediately.'
    ]
  },
  {
    id: 'poha', name: 'Poha', gu: 'પૌંઆ', aka: ['bataka poha', 'batata poha', 'pauva', 'kanda poha', 'vagharela pauva'],
    category: 'snack', gujarati: true, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🍛',
    description: 'Light, lemony flattened rice with peanuts and peas.',
    required: [['poha', 2, 'cup']],
    optional: [['bataka', 1, 'small, cubed'], ['vatana', 0.25, 'cup'], ['sing', 2, 'tbsp'], ['marcha', 1, 'chopped'], ['kothmir', 2, 'tbsp'], ['sev', 0.25, 'cup (to serve)'], ['dungri', 1, 'chopped']],
    pantry: 'Oil, rai, jeeru, hing, haldi, curry leaves, sugar, salt, lemon juice',
    steps: [
      'Rinse poha in a strainer, drain and rest 5 minutes.',
      'Heat oil; add rai, jeeru, hing, curry leaves, chilli and peanuts.',
      'Add potato and peas; cover and cook until soft.',
      'Add poha, haldi, salt and sugar; mix gently and steam covered 2 minutes.',
      'Finish with lemon juice, coriander and sev.'
    ]
  },
  {
    id: 'upma', name: 'Vegetable Upma', gu: 'ઉપમા', aka: ['upma', 'uppit', 'sooji upma', 'rava upma'],
    category: 'snack', gujarati: false, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🍲',
    description: 'Comforting semolina cooked with vegetables and a South Indian tadka.',
    required: [['rava', 1, 'cup']],
    optional: [['vatana', 0.25, 'cup'], ['gajar', 0.25, 'cup, chopped'], ['capsicum', 0.25, 'cup, chopped'], ['tameta', 1, 'chopped'], ['marcha', 1, 'chopped'], ['sing', 2, 'tbsp'], ['adu', 1, 'tsp, grated'], ['dungri', 1, 'chopped'], ['kothmir', 2, 'tbsp']],
    pantry: 'Ghee or oil, rai, chana dal and urad dal (for tadka), hing, curry leaves, salt, sugar, lemon',
    steps: [
      'Dry-roast rava on low heat until aromatic; keep aside.',
      'Heat ghee; add rai, dals, hing, curry leaves, chilli and peanuts.',
      'Add vegetables and sauté 3–4 minutes.',
      'Pour in 2½ cups hot water with salt and a little sugar; bring to a boil.',
      'Add rava slowly while stirring; cover and cook 2 minutes.',
      'Finish with lemon juice and coriander.'
    ]
  },

  /* ------------------ Light meals & more ------------------ */
  {
    id: 'besan-chilla', name: 'Besan Chilla (Pudla)', gu: 'બેસનના પુડલા', aka: ['chilla', 'cheela', 'pudla', 'besan pudla', 'tameta pudla', 'veg omelette'],
    category: 'snack', gujarati: true, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🥞',
    description: 'Thin savoury besan pancakes with tomato and herbs — quick and protein-rich.',
    required: [['besan', 1, 'cup']],
    optional: [['tameta', 1, 'finely chopped'], ['capsicum', 0.25, 'cup, chopped'], ['methi', 0.25, 'cup, chopped'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['adu', 1, 'tsp, grated'], ['dahi', 2, 'tbsp']],
    pantry: 'Salt, haldi, ajwain, red chilli powder, oil',
    steps: [
      'Whisk besan with water to a pouring batter; add vegetables and spices.',
      'Pour a ladle on a hot greased tawa and spread thin.',
      'Drizzle oil around and cook until the base is golden; flip and cook the other side.',
      'Serve with green chutney or ketchup.'
    ]
  },
  {
    id: 'moong-dal-chilla', name: 'Moong Dal Chilla', gu: 'મગની દાળના પુડલા', aka: ['moong chilla', 'moong dal pudla', 'pesarattu', 'moong dal cheela'],
    category: 'snack', gujarati: false, time: 30, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🥞',
    description: 'Healthy dal pancakes, optionally stuffed with paneer. Soak the dal 2–3 hours ahead.',
    required: [['moongdal', 1, 'cup, soaked 2–3 hours']],
    optional: [['kothmir', 2, 'tbsp'], ['marcha', 1, ''], ['adu', 1, 'tsp'], ['paneer', 100, 'g, crumbled'], ['capsicum', 0.25, 'cup, chopped']],
    pantry: 'Salt, jeeru, hing, oil',
    steps: [
      'Grind the soaked dal with chilli and very little water to a smooth batter.',
      'Add salt, jeeru, hing and coriander.',
      'Spread thin on a hot greased tawa; drizzle oil.',
      'Add crumbled paneer and capsicum on top if you like; fold and serve.'
    ]
  },
  {
    id: 'meetha-pudla', name: 'Gol na Meetha Pudla', gu: 'ગોળના મીઠા પુડલા', aka: ['meetha pudla', 'sweet pudla', 'gud pudla', 'gol pudla', 'pudla'],
    category: 'snack', gujarati: true, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: false, emoji: '🥞',
    description: 'Comforting sweet wheat pancakes with jaggery, saunf and elaichi.',
    required: [['ghaunolot', 1, 'cup']],
    optional: [['doodh', 0.5, 'cup']],
    pantry: 'Jaggery (½ cup), saunf, elaichi powder, a pinch of salt, ghee',
    steps: [
      'Dissolve jaggery in ¾ cup warm water (or milk + water).',
      'Whisk in flour, saunf, elaichi and a pinch of salt to a flowing batter; rest 10 minutes.',
      'Spread a ladle on a greased tawa, drizzle ghee and cook both sides until golden.'
    ]
  },
  {
    id: 'mixed-veg-paratha', name: 'Mixed Veg Paratha', gu: 'મિક્સ વેજ પરાઠા', aka: ['veg paratha', 'vegetable paratha', 'kobi paratha', 'mix veg paratha'],
    category: 'meal', gujarati: false, time: 35, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Wholesome parathas with grated cabbage and other vegetables kneaded right in.',
    required: [['ghaunolot', 2, 'cup'], ['cabbage', 1, 'cup, grated']],
    optional: [['gajar', 0.5, 'cup, grated'], ['capsicum', 0.25, 'cup, chopped'], ['vatana', 0.25, 'cup, crushed'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped']],
    pantry: 'Salt, garam masala, ajwain, red chilli powder, ghee or oil',
    steps: [
      'Lightly squeeze the grated vegetables.',
      'Add flour and spices and knead a soft dough (add water only if needed).',
      'Roll into parathas and cook on a tawa with ghee until golden spots appear.',
      'Serve with curd and pickle.'
    ]
  },
  {
    id: 'aloo-paratha', name: 'Aloo Paratha', gu: 'આલુ પરાઠા', aka: ['bataka paratha', 'potato paratha', 'aloo parotha', 'aaloo paratha'],
    category: 'meal', gujarati: false, time: 35, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Stuffed parathas with spiced mashed potato — a filling evening meal.',
    required: [['ghaunolot', 2, 'cup'], ['bataka', 3, 'medium, boiled', 'kachakela']],
    optional: [['marcha', 1, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['adu', 1, 'tsp, grated'], ['dahi', 1, 'cup (to serve)'], ['makhan', 1, 'tbsp (to serve)']],
    pantry: 'Salt, garam masala, amchur, red chilli powder, ghee',
    steps: [
      'Knead a soft wheat dough and rest 10 minutes.',
      'Mash the potatoes with spices, chilli and coriander.',
      'Roll a small disc, place filling, close and roll gently into a paratha.',
      'Cook on a hot tawa with ghee until golden on both sides.',
      'Serve with curd, butter and pickle.'
    ]
  },
  {
    id: 'palak-paratha', name: 'Palak Paratha', gu: 'પાલક પરાઠા', aka: ['palak thepla', 'spinach paratha', 'palak parotha'],
    category: 'meal', gujarati: false, time: 30, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Bright green parathas made with spinach purée — kids love them.',
    required: [['ghaunolot', 2, 'cup'], ['palak', 1, 'bunch']],
    optional: [['marcha', 1, ''], ['besan', 2, 'tbsp'], ['dahi', 2, 'tbsp'], ['adu', 1, 'tsp']],
    pantry: 'Salt, ajwain, jeeru, oil or ghee',
    steps: [
      'Blanch palak for 2 minutes, cool and blend with the chilli.',
      'Knead flour, spices and palak purée into a soft dough.',
      'Roll and cook on a tawa with a little oil or ghee.'
    ]
  },
  {
    id: 'paneer-paratha', name: 'Paneer Paratha', gu: 'પનીર પરાઠા', aka: ['paneer parotha', 'stuffed paneer paratha'],
    category: 'meal', gujarati: false, time: 30, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Soft parathas stuffed with spiced crumbled paneer.',
    required: [['ghaunolot', 2, 'cup'], ['paneer', 200, 'g, grated']],
    optional: [['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['capsicum', 0.25, 'cup, finely chopped'], ['makhan', 1, 'tbsp']],
    pantry: 'Salt, garam masala, chaat masala, red chilli powder, ghee',
    steps: [
      'Knead a soft dough and rest 10 minutes.',
      'Mix grated paneer with spices, chilli and coriander.',
      'Stuff, roll gently and cook with ghee until golden.'
    ]
  },
  {
    id: 'palak-paneer', name: 'Palak Paneer (Jain style)', gu: 'પાલક પનીર', aka: ['palak paneer', 'saag paneer', 'spinach paneer'],
    category: 'meal', gujarati: false, time: 35, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🥬',
    description: 'Creamy spinach gravy with soft paneer — made without onion or garlic.',
    required: [['palak', 1, 'large bunch'], ['paneer', 200, 'g, cubed'], ['tameta', 2, 'puréed']],
    optional: [['marcha', 1, ''], ['adu', 1, 'tsp, grated'], ['doodh', 0.25, 'cup (or cream)'], ['makhan', 1, 'tbsp']],
    pantry: 'Oil or ghee, jeeru, hing, haldi, red chilli powder, garam masala, kasuri methi, salt',
    steps: [
      'Blanch palak for 2 minutes, plunge in cold water, then blend smooth with the chilli.',
      'Heat ghee; add jeeru and hing, then the tomato purée; cook until oil separates.',
      'Add spices and the palak purée; simmer 4–5 minutes.',
      'Add paneer and milk; simmer 2 minutes and finish with kasuri methi and butter.',
      'Serve with rotli or paratha.'
    ]
  },
  {
    id: 'veg-pulao', name: 'Vegetable Pulao', gu: 'વેજ પુલાવ', aka: ['pulao', 'pulav', 'veg pulav', 'masala rice'],
    category: 'meal', gujarati: false, time: 35, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🍚',
    description: 'Fragrant one-pot rice with vegetables and whole spices.',
    required: [['chokha', 1, 'cup']],
    optional: [['vatana', 0.5, 'cup'], ['gajar', 0.5, 'cup, chopped'], ['capsicum', 0.5, 'cup, chopped'], ['corn', 0.25, 'cup'], ['cauliflower', 0.5, 'cup, small florets'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'slit']],
    pantry: 'Ghee, jeeru, tej patta, cloves, cinnamon, elaichi, salt, garam masala',
    steps: [
      'Wash and soak the rice for 20 minutes.',
      'Heat ghee; add whole spices and jeeru.',
      'Add vegetables and sauté for 3 minutes.',
      'Add drained rice, 2 cups hot water and salt.',
      'Pressure-cook for 2 whistles (or cook covered 12–15 minutes). Rest 5 minutes and fluff.',
      'Serve with curd or kadhi.'
    ]
  },
  {
    id: 'khichdi', name: 'Vagharela Khichdi', gu: 'ખીચડી', aka: ['khichdi', 'khichadi', 'masala khichdi', 'dal khichdi', 'vaghareli khichdi'],
    category: 'meal', gujarati: true, time: 30, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🍲',
    description: 'Soft rice and moong dal khichdi — comfort food, best with kadhi.',
    required: [['chokha', 0.5, 'cup'], ['moongdal', 0.5, 'cup']],
    optional: [['vatana', 0.25, 'cup'], ['dudhi', 0.5, 'cup, cubed'], ['tameta', 1, 'chopped']],
    pantry: 'Ghee, jeeru, hing, haldi, salt, cloves, black pepper',
    steps: [
      'Wash rice and dal together and soak 15 minutes.',
      'Heat ghee; add jeeru, cloves, pepper and hing.',
      'Add vegetables, then the rice and dal, haldi, salt and 3½ cups water.',
      'Pressure-cook for 3 whistles. Serve hot with ghee and kadhi.'
    ]
  },
  {
    id: 'kadhi', name: 'Gujarati Kadhi', gu: 'ગુજરાતી કઢી', aka: ['kadhi', 'kadi', 'gujarati kadhi', 'mithi kadhi'],
    category: 'meal', gujarati: true, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: false, emoji: '🥣',
    description: 'Light, sweet-and-sour curd kadhi — pairs perfectly with khichdi.',
    required: [['dahi', 2, 'cup'], ['besan', 2, 'tbsp']],
    optional: [['marcha', 1, 'slit'], ['adu', 1, 'tsp, grated'], ['kothmir', 2, 'tbsp']],
    pantry: 'Jaggery or sugar, salt, ghee, jeeru, rai, methi seeds, cloves, cinnamon, curry leaves, hing',
    steps: [
      'Whisk curd, besan, 2 cups water, salt and jaggery until smooth.',
      'Heat on medium, stirring continuously until it boils (this stops it from splitting).',
      'Simmer 8–10 minutes.',
      'Temper ghee with jeeru, rai, methi seeds, cloves, cinnamon, curry leaves and hing; pour in.',
      'Garnish with coriander. Serve with khichdi or rice.'
    ]
  },
  {
    id: 'dal-dhokli', name: 'Dal Dhokli', gu: 'દાળ ઢોકળી', aka: ['dal dhokli', 'daal dhokli', 'dal dhokri', 'varan phal'],
    category: 'meal', gujarati: true, time: 50, difficulty: 'Medium', servings: 4, fried: false, filling: true, emoji: '🍲',
    description: 'One-pot Gujarati meal: spiced wheat dumplings simmered in sweet-tangy tuver dal.',
    required: [['toordal', 0.75, 'cup'], ['ghaunolot', 1, 'cup']],
    optional: [['sing', 2, 'tbsp'], ['tameta', 1, 'chopped'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'slit'], ['adu', 1, 'tsp, grated']],
    pantry: 'Kokum or lemon, jaggery, haldi, red chilli powder, ajwain, salt, ghee, rai, jeeru, hing, cloves, curry leaves',
    steps: [
      'Pressure-cook the dal until soft; whisk with 3 cups water.',
      'Add jaggery, kokum, salt, spices, peanuts and tomato; bring to a simmer.',
      'Knead a firm dough of flour, haldi, chilli powder, ajwain, salt and 1 tbsp oil.',
      'Roll thin, cut into diamonds and drop them one by one into the boiling dal.',
      'Cook 12–15 minutes, stirring gently, until the dhokli are cooked through.',
      'Pour a ghee tadka on top and garnish with coriander.'
    ]
  },
  {
    id: 'stuffed-capsicum', name: 'Stuffed Capsicum (Besan Masala)', gu: 'ભરેલા કેપ્સીકમ', aka: ['bharela capsicum', 'bharela marcha', 'stuffed shimla mirch', 'bharwa capsicum'],
    category: 'meal', gujarati: true, time: 35, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🫑',
    description: 'Capsicums filled with roasted besan, peanut and coconut masala, cooked slowly.',
    required: [['capsicum', 4, 'medium'], ['besan', 0.5, 'cup']],
    optional: [['sing', 2, 'tbsp, crushed'], ['topru', 2, 'tbsp'], ['kothmir', 2, 'tbsp'], ['paneer', 100, 'g (alternative stuffing)']],
    pantry: 'Salt, haldi, red chilli powder, dhana-jiru, sugar, lemon juice, oil',
    steps: [
      'Dry-roast besan on low heat until aromatic.',
      'Mix it with peanuts, coconut, spices, sugar, lemon and 2 tbsp oil.',
      'Cut the tops off the capsicums, remove seeds and stuff firmly.',
      'Cook covered in an oiled pan on low heat for 15–18 minutes, turning occasionally.',
      'Serve with rotli or paratha.'
    ]
  },
  {
    id: 'paneer-bhurji', name: 'Paneer Bhurji (no onion-garlic)', gu: 'પનીર ભુરજી', aka: ['paneer bhurji', 'paneer scramble', 'paneer burji'],
    category: 'meal', gujarati: false, time: 15, difficulty: 'Easy', servings: 2, fried: false, filling: true, emoji: '🥘',
    description: 'Quick scrambled paneer with tomato and capsicum — great with pav or rotli.',
    required: [['paneer', 200, 'g, crumbled'], ['tameta', 2, 'finely chopped']],
    optional: [['capsicum', 0.5, 'finely chopped'], ['vatana', 0.25, 'cup'], ['marcha', 1, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['makhan', 1, 'tbsp'], ['adu', 1, 'tsp, grated'], ['dungri', 1, 'finely chopped']],
    pantry: 'Oil or butter, jeeru, hing, haldi, red chilli powder, pav bhaji masala or garam masala, kasuri methi, salt',
    steps: [
      'Heat butter; add jeeru and hing.',
      'Add tomato, capsicum and spices; cook until soft.',
      'Add crumbled paneer and mix well; cook 2–3 minutes.',
      'Finish with kasuri methi and coriander. Serve with toasted pav or rotli.'
    ]
  },
  {
    id: 'veg-uttapam', name: 'Instant Rava Uttapam', gu: 'ઉત્તપમ', aka: ['uttapam', 'uthappam', 'rava uttapam', 'veg uttapam'],
    category: 'meal', gujarati: false, time: 25, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🥞',
    description: 'Thick, soft rava pancakes topped with colourful vegetables.',
    required: [['rava', 1, 'cup'], ['dahi', 0.5, 'cup']],
    optional: [['tameta', 1, 'finely chopped'], ['capsicum', 0.25, 'cup, chopped'], ['gajar', 0.25, 'cup, grated'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['dungri', 1, 'finely chopped']],
    pantry: 'Salt, eno or soda, oil',
    steps: [
      'Mix rava, curd, salt and water to a thick batter; rest 15 minutes.',
      'Add a pinch of eno just before cooking.',
      'Pour a thick round on a greased tawa and press the toppings on top.',
      'Cook covered until the base is golden; flip and cook briefly.',
      'Serve with coconut chutney.'
    ]
  },
  {
    id: 'rava-dosa', name: 'Rava Dosa', gu: 'રવા ઢોંસા', aka: ['rava dosa', 'sooji dosa', 'instant dosa', 'dosa', 'dhosa'],
    category: 'meal', gujarati: false, time: 30, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🌯',
    description: 'Lacy, crisp instant dosa — no grinding or fermenting.',
    required: [['rava', 0.5, 'cup'], ['chokhanolot', 0.5, 'cup']],
    optional: [['maida', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['adu', 1, 'tsp, grated'], ['kothmir', 2, 'tbsp']],
    pantry: 'Salt, jeeru, crushed black pepper, curry leaves, oil',
    steps: [
      'Mix rava, rice flour, maida, salt and spices with 2½–3 cups water — it must be very thin.',
      'Rest 20 minutes.',
      'Heat the tawa very hot. Stir the batter and pour it from a height in circles (do not spread).',
      'Drizzle oil and cook until crisp and golden; fold and serve with chutney.'
    ]
  },
  {
    id: 'ringan-olo', name: 'Ringan no Olo & Bajri Rotla', gu: 'રીંગણનો ઓળો અને રોટલા', aka: ['olo', 'oro', 'ringan no olo', 'baingan bharta', 'bharthu', 'rotla', 'bajri rotla'],
    category: 'meal', gujarati: true, time: 45, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🍆',
    description: 'Smoky roasted brinjal with tomato, served with rustic bajri rotla and butter.',
    required: [['ringan', 1, 'large'], ['bajrinolot', 1.5, 'cup']],
    optional: [['tameta', 2, 'chopped'], ['marcha', 2, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['makhan', 2, 'tbsp (to serve)'], ['dungri', 1, 'chopped'], ['lasan', 4, 'cloves']],
    pantry: 'Oil, jeeru, hing, haldi, red chilli powder, salt, ghee',
    steps: [
      'Roast the brinjal on a flame until the skin chars and it turns soft; peel and mash.',
      'Heat oil; add jeeru, hing, chilli and tomatoes; cook until soft.',
      'Add the mashed brinjal and spices; cook 5 minutes.',
      'Knead bajri flour with warm water; pat into rotlas by hand and cook on a clay or iron tawa.',
      'Serve hot with butter or ghee, olo and buttermilk.'
    ]
  },
  {
    id: 'bhinda-shaak', name: 'Bhinda nu Shaak & Rotli', gu: 'ભીંડાનું શાક અને રોટલી', aka: ['bhindi', 'bhinda nu shaak', 'bhindi sabzi', 'okra sabzi', 'rotli shaak', 'besan bhinda'],
    category: 'meal', gujarati: true, time: 30, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Simple dry okra sabzi with soft rotlis — a classic everyday dinner.',
    required: [['bhinda', 250, 'g'], ['ghaunolot', 1.5, 'cup']],
    optional: [['besan', 2, 'tbsp'], ['marcha', 1, 'chopped'], ['sing', 2, 'tbsp, crushed']],
    pantry: 'Oil, rai, jeeru, hing, haldi, red chilli powder, dhana-jiru, salt, a pinch of sugar, ghee',
    steps: [
      'Wash the okra and dry it completely BEFORE cutting — this stops sliminess.',
      'Heat oil; add rai, jeeru, hing, then the okra.',
      'Cook uncovered on medium for 12–15 minutes, stirring now and then.',
      'Add spices (and roasted besan if you like); cook 2 more minutes.',
      'Meanwhile knead a soft dough, roll thin rotlis and cook with a little ghee.'
    ]
  },
  {
    id: 'tameta-soup', name: 'Jain Tomato Soup', gu: 'ટામેટાનો સૂપ', aka: ['tomato soup', 'tameta soup', 'soup'],
    category: 'meal', gujarati: false, time: 20, difficulty: 'Easy', servings: 3, fried: false, filling: false, emoji: '🍅',
    description: 'Light, warming tomato soup with buttery croutons.',
    required: [['tameta', 5, 'medium']],
    optional: [['makhan', 1, 'tbsp'], ['bread', 2, 'slices (for croutons)'], ['gajar', 1, 'small, for sweetness'], ['kothmir', 1, 'tbsp']],
    pantry: 'Salt, sugar, black pepper, bay leaf, cornflour (optional, to thicken)',
    steps: [
      'Pressure-cook the tomatoes (and carrot) with 2 cups water for 2 whistles.',
      'Blend smooth and strain.',
      'Simmer with butter, bay leaf, salt, sugar and pepper; thicken with a little cornflour if you like.',
      'Toast cubes of bread in butter for croutons and serve on top.'
    ]
  },
  {
    id: 'paneer-tikka', name: 'Tawa Paneer Tikka', gu: 'પનીર ટિક્કા', aka: ['paneer tikka', 'tikka', 'paneer starter'],
    category: 'snack', gujarati: false, time: 30, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🍢',
    description: 'Spiced, charred paneer and capsicum cooked on a tawa — no oven needed.',
    required: [['paneer', 200, 'g, cubed'], ['dahi', 0.5, 'cup, thick']],
    optional: [['capsicum', 1, 'cubed'], ['tameta', 1, 'deseeded, cubed'], ['besan', 1, 'tbsp, roasted'], ['makhan', 1, 'tbsp']],
    pantry: 'Kashmiri chilli powder, haldi, garam masala, chaat masala, kasuri methi, salt, oil, lemon',
    steps: [
      'Whisk thick curd with roasted besan, spices, salt and 1 tsp oil.',
      'Coat the paneer and vegetables; rest 15 minutes.',
      'Cook on a hot oiled tawa, turning, until charred spots appear.',
      'Sprinkle chaat masala and lemon; serve with green chutney.'
    ]
  },
  {
    id: 'rava-idli', name: 'Instant Rava Idli', gu: 'રવા ઇડલી', aka: ['idli', 'rava idli', 'sooji idli', 'idly'],
    category: 'snack', gujarati: false, time: 25, difficulty: 'Easy', servings: 3, fried: false, filling: true, emoji: '⚪',
    description: 'Soft steamed idlis from rava and curd — no fermentation.',
    required: [['rava', 1, 'cup'], ['dahi', 0.75, 'cup']],
    optional: [['gajar', 0.25, 'cup, grated'], ['vatana', 0.25, 'cup'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['adu', 1, 'tsp, grated']],
    pantry: 'Salt, eno or soda, oil, rai, chana dal, curry leaves, hing',
    steps: [
      'Temper rai, chana dal, curry leaves and hing in oil; add rava and roast 2 minutes. Cool.',
      'Mix in curd, vegetables, salt and water to a thick batter; rest 15 minutes.',
      'Add 1 tsp eno, pour into greased idli moulds and steam 12 minutes.',
      'Serve with coconut chutney or sambhar.'
    ]
  },
  {
    id: 'pav-bhaji', name: 'Pav Bhaji (Jain style)', gu: 'પાઉંભાજી', aka: ['pav bhaji', 'paubhaji', 'bhaji pav', 'paav bhaji'],
    category: 'meal', gujarati: false, time: 45, difficulty: 'Medium', servings: 4, fried: false, filling: true, emoji: '🍛',
    description: 'Buttery mashed vegetable bhaji with toasted pav — a weekend-style dinner.',
    required: [['pav', 8, ''], ['bataka', 3, 'medium, boiled', 'kachakela'], ['tameta', 4, 'chopped']],
    optional: [['capsicum', 1, 'finely chopped'], ['vatana', 0.5, 'cup'], ['cauliflower', 1, 'cup, florets'], ['gajar', 1, 'chopped'], ['makhan', 3, 'tbsp'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['dungri', 1, 'finely chopped']],
    pantry: 'Pav bhaji masala, Kashmiri chilli powder, haldi, salt, lemon',
    steps: [
      'Boil or pressure-cook the vegetables (except capsicum) until very soft; mash.',
      'In butter cook capsicum and tomatoes until mushy.',
      'Add pav bhaji masala, chilli powder, haldi and salt.',
      'Add the mashed vegetables and a little water; mash and simmer 8–10 minutes.',
      'Toast pav in butter. Serve bhaji with butter, coriander and lemon.'
    ]
  },
  {
    id: 'sing-chaat', name: 'Masala Sing Chaat', gu: 'મસાલા સીંગ ચાટ', aka: ['peanut chaat', 'sing chaat', 'masala peanuts', 'peanut salad', 'shing chaat'],
    category: 'snack', gujarati: true, time: 10, difficulty: 'Easy', servings: 2, fried: false, filling: false, emoji: '🥜',
    description: 'Crunchy peanuts tossed with veggies, lemon and chaat masala.',
    required: [['sing', 1, 'cup, roasted or boiled']],
    optional: [['tameta', 1, 'finely chopped'], ['kakdi', 0.5, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['marcha', 1, 'finely chopped'], ['sev', 0.25, 'cup']],
    pantry: 'Salt, chaat masala, red chilli powder, lemon juice',
    steps: [
      'Use roasted peanuts, or boil raw peanuts with salt for 10 minutes and drain.',
      'Toss with chopped vegetables, spices and lemon juice.',
      'Top with sev and serve straight away.'
    ]
  },
  {
    id: 'khichu', name: 'Chokha nu Khichu', gu: 'ચોખાનું ખીચું', aka: ['khichu', 'khichiyu', 'papdi no lot', 'rice flour khichu', 'khichiya no lot'],
    category: 'snack', gujarati: true, time: 25, difficulty: 'Easy', servings: 3, fried: false, filling: false, emoji: '🍥',
    description: 'Soft, steamed rice-flour dough with jeeru and chilli — served with oil and methia masala.',
    required: [['chokhanolot', 1, 'cup']],
    optional: [['marcha', 2, 'finely chopped'], ['kothmir', 1, 'tbsp']],
    pantry: 'Jeeru, ajwain, salt, papad khar or a pinch of soda, groundnut oil and methia masala to serve',
    steps: [
      'Boil 2 cups water with jeeru, ajwain, chilli, salt and papad khar.',
      'Lower the heat and add rice flour all at once; stir hard with a rolling-pin end so there are no lumps.',
      'Cover and steam on low heat for 7–8 minutes.',
      'Serve hot, drizzled with oil and sprinkled with methia masala.'
    ]
  },
  {
    id: 'gobi-paratha', name: 'Gobi Paratha', gu: 'ફ્લાવર પરાઠા', aka: ['cauliflower paratha', 'flower paratha', 'gobhi paratha'],
    category: 'meal', gujarati: false, time: 35, difficulty: 'Medium', servings: 3, fried: false, filling: true, emoji: '🫓',
    description: 'Parathas stuffed with grated, spiced cauliflower.',
    required: [['ghaunolot', 2, 'cup'], ['cauliflower', 1.5, 'cup, grated']],
    optional: [['marcha', 1, 'finely chopped'], ['kothmir', 2, 'tbsp'], ['adu', 1, 'tsp, grated'], ['dahi', 1, 'cup (to serve)']],
    pantry: 'Salt, garam masala, amchur, ajwain, ghee',
    steps: [
      'Knead a soft dough and rest.',
      'Mix grated cauliflower with salt and spices; squeeze out the water just before stuffing.',
      'Stuff, roll gently and cook with ghee until golden.'
    ]
  }
];


/* =====================================================================
   3. SMALL HELPERS
   ===================================================================== */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** Escape any text before putting it into HTML (protects against broken markup). */
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

/** Only allow simple hex colours in inline styles. */
function safeColor(value, fallback = '#eef3e6') {
  return /^#[0-9a-f]{3,8}$/i.test(String(value || '')) ? value : fallback;
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Small, fast string hash — used for gentle day-to-day variety in suggestions. */
function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeId(prefix, name) {
  const slug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item';
  return `${prefix}${slug}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function splitList(text) {
  return String(text || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function debounce(fn, wait = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
}

/** "2 days ago" style text for the recently-made list. */
function relativeDay(timestamp) {
  const days = Math.floor((startOfDay(Date.now()) - startOfDay(timestamp)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

/** Turn 0.5 into "½", 1.25 into "1¼" etc. Returns '' when there is no number. */
function formatQty(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 4) / 4;
  if (rounded === 0) return '¼';
  const whole = Math.floor(rounded);
  const frac = Math.round((rounded - whole) * 100) / 100;
  const fracText = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[frac] || '';
  return `${whole || ''}${fracText}` || '0';
}


/* =====================================================================
   4. STORAGE
   ---------------------------------------------------------------------
   Text data (settings, favourites, custom recipes…) → localStorage.
   Photos → IndexedDB (much more space), resized to ~640px first.
   If IndexedDB is unavailable, small photos fall back to localStorage.
   ===================================================================== */

const STORAGE_PREFIX = 'asb_';

const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('Could not save', key, err);
      showToast('Could not save — this browser’s storage may be full or blocked.');
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (err) { /* ignore */ }
  },
  clearAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (err) { /* ignore */ }
  }
};

const ImageStore = {
  db: null,
  available: false,

  init() {
    return new Promise(resolve => {
      try {
        if (!('indexedDB' in window)) return resolve(false);
        const req = indexedDB.open('aaje-shu-banavishu', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('images');
        req.onsuccess = () => { this.db = req.result; this.available = true; resolve(true); };
        req.onerror = () => resolve(false);
        req.onblocked = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  },

  _tx(mode) { return this.db.transaction('images', mode).objectStore('images'); },

  async getAll() {
    const images = new Map();
    // Fallback copies kept in localStorage
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX + 'img_'))
        .forEach(k => images.set(k.slice((STORAGE_PREFIX + 'img_').length), localStorage.getItem(k)));
    } catch (err) { /* ignore */ }
    if (!this.available) return images;
    return new Promise(resolve => {
      try {
        const req = this._tx('readonly').openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) { images.set(String(cursor.key), cursor.value); cursor.continue(); }
          else resolve(images);
        };
        req.onerror = () => resolve(images);
      } catch (err) { resolve(images); }
    });
  },

  async put(key, dataUrl) {
    if (this.available) {
      const ok = await new Promise(resolve => {
        try {
          const tx = this.db.transaction('images', 'readwrite');
          tx.objectStore('images').put(dataUrl, key);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
          tx.onabort = () => resolve(false);
        } catch (err) { resolve(false); }
      });
      if (ok) return true;
    }
    try {
      localStorage.setItem(STORAGE_PREFIX + 'img_' + key, dataUrl);
      return true;
    } catch (err) {
      return false;
    }
  },

  async remove(key) {
    try { localStorage.removeItem(STORAGE_PREFIX + 'img_' + key); } catch (err) { /* ignore */ }
    if (!this.available) return;
    await new Promise(resolve => {
      try {
        const tx = this.db.transaction('images', 'readwrite');
        tx.objectStore('images').delete(key);
        tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
      } catch (err) { resolve(); }
    });
  },

  async clear() {
    if (!this.available) return;
    await new Promise(resolve => {
      try {
        const tx = this.db.transaction('images', 'readwrite');
        tx.objectStore('images').clear();
        tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
      } catch (err) { resolve(); }
    });
  }
};

/** Read a photo from the gallery/camera, shrink it, and return a JPEG data URL. */
async function fileToResizedDataURL(file, maxSize = 640) {
  if (!file) throw new Error('no-file');
  const looksLikeImage = /^image\//.test(file.type || '') || /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name || '');
  if (!looksLikeImage) throw new Error('not-image');
  if (file.size > 25 * 1024 * 1024) throw new Error('too-big');

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('decode-failed'));
    image.src = dataUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function photoErrorMessage(err) {
  const code = err && err.message;
  if (code === 'not-image') return 'That file is not a photo. Please choose a JPG or PNG image.';
  if (code === 'too-big') return 'That photo is too large (over 25 MB). Please choose a smaller one.';
  return 'Could not read this photo. Please try a JPG or PNG image.';
}


/* =====================================================================
   5. APP STATE
   ===================================================================== */

const DEFAULT_SETTINGS = {
  strictJain: false,     // preset: switches on all Jain restrictions
  noOnionGarlic: true,   // on by default for a Jain household
  noRoots: false,        // potato, carrot, ginger… (families differ)
  noHardVeg: false,      // brinjal, cauliflower, cabbage
  allowSwaps: true,      // raw banana instead of potato, etc.
  noFried: false,        // hide deep-fried dishes
  excluded: [],          // ingredient ids the family never uses
  notes: ''              // free-text household notes shown on recipes
};

const FILTERS = [
  { id: 'q15', label: '⚡ Under 15 min' },
  { id: 'q30', label: '⏱️ Under 30 min' },
  { id: 'easy', label: '👌 Easy recipes' },
  { id: 'have', label: '🏠 Only what I have' },
  { id: 'gujarati', label: '🪔 Gujarati favourites' },
  { id: 'filling', label: '🍽️ Filling meals' },
  { id: 'nofry', label: '🚫 No frying' }
];

const state = {
  settings: { ...DEFAULT_SETTINGS },
  customIngredients: [],
  ingredientOverrides: {},
  deletedIngredients: [],
  customRecipes: [],
  recipeOverrides: {},
  deletedRecipes: [],
  favourites: [],
  suggestedLog: [],   // [{ id, day, t }]
  cookedLog: [],      // [{ id, t }]
  notToday: { day: '', ids: [] },

  ui: {
    view: 'home',
    selected: new Set(),   // today's ingredients (NOT saved unless asked)
    category: 'veg',
    filters: new Set(),
    refreshSeed: 0,
    hasSuggested: false,
    showAll: false,
    surpriseId: null,
    recipeQuery: '',
    recipeCat: 'all',
    detail: null,          // { id, servings }
    pendingImage: undefined, // undefined = unchanged, null = remove, string = new
    editorReturn: null
  },

  images: new Map(),        // 'ing:<id>' / 'rec:<id>' → data URL

  // Derived (rebuilt by rebuildData)
  ingredients: [],
  ingredientMap: new Map(),
  recipes: [],
  recipeMap: new Map()
};

function asArray(value) { return Array.isArray(value) ? value : []; }
function asObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

function loadState() {
  const saved = asObject(Store.get('settings', {}));
  state.settings = { ...DEFAULT_SETTINGS, ...saved };
  state.settings.excluded = asArray(state.settings.excluded).map(String);
  state.settings.notes = String(state.settings.notes || '');

  state.customIngredients = asArray(Store.get('customIngredients', []));
  state.ingredientOverrides = asObject(Store.get('ingredientOverrides', {}));
  state.deletedIngredients = asArray(Store.get('deletedIngredients', [])).map(String);
  state.customRecipes = asArray(Store.get('customRecipes', []));
  state.recipeOverrides = asObject(Store.get('recipeOverrides', {}));
  state.deletedRecipes = asArray(Store.get('deletedRecipes', [])).map(String);
  state.favourites = asArray(Store.get('favourites', [])).map(String);
  state.suggestedLog = asArray(Store.get('suggestedLog', [])).filter(e => e && e.id);
  state.cookedLog = asArray(Store.get('cookedLog', [])).filter(e => e && e.id);
  const nt = asObject(Store.get('notToday', {}));
  state.notToday = nt.day === todayKey() ? { day: nt.day, ids: asArray(nt.ids) } : { day: todayKey(), ids: [] };
}

function save(key) { return Store.set(key, state[key]); }

/** Ingredient records are merged from: built-ins + your edits + your own additions. */
function normalizeIngredient(raw, builtin, deleted) {
  const category = INGREDIENT_CATEGORIES.some(c => c.id === raw.category) ? raw.category : 'other';
  const name = String(raw.name || raw.local || 'Ingredient').trim();
  const ing = {
    id: String(raw.id),
    name,
    local: String(raw.local || name).trim(),
    gu: String(raw.gu || '').trim(),
    category,
    icon: String(raw.icon || '🥗'),
    bg: safeColor(raw.bg),
    aliases: asArray(raw.aliases).map(String),
    root: !!raw.root,
    onionGarlic: !!raw.onionGarlic,
    hardVeg: !!raw.hardVeg,
    builtin,
    deleted: !!deleted
  };
  const keys = [ing.name, ing.local, ing.gu, ...ing.aliases].map(normalizeText).filter(Boolean);
  ing.searchKeys = Array.from(new Set(keys));
  return ing;
}

function normalizeRecipeItem(item) {
  if (Array.isArray(item)) {
    return { id: String(item[0] || ''), qty: Number.isFinite(item[1]) ? item[1] : null, unit: String(item[2] || ''), sub: item[3] ? String(item[3]) : null };
  }
  const obj = asObject(item);
  const qty = obj.qty === '' || obj.qty === null || obj.qty === undefined ? null : Number(obj.qty);
  return { id: String(obj.id || ''), qty: Number.isFinite(qty) ? qty : null, unit: String(obj.unit || ''), sub: obj.sub ? String(obj.sub) : null };
}

function normalizeRecipe(raw, builtin) {
  const required = asArray(raw.required).map(normalizeRecipeItem).filter(i => i.id);
  const reqIds = new Set(required.map(i => i.id));
  const optional = asArray(raw.optional).map(normalizeRecipeItem).filter(i => i.id && !reqIds.has(i.id));
  return {
    id: String(raw.id),
    name: String(raw.name || 'Untitled dish'),
    gu: String(raw.gu || ''),
    aka: asArray(raw.aka).map(String),
    category: raw.category === 'meal' ? 'meal' : 'snack',
    gujarati: !!raw.gujarati,
    time: Math.round(clampNumber(raw.time, 1, 600, 30)),
    difficulty: raw.difficulty === 'Medium' ? 'Medium' : 'Easy',
    servings: Math.round(clampNumber(raw.servings, 1, 20, 2)),
    fried: !!raw.fried,
    filling: !!raw.filling,
    emoji: String(raw.emoji || '🍽️').slice(0, 8),
    description: String(raw.description || ''),
    required,
    optional,
    pantry: String(raw.pantry || ''),
    steps: asArray(raw.steps).map(String).filter(s => s.trim()),
    builtin,
    edited: builtin && !!state.recipeOverrides[raw.id]
  };
}

function rebuildData() {
  const ingredients = [];
  BUILTIN_INGREDIENTS.forEach(base => {
    const override = asObject(state.ingredientOverrides[base.id]);
    ingredients.push(normalizeIngredient({ ...base, ...override, id: base.id }, true, state.deletedIngredients.includes(base.id)));
  });
  state.customIngredients.forEach(c => { if (c && c.id) ingredients.push(normalizeIngredient(c, false, false)); });
  state.ingredients = ingredients;
  state.ingredientMap = new Map(ingredients.map(i => [i.id, i]));

  const recipes = [];
  BUILTIN_RECIPES.forEach(base => {
    if (state.deletedRecipes.includes(base.id)) return;
    const override = state.recipeOverrides[base.id];
    recipes.push(normalizeRecipe(override ? { ...base, ...override, id: base.id } : base, true));
  });
  state.customRecipes.forEach(r => { if (r && r.id) recipes.push(normalizeRecipe(r, false)); });
  state.recipes = recipes;
  state.recipeMap = new Map(recipes.map(r => [r.id, r]));
}

function getIngredient(id) { return state.ingredientMap.get(id); }

/** Friendly ingredient label: "Methi" */
function ingShort(id) {
  const ing = getIngredient(id);
  if (!ing) return String(id).replace(/^c_/, '').replace(/-[a-z0-9]+$/, '').replace(/[-_]/g, ' ');
  return ing.local || ing.name;
}
/** Full label: "Methi (Fenugreek)" */
function ingFull(id) {
  const ing = getIngredient(id);
  if (!ing) return ingShort(id);
  return ing.local && ing.local.toLowerCase() !== ing.name.toLowerCase() ? `${ing.local} (${ing.name})` : ing.name;
}


/* =====================================================================
   6. TEXT NORMALISATION & MULTILINGUAL SEARCH
   ---------------------------------------------------------------------
   Both what you type and every alias are passed through normalizeText(),
   so "Methee", "METHI", "methi " and "મેથી"/"મેથિ" all line up.
   ===================================================================== */

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  let s = String(value).normalize('NFC').toLowerCase().trim();

  // Gujarati script: ignore nasal marks and long/short vowel differences
  s = s.replace(/[ઁં઼]/g, '')  // ઁ ં ઼
       .replace(/ી/g, 'િ')          // ી → િ
       .replace(/ૂ/g, 'ુ')          // ૂ → ુ
       .replace(/ઈ/g, 'ઇ')          // ઈ → ઇ
       .replace(/ઊ/g, 'ઉ')          // ઊ → ઉ
       .replace(/ળ/g, 'લ');         // ળ → લ

  // Keep only Latin letters, digits and Gujarati characters (drops spaces, dashes…)
  s = s.replace(/[^a-z0-9઀-૿]/g, '');

  if (/[a-z]/.test(s)) {
    // Common transliteration differences: ee/i, oo/u, w/v, aspirated letters, double letters
    s = s.replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/w/g, 'v').replace(/ph/g, 'f')
         .replace(/z/g, 'j').replace(/q/g, 'k').replace(/y/g, 'i')
         .replace(/([bcdgjkpt])h/g, '$1').replace(/sh/g, 's')
         .replace(/(.)\1+/g, '$1');
    if (s.length > 4 && s.endsWith('s')) s = s.slice(0, -1); // simple plurals
  }
  return s;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** How well does one normalised alias match the normalised query? (0 = no match) */
function scoreKey(key, query) {
  if (!key || !query) return 0;
  if (key === query) return 100;
  if (key.startsWith(query)) return 85 - Math.min(10, key.length - query.length);
  if (query.length >= 4 && key.length >= 4 && query.startsWith(key)) return 72;
  if (query.length >= 3 && key.includes(query)) return 62;
  if (query.length >= 4) {
    const d = levenshtein(key, query);
    if (d === 1) return 58;
    if (d === 2 && query.length >= 6) return 45;
    if (key.length > query.length && levenshtein(key.slice(0, query.length), query) === 1) return 50;
  }
  return 0;
}

/** Search all (non-removed) ingredients. Returns [{ ing, score }] best first. */
function searchIngredients(raw) {
  const query = normalizeText(raw);
  if (!query) return [];
  const results = [];
  state.ingredients.forEach(ing => {
    if (ing.deleted) return;
    let best = 0;
    ing.searchKeys.forEach(key => { best = Math.max(best, scoreKey(key, query)); });
    if (best > 0) results.push({ ing, score: best });
  });
  return results.sort((a, b) => b.score - a.score || a.ing.local.localeCompare(b.ing.local));
}

/** If someone types "methi, tameta bataka" we can offer to select all three at once. */
function resolveMultipleIngredients(raw) {
  const tokens = String(raw).split(/[,;+&\n]+|\s+and\s+|\s+/).map(t => t.trim()).filter(t => normalizeText(t).length >= 2);
  if (tokens.length < 2) return [];
  const found = [];
  tokens.forEach(token => {
    const best = searchIngredients(token)[0];
    if (best && best.score >= 72 && !found.includes(best.ing.id)) found.push(best.ing.id);
  });
  return found.length >= 2 ? found : [];
}


/* =====================================================================
   7. DIETARY RULES (Jain settings)
   ---------------------------------------------------------------------
   Every recommendation passes through these functions. A recipe is only
   suggested if none of its REQUIRED ingredients is blocked (after any
   allowed Jain swap). Blocked OPTIONAL ingredients are simply skipped.
   ===================================================================== */

function activeRules() {
  const s = state.settings;
  return {
    onionGarlic: s.strictJain || s.noOnionGarlic,
    roots: s.strictJain || s.noRoots,
    hardVeg: s.strictJain || s.noHardVeg,
    fried: !!s.noFried,
    swaps: !!s.allowSwaps
  };
}

/** Why an ingredient is not allowed right now — or null if it is fine. */
function ingredientBlockReason(id) {
  const rules = activeRules();
  if (state.settings.excluded.includes(id)) return 'Not used at home';
  const ing = getIngredient(id);
  if (!ing) return null;
  if (rules.onionGarlic && ing.onionGarlic) return 'No onion & garlic';
  if (rules.roots && ing.root) return 'No root vegetables';
  if (rules.hardVeg && ing.hardVeg) return 'Many-seeded vegetable';
  return null;
}

/**
 * Apply the household rules to one recipe.
 * Returns the effective required/optional lists plus anything swapped,
 * skipped or blocking.
 */
function resolveRecipe(recipe) {
  const rules = activeRules();
  const result = { required: [], optional: [], skipped: [], blocked: [], swaps: [], friedBlocked: false, allowed: true };

  const applyItem = (item, isRequired) => {
    const reason = ingredientBlockReason(item.id);
    if (!reason) {
      (isRequired ? result.required : result.optional).push({ ...item });
      return;
    }
    if (rules.swaps && item.sub && getIngredient(item.sub) && !getIngredient(item.sub).deleted && !ingredientBlockReason(item.sub)) {
      (isRequired ? result.required : result.optional).push({ ...item, id: item.sub, swappedFrom: item.id });
      result.swaps.push({ from: item.id, to: item.sub });
      return;
    }
    (isRequired ? result.blocked : result.skipped).push({ id: item.id, reason });
  };

  recipe.required.forEach(item => applyItem(item, true));
  recipe.optional.forEach(item => applyItem(item, false));
  if (rules.fried && recipe.fried) result.friedBlocked = true;

  // Remove duplicate ids that swaps might create
  const seen = new Set();
  result.required = result.required.filter(i => (seen.has(i.id) ? false : seen.add(i.id)));
  result.optional = result.optional.filter(i => (seen.has(i.id) ? false : seen.add(i.id)));

  result.allowed = result.blocked.length === 0 && !result.friedBlocked;
  return result;
}

/** Today's selection, minus anything the current rules don't allow. */
function allowedSelection() {
  return new Set([...state.ui.selected].filter(id => getIngredient(id) && !getIngredient(id).deleted && !ingredientBlockReason(id)));
}

/** Remove selected ingredients that became blocked or were deleted. */
function sanitizeSelection() {
  state.ui.selected = allowedSelection();
}


/* =====================================================================
   8. RECOMMENDATION ENGINE
   ---------------------------------------------------------------------
   Score = how much of the recipe you already have
         + bonus when every essential ingredient is at home
         + optional ingredients you have
         + quick & easy bonus
         + small favourites bonus
         − penalty for dishes made or suggested in the last few days
         + a tiny daily "shuffle" so evenings don't all look the same
   ===================================================================== */

function analyseRecipe(recipe, selected) {
  const res = resolveRecipe(recipe);
  const reqIds = res.required.map(i => i.id);
  const optIds = res.optional.map(i => i.id);
  const haveReq = reqIds.filter(id => selected.has(id));
  const missing = reqIds.filter(id => !selected.has(id));
  const haveOpt = optIds.filter(id => selected.has(id));
  return {
    ...res,
    haveReq,
    missing,
    haveOpt,
    total: reqIds.length + optIds.length,
    haveTotal: haveReq.length + haveOpt.length
  };
}

function passesFilters(recipe, analysis, filters, ignoreHave = false) {
  for (const f of filters) {
    if (f === 'q15' && recipe.time > 15) return false;
    if (f === 'q30' && recipe.time > 30) return false;
    if (f === 'easy' && recipe.difficulty !== 'Easy') return false;
    if (f === 'have' && !ignoreHave && analysis.missing.length > 0) return false;
    if (f === 'gujarati' && !recipe.gujarati) return false;
    if (f === 'filling' && !recipe.filling) return false;
    if (f === 'nofry' && recipe.fried) return false;
  }
  return true;
}

function notTodayIds() {
  if (state.notToday.day !== todayKey()) state.notToday = { day: todayKey(), ids: [] };
  return new Set(state.notToday.ids);
}

/** Negative score for dishes cooked or suggested recently (not counting today’s suggestions). */
function recencyPenalty(recipeId) {
  const now = Date.now();
  let penalty = 0;
  state.cookedLog.forEach(entry => {
    if (entry.id !== recipeId) return;
    const hours = (now - entry.t) / 3600000;
    if (hours < 24) penalty = Math.min(penalty, -50);
    else if (hours < 72) penalty = Math.min(penalty, -30);
  });
  const today = todayKey();
  state.suggestedLog.forEach(entry => {
    if (entry.id !== recipeId || entry.day === today) return;
    if ((now - entry.t) / 3600000 < 72) penalty = Math.min(penalty, penalty - 10);
  });
  return Math.max(penalty, -70);
}

function scoreRecipe(recipe, a) {
  const reqTotal = Math.max(1, a.required.length);
  let score = 100 * (a.haveReq.length / reqTotal);
  if (a.missing.length === 0) score += 40;
  score += a.haveReq.length * 6;          // dishes that use MORE of what you have rank higher
  score -= a.missing.length * 12;
  score += Math.min(a.haveOpt.length, 4) * 6;
  score += recipe.time <= 15 ? 10 : recipe.time <= 30 ? 6 : recipe.time <= 45 ? 2 : 0;
  if (recipe.difficulty === 'Easy') score += 6;
  score += recipe.category === 'snack' ? 3 : 2; // both suit the evening
  if (state.favourites.includes(recipe.id)) score += 4;
  score += recencyPenalty(recipe.id);
  score += (hashString(`${todayKey()}|${state.ui.refreshSeed}|${recipe.id}`) % 1000) / 1000 * 8;
  return score;
}

/**
 * Main entry point. Returns dishes you can make now ("ready") and dishes
 * that need only one or two more things ("almost").
 */
function getSuggestions(options = {}) {
  const selected = options.selected || allowedSelection();
  const filters = options.filters || state.ui.filters;
  const hidden = notTodayIds();
  const list = [];
  let blockedCount = 0;
  let hiddenCount = 0;

  state.recipes.forEach(recipe => {
    const a = analyseRecipe(recipe, selected);
    if (!a.allowed) { blockedCount++; return; }      // never suggest what the family doesn't eat
    if (hidden.has(recipe.id)) { hiddenCount++; return; }
    if (!passesFilters(recipe, a, filters)) return;
    const relevant = (a.haveReq.length >= 1 && a.missing.length <= 2) || (a.haveOpt.length >= 1 && a.missing.length <= 1);
    if (!relevant) return;
    list.push({ recipe, a, score: scoreRecipe(recipe, a) });
  });

  list.sort((x, y) => y.score - x.score);
  return {
    ready: list.filter(x => x.a.missing.length === 0),
    almost: list.filter(x => x.a.missing.length > 0),
    blockedCount,
    hiddenCount,
    selected
  };
}

/** When nothing matches: allowed dishes needing the fewest extra items. */
function fallbackIdeas(selected, limit = 4) {
  const hidden = notTodayIds();
  return state.recipes
    .map(recipe => ({ recipe, a: analyseRecipe(recipe, selected) }))
    .filter(x => x.a.allowed && !hidden.has(x.recipe.id))
    .sort((x, y) => (x.a.missing.length - y.a.missing.length) || (x.recipe.time - y.recipe.time) || (recencyPenalty(y.recipe.id) - recencyPenalty(x.recipe.id)))
    .slice(0, limit);
}

/** Remember the top suggestions so tomorrow's list feels fresh. */
function logSuggestions(entries) {
  const day = todayKey();
  entries.slice(0, 3).forEach(({ recipe }) => {
    if (!state.suggestedLog.some(e => e.id === recipe.id && e.day === day)) {
      state.suggestedLog.push({ id: recipe.id, day, t: Date.now() });
    }
  });
  state.suggestedLog = state.suggestedLog.slice(-120);
  save('suggestedLog');
}

/** Pick one suitable dish at random (weighted towards quick, not-recent dishes). */
function pickSurprise() {
  const selected = allowedSelection();
  let pool = [];
  if (selected.size) {
    const { ready, almost } = getSuggestions({ selected });
    pool = [...ready, ...almost].slice(0, 10).map(x => x.recipe);
  }
  if (!pool.length) {
    const hidden = notTodayIds();
    pool = state.recipes.filter(r => {
      const a = analyseRecipe(r, selected);
      return a.allowed && !hidden.has(r.id) && passesFilters(r, a, state.ui.filters, true);
    });
  }
  if (pool.length > 1 && state.ui.surpriseId) pool = pool.filter(r => r.id !== state.ui.surpriseId);
  if (!pool.length) return null;

  const weights = pool.map(r => {
    let w = 10;
    if (r.time <= 30) w += 5;
    if (r.difficulty === 'Easy') w += 3;
    if (state.favourites.includes(r.id)) w += 4;
    w += recencyPenalty(r.id) / 7; // recent dishes become less likely
    return Math.max(1, w);
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}


/* =====================================================================
   9. RENDERING
   ===================================================================== */

/* ---------- Illustrations for ingredients without a good emoji ---------- */
const SVG_ICONS = {
  sack: (color = '#f2c94c') => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 12h20l-3 7c9 5 14 14 14 24 0 10-9 15-21 15S11 53 11 43c0-10 5-19 14-24z" fill="${safeColor(color, '#f2c94c')}" stroke="rgba(0,0,0,.22)" stroke-width="2" stroke-linejoin="round"/><path d="M24 19c5 2 11 2 16 0" stroke="rgba(0,0,0,.28)" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M20 40c6 3 18 3 24 0" stroke="rgba(0,0,0,.08)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  okra: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 54C19 37 33 19 49 10c3 4 2 9-1 12C38 35 27 47 12 54z" fill="#5f9e3f" stroke="#3d7226" stroke-width="2" stroke-linejoin="round"/><path d="M16 50c10-9 20-21 29-35" stroke="#3d7226" stroke-width="1.5" fill="none"/><path d="M47 12l7-7" stroke="#7a9b3c" stroke-width="4" stroke-linecap="round"/></svg>`,
  gourd: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M29 8h6v6c0 4 5 6 5 12 0 4-2 6-2 9 0 6 10 9 10 18 0 7-8 9-16 9s-16-2-16-9c0-9 10-12 10-18 0-3-2-5-2-9 0-6 5-8 5-12z" fill="#a6cf6f" stroke="#6d993a" stroke-width="2" stroke-linejoin="round"/><path d="M32 4v6" stroke="#6b4f2a" stroke-width="3" stroke-linecap="round"/><ellipse cx="26" cy="46" rx="3" ry="7" fill="rgba(255,255,255,.35)"/></svg>`,
  cauliflower: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 34c4 16 14 24 24 24s20-8 24-24c-8 6-16 8-24 8S16 40 8 34z" fill="#6fae58" stroke="#4b8a3a" stroke-width="2"/><g fill="#fbf7ea" stroke="#d9cfae" stroke-width="1.5"><circle cx="22" cy="28" r="9"/><circle cx="42" cy="28" r="9"/><circle cx="32" cy="22" r="10"/><circle cx="32" cy="34" r="9"/><circle cx="20" cy="38" r="6"/><circle cx="44" cy="38" r="6"/></g></svg>`,
  cabbage: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="24" fill="#b7dc8f" stroke="#7fae55" stroke-width="2"/><path d="M32 12c-8 10-8 34 0 46M32 12c8 10 8 34 0 46M14 26c10 4 26 4 36 0" stroke="#86b85d" stroke-width="2" fill="none"/><circle cx="32" cy="34" r="10" fill="#d4ecb5"/></svg>`,
  leaf: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 58C14 46 6 32 10 18c6-10 16-10 22-2 6-8 16-8 22 2 4 14-4 28-22 40z" fill="#3f8a3a" stroke="#2c6a28" stroke-width="2" stroke-linejoin="round"/><path d="M32 16v40M32 30l-12-8M32 30l12-8M32 42l-10-6M32 42l10-6" stroke="#7fc06f" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  cubes: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#cfc4ad" stroke-width="2" stroke-linejoin="round"><path d="M8 30l14-6 14 6-14 6z" fill="#fffdf6"/><path d="M8 30v14l14 6V36z" fill="#efe8d8"/><path d="M36 30v14l-14 6V36z" fill="#e4dbc6"/><path d="M28 18l14-6 14 6-14 6z" fill="#fffdf6"/><path d="M28 18v14l14 6V24z" fill="#efe8d8"/><path d="M56 18v14l-14 6V24z" fill="#e4dbc6"/></g></svg>`,
  buns: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#b06f2c" stroke-width="2"><rect x="8" y="14" width="23" height="18" rx="8" fill="#e9a659"/><rect x="33" y="14" width="23" height="18" rx="8" fill="#e9a659"/><rect x="8" y="34" width="23" height="18" rx="8" fill="#e0984a"/><rect x="33" y="34" width="23" height="18" rx="8" fill="#e0984a"/></g><g fill="rgba(255,255,255,.35)"><ellipse cx="17" cy="20" rx="5" ry="2"/><ellipse cx="42" cy="20" rx="5" ry="2"/></g></svg>`,
  jar: (color = '#7a4a25') => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="20" y="8" width="24" height="8" rx="3" fill="#c98c4e" stroke="#8b5a2b" stroke-width="2"/><path d="M18 18h28c3 0 5 3 5 6v26c0 4-3 8-8 8H21c-5 0-8-4-8-8V24c0-3 2-6 5-6z" fill="${safeColor(color, '#7a4a25')}" stroke="#4a2b12" stroke-width="2"/><rect x="18" y="30" width="28" height="12" rx="3" fill="#f6e7cf"/></svg>`,
  discs: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#b9782e" stroke-width="2"><ellipse cx="24" cy="40" rx="16" ry="10" fill="#e8b46a"/><ellipse cx="40" cy="32" rx="16" ry="10" fill="#efc07a"/><ellipse cx="30" cy="22" rx="16" ry="10" fill="#f4cd8c"/></g><g fill="#b9782e"><circle cx="26" cy="21" r="1.3"/><circle cx="33" cy="24" r="1.3"/><circle cx="36" cy="19" r="1.3"/></g></svg>`
};

/** The round picture on an ingredient card: uploaded photo → illustration → emoji. */
function ingredientIconHTML(ing) {
  const photo = state.images.get('ing:' + ing.id);
  const fallback = ing.icon.startsWith('svg:') ? '🥗' : ing.icon;
  if (photo) {
    return `<img src="${escapeHTML(photo)}" alt="" loading="lazy" data-fallback="${escapeHTML(fallback)}">`;
  }
  if (ing.icon.startsWith('svg:')) {
    const [, shape, color] = ing.icon.split(':');
    if (SVG_ICONS[shape]) return SVG_ICONS[shape](color);
    return '🥗';
  }
  return `<span aria-hidden="true">${escapeHTML(ing.icon)}</span>`;
}

function recipeMediaHTML(recipe) {
  const photo = state.images.get('rec:' + recipe.id);
  const emoji = recipe.emoji || '🍽️';
  if (photo) {
    return `<img src="${escapeHTML(photo)}" alt="Photo of ${escapeHTML(recipe.name)}" loading="lazy" data-fallback="${escapeHTML(emoji)}" data-fallback-class="ph ph-${recipe.category}">`;
  }
  return `<div class="ph ph-${recipe.category}" aria-hidden="true"><span>${escapeHTML(emoji)}</span></div>`;
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}

/* ---------- Greeting & banners ---------- */
function renderGreeting() {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  $('#greeting').textContent = `Jai Jinendra 🙏 · ${part}`;
}

function renderBanners() {
  const parts = [];
  if (!Store.get('seenIntro', false)) {
    parts.push(`
      <div class="banner">
        <span class="banner-icon" aria-hidden="true">🪔</span>
        <div>
          <p><strong>Every Jain family is a little different.</strong> Onion &amp; garlic are hidden by default. Set your family’s food rules once in Settings and every suggestion will follow them.</p>
          <div class="btn-row">
            <button type="button" class="btn btn-primary btn-sm" data-action="open-settings">Set food rules</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="dismiss-intro">Got it</button>
          </div>
        </div>
      </div>`);
  }
  const saved = asArray(Store.get('savedSelection', [])).filter(id => getIngredient(id) && !getIngredient(id).deleted);
  if (saved.length && !state.ui.savedBannerDismissed) {
    parts.push(`
      <div class="banner green">
        <span class="banner-icon" aria-hidden="true">💾</span>
        <div>
          <p>You saved a list earlier: <strong>${saved.map(id => escapeHTML(ingShort(id))).join(', ')}</strong></p>
          <div class="btn-row">
            <button type="button" class="btn btn-primary btn-sm" data-action="use-saved">Use this list</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="discard-saved">Remove saved list</button>
          </div>
        </div>
      </div>`);
  }
  $('#banners').innerHTML = parts.join('');
}

/* ---------- Ingredient selection ---------- */
function renderCategoryTabs() {
  const tabs = [...INGREDIENT_CATEGORIES, { id: 'all', label: 'All' }];
  $('#catTabs').innerHTML = tabs.map(t => {
    const active = state.ui.category === t.id;
    return `<button type="button" class="chip ${active ? 'is-active' : ''}" role="tab" aria-selected="${active}" data-action="set-category" data-id="${t.id}">${escapeHTML(t.label)}</button>`;
  }).join('');
}

function ingredientCardHTML(ing) {
  const reason = ingredientBlockReason(ing.id);
  const selected = state.ui.selected.has(ing.id);
  const subParts = [ing.gu, ing.name.toLowerCase() !== ing.local.toLowerCase() ? ing.name : ''].filter(Boolean);
  const label = `${ing.local}${ing.name !== ing.local ? ', ' + ing.name : ''}${reason ? ' — ' + reason : ''}`;
  return `
    <button type="button" class="ing-card${selected ? ' is-selected' : ''}${reason ? ' is-blocked' : ''}"
            data-action="toggle-ing" data-id="${escapeHTML(ing.id)}" aria-pressed="${selected}" aria-label="${escapeHTML(label)}">
      <span class="ing-icon" style="background:${safeColor(ing.bg)}">${ingredientIconHTML(ing)}</span>
      <span class="ing-name">${escapeHTML(ing.local)}</span>
      ${subParts.length ? `<span class="ing-sub">${subParts.map(escapeHTML).join(' · ')}</span>` : ''}
      ${reason ? `<span class="ing-flag">🚫 ${escapeHTML(reason)}</span>` : ''}
      ${!ing.builtin ? '<span class="custom-dot">★ Added by you</span>' : ''}
      <span class="ing-check" aria-hidden="true">✓</span>
    </button>`;
}

function addIngredientCardHTML() {
  return `
    <button type="button" class="ing-card add-card" data-action="add-ingredient">
      <span class="ing-icon" aria-hidden="true">＋</span>
      <span class="ing-name">Add new</span>
      <span class="ing-sub">Something not listed?</span>
    </button>`;
}

function sortForGrid(list) {
  // Allowed ingredients first; blocked ones at the end of each group
  return list.slice().sort((a, b) => (ingredientBlockReason(a.id) ? 1 : 0) - (ingredientBlockReason(b.id) ? 1 : 0));
}

function renderGrid() {
  const visible = state.ingredients.filter(i => !i.deleted);
  const cat = state.ui.category;
  let html = '';
  if (cat === 'all') {
    INGREDIENT_CATEGORIES.forEach(c => {
      const items = sortForGrid(visible.filter(i => i.category === c.id));
      if (!items.length) return;
      html += `<h3 class="ing-group-title">${escapeHTML(c.label)} <span lang="gu" class="muted small">${escapeHTML(c.gu)}</span></h3>
               <div class="ing-grid">${items.map(ingredientCardHTML).join('')}</div>`;
    });
    html += `<div class="ing-grid" style="margin-top:10px">${addIngredientCardHTML()}</div>`;
  } else {
    const items = sortForGrid(visible.filter(i => i.category === cat));
    html = `<div class="ing-grid">${items.map(ingredientCardHTML).join('')}${addIngredientCardHTML()}</div>`;
  }
  $('#ingredientGrid').innerHTML = html;
}

function renderTray() {
  const ids = [...state.ui.selected];
  const tray = $('#selectedTray');
  if (!ids.length) {
    tray.innerHTML = `<p class="tray-empty">👇 Tap the vegetables and ingredients you have today — pick as many as you like.</p>`;
  } else {
    tray.innerHTML = `
      <div class="tray-head"><strong>At home today (${ids.length})</strong></div>
      <div class="tray-chips">
        ${ids.map(id => `<span class="tray-chip">${escapeHTML(ingShort(id))}<button type="button" data-action="remove-selected" data-id="${escapeHTML(id)}" aria-label="Remove ${escapeHTML(ingShort(id))}">✕</button></span>`).join('')}
      </div>
      <div class="tray-actions">
        <button type="button" class="btn-link" data-action="clear-selection">🧹 Clear Today's Selection</button>
        <button type="button" class="btn-link" data-action="save-selection">💾 Save this list for later</button>
      </div>`;
  }
  const count = $('#ctaCount');
  count.hidden = ids.length === 0;
  count.textContent = ids.length;
}

function renderSearchResults() {
  const input = $('#ingSearch');
  const box = $('#searchResults');
  const raw = input.value;
  if (!raw.trim()) { box.hidden = true; box.innerHTML = ''; return; }

  const results = searchIngredients(raw).slice(0, 6);
  let html = '';

  // Typed several names at once? Offer to pick them all.
  if (!results.length || results[0].score < 75) {
    const many = resolveMultipleIngredients(raw);
    if (many.length) {
      html += `<button type="button" class="sr-item sr-multi" data-action="select-many" data-ids="${escapeHTML(many.join(','))}">
        <span class="ing-icon" style="background:#fff">✅</span>
        <span class="sr-text"><strong>Select all ${many.length}</strong><small>${many.map(id => escapeHTML(ingShort(id))).join(', ')}</small></span>
      </button>`;
    }
  }

  results.forEach(({ ing }) => {
    const reason = ingredientBlockReason(ing.id);
    const selected = state.ui.selected.has(ing.id);
    const sub = [ing.gu, ing.name !== ing.local ? ing.name : ''].filter(Boolean).map(escapeHTML).join(' · ');
    html += `<button type="button" class="sr-item" data-action="toggle-ing" data-id="${escapeHTML(ing.id)}" data-from-search="1">
      <span class="ing-icon" style="background:${safeColor(ing.bg)}">${ingredientIconHTML(ing)}</span>
      <span class="sr-text"><strong>${escapeHTML(ing.local)}</strong><small>${sub}</small></span>
      <span class="sr-state ${reason ? 'blocked' : ''}">${reason ? '🚫 ' + escapeHTML(reason) : selected ? '✓ Added' : '+ Add'}</span>
    </button>`;
  });

  const cleaned = raw.trim().slice(0, 40);
  if (!results.length && !html) {
    html += `<div class="sr-empty">
      <p>We don’t know “<strong>${escapeHTML(cleaned)}</strong>” yet — no problem!</p>
      <button type="button" class="btn btn-primary btn-sm" data-action="add-ingredient" data-name="${escapeHTML(cleaned)}">+ Add “${escapeHTML(cleaned)}” as a new ingredient</button>
    </div>`;
  } else {
    html += `<div class="sr-empty"><button type="button" class="btn-link" data-action="add-ingredient" data-name="${escapeHTML(cleaned)}">Not here? Add “${escapeHTML(cleaned)}” as a new ingredient</button></div>`;
  }
  box.innerHTML = html;
  box.hidden = false;
}

function renderFilters() {
  $('#filterChips').innerHTML = FILTERS.map(f => {
    const on = state.ui.filters.has(f.id);
    return `<button type="button" class="chip" aria-pressed="${on}" data-action="toggle-filter" data-id="${f.id}">${escapeHTML(f.label)}</button>`;
  }).join('') + (state.ui.filters.size ? `<button type="button" class="btn-link" data-action="clear-filters">Clear filters</button>` : '');
  $('#filterCount').textContent = state.ui.filters.size ? String(state.ui.filters.size) : '';
}

/* ---------- Recipe cards ---------- */
function recipeCardHTML(recipe, opts = {}) {
  const mode = opts.mode || 'browse';
  const selected = opts.selected || allowedSelection();
  const a = opts.analysis || analyseRecipe(recipe, selected);
  const fav = state.favourites.includes(recipe.id);

  const badges = [];
  if (mode === 'suggest' || mode === 'surprise') {
    if (a.missing.length === 0 && a.haveTotal > 0) badges.push(a.haveTotal >= 2 ? ['Great Match', 'good'] : ['Ready to cook', 'good']);
    else if (a.missing.length > 0) badges.push([`Need ${a.missing.length} more`, 'warn']);
  }
  if (recipe.time <= 20 && recipe.difficulty === 'Easy') badges.push(['Quick & Easy', 'quick']);

  let status = '';
  if (!a.allowed) {
    const why = a.friedBlocked ? 'deep-fried' : 'contains ' + a.blocked.map(b => ingShort(b.id)).join(', ');
    status = `<p class="rc-status bad">⚠️ Not for your home right now — ${escapeHTML(why)}</p>`;
  } else if (a.swaps.length) {
    status = `<p class="rc-status swap">🔁 Jain swap: ${a.swaps.map(s => `${escapeHTML(ingShort(s.to))} instead of ${escapeHTML(ingShort(s.from))}`).join('; ')}</p>`;
  } else if (mode === 'browse') {
    status = `<p class="rc-status ok">✓ Fits your food rules</p>`;
  }

  let match = '';
  if (a.allowed && (mode !== 'browse' || selected.size) && a.total > 0) {
    const pct = Math.round((a.haveTotal / a.total) * 100);
    match = `<div class="match">
      <div class="match-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <p>${a.haveTotal} of ${a.total} ingredients available</p>
    </div>`;
    if (a.missing.length) match += `<p class="rc-missing">Still need: ${a.missing.map(id => escapeHTML(ingShort(id))).join(', ')}</p>`;
  }

  const notToday = mode === 'suggest'
    ? `<button type="button" class="btn btn-ghost btn-sm" data-action="not-today" data-id="${escapeHTML(recipe.id)}" aria-label="Not today: ${escapeHTML(recipe.name)}">Not today</button>`
    : '';

  return `
    <article class="recipe-card">
      <div class="rc-media">
        ${recipeMediaHTML(recipe)}
        <button type="button" class="rc-fav" data-action="fav" data-id="${escapeHTML(recipe.id)}" aria-pressed="${fav}"
                aria-label="${fav ? 'Remove from' : 'Add to'} favourites: ${escapeHTML(recipe.name)}">${fav ? '❤️' : '🤍'}</button>
        <div class="rc-badges">${badges.map(([t, c]) => `<span class="badge badge-${c}">${escapeHTML(t)}</span>`).join('')}</div>
      </div>
      <div class="rc-body">
        <h3 class="rc-title">${escapeHTML(recipe.name)}</h3>
        ${recipe.gu ? `<p class="rc-gu" lang="gu">${escapeHTML(recipe.gu)}</p>` : ''}
        <div class="rc-meta">
          <span>⏱️ ${recipe.time} min</span><span>👩‍🍳 ${recipe.difficulty}</span>
          <span>${recipe.category === 'meal' ? '🍽️ Light meal' : '☕ Evening snack'}</span>
          ${recipe.gujarati ? '<span>🪔 Gujarati</span>' : ''}
        </div>
        ${recipe.description ? `<p class="rc-desc">${escapeHTML(recipe.description)}</p>` : ''}
        ${match}
        ${status}
        <div class="rc-actions">
          <button type="button" class="btn btn-primary btn-sm" data-action="open-recipe" data-id="${escapeHTML(recipe.id)}">View Recipe</button>
          ${notToday}
        </div>
      </div>
    </article>`;
}

/* ---------- Results on Home ---------- */
const RESULTS_LIMIT = 6;

function renderResults() {
  const box = $('#results');
  let html = '';

  // Surprise pick (works even with nothing selected)
  if (state.ui.surpriseId) {
    const recipe = state.recipeMap.get(state.ui.surpriseId);
    const a = recipe ? analyseRecipe(recipe, allowedSelection()) : null;
    if (recipe && a.allowed) {
      html += `<section class="surprise-box" aria-label="Surprise pick">
        <div class="surprise-head">
          <h2>🎲 Surprise pick</h2>
          <div>
            <button type="button" class="btn btn-saffron btn-sm" data-action="surprise">Another one</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="close-surprise" aria-label="Close surprise">✕</button>
          </div>
        </div>
        <div class="card-grid" style="grid-template-columns:1fr">${recipeCardHTML(recipe, { mode: 'surprise', analysis: a })}</div>
      </section>`;
    } else {
      state.ui.surpriseId = null;
    }
  }

  if (state.ui.hasSuggested) html += suggestionsHTML();
  box.innerHTML = html;
}

function suggestionsHTML() {
  const selected = allowedSelection();
  if (!selected.size) {
    return `<div class="empty-state">
      <div class="big" aria-hidden="true">🧺</div>
      <h3>First, tell us what’s in the kitchen</h3>
      <p>Tap a few vegetables or flours above (or type them in the search box), then press <strong>Suggest What to Cook</strong>. Not sure? Try a surprise!</p>
      <div class="btn-row"><button type="button" class="btn btn-saffron" data-action="surprise">🎲 Surprise Me</button></div>
    </div>`;
  }

  const { ready, almost, blockedCount, hiddenCount } = getSuggestions({ selected });
  const total = ready.length + almost.length;
  const names = [...selected].map(ingShort);
  let html = `<div class="results-head">
      <h2>Here’s what you can make</h2>
      <button type="button" class="btn btn-ghost btn-sm" data-action="refresh">🔄 Show different ideas</button>
    </div>
    <p class="results-sub">Using ${escapeHTML(names.slice(0, 6).join(', '))}${names.length > 6 ? ` +${names.length - 6} more` : ''}. Salt, oil and everyday spices are assumed.</p>`;

  if (!total) {
    // Did the filters remove everything?
    if (state.ui.filters.size) {
      const unfiltered = getSuggestions({ selected, filters: new Set() });
      if (unfiltered.ready.length + unfiltered.almost.length) {
        return html + `<div class="empty-state">
          <div class="big" aria-hidden="true">🔍</div>
          <h3>No dishes match these filters</h3>
          <p>There are ${unfiltered.ready.length + unfiltered.almost.length} ideas without filters.</p>
          <div class="btn-row"><button type="button" class="btn btn-primary" data-action="clear-filters">Clear filters</button></div>
        </div>`;
      }
    }
    const ideas = fallbackIdeas(selected);
    html += `<div class="empty-state">
        <div class="big" aria-hidden="true">🤔</div>
        <h3>Nothing uses just these yet</h3>
        <p>Most Gujarati snacks need a base like <strong>besan</strong>, <strong>wheat flour</strong>, <strong>rava</strong> or <strong>bread</strong>. Add one of those if you have it — or try one of these easy ideas that need only a few extras:</p>
      </div>`;
    if (ideas.length) html += `<div class="card-grid">${ideas.map(x => recipeCardHTML(x.recipe, { mode: 'suggest', analysis: x.a, selected })).join('')}</div>`;
    return html + blockedNoteHTML(blockedCount, hiddenCount);
  }

  const limit = state.ui.showAll ? Infinity : RESULTS_LIMIT;
  const readyShown = ready.slice(0, limit);
  const almostShown = almost.slice(0, Math.max(0, limit - readyShown.length));

  if (readyShown.length) {
    html += `<h3 class="group-title">✅ Ready to cook with what you have</h3>
      <div class="card-grid">${readyShown.map(x => recipeCardHTML(x.recipe, { mode: 'suggest', analysis: x.a, selected })).join('')}</div>`;
  } else {
    html += `<p class="notice notice-info">You don’t have everything for any dish yet — these need just one or two more things.</p>`;
  }
  if (almostShown.length) {
    html += `<h3 class="group-title warn">🛒 Need just 1–2 more things</h3>
      <div class="card-grid">${almostShown.map(x => recipeCardHTML(x.recipe, { mode: 'suggest', analysis: x.a, selected })).join('')}</div>`;
  }
  const remaining = total - readyShown.length - almostShown.length;
  if (remaining > 0) {
    html += `<div class="show-more"><button type="button" class="btn btn-ghost" data-action="show-more">Show ${remaining} more idea${remaining > 1 ? 's' : ''}</button></div>`;
  }
  if (total < 3) {
    html += `<p class="notice notice-info">Only a few dishes match. Adding a staple like besan, wheat flour, rava, bread or curd will open up many more ideas.</p>`;
  }
  return html + blockedNoteHTML(blockedCount, hiddenCount);
}

function blockedNoteHTML(blockedCount, hiddenCount) {
  const parts = [];
  if (hiddenCount) parts.push(`${hiddenCount} dish${hiddenCount > 1 ? 'es' : ''} hidden for today. <button type="button" class="btn-link" data-action="undo-not-today">Show them again</button>`);
  if (blockedCount) parts.push(`${blockedCount} dish${blockedCount > 1 ? 'es are' : ' is'} never suggested because of your food rules. <button type="button" class="btn-link" data-action="open-settings">Food rules</button>`);
  return parts.length ? `<p class="results-sub" style="margin-top:16px">${parts.join('<br>')}</p>` : '';
}

/* ---------- Favourites ---------- */
function renderFavourites() {
  const favs = state.favourites.map(id => state.recipeMap.get(id)).filter(Boolean);
  const selected = allowedSelection();
  $('#favList').innerHTML = favs.length
    ? `<div class="card-grid">${favs.map(r => recipeCardHTML(r, { mode: 'browse', selected })).join('')}</div>`
    : `<div class="empty-state"><div class="big" aria-hidden="true">🤍</div><h3>No favourites yet</h3><p>Tap the heart on any dish to keep it here.</p></div>`;

  const seen = new Set();
  const recent = state.cookedLog.slice().reverse().filter(e => {
    if (seen.has(e.id) || !state.recipeMap.has(e.id)) return false;
    seen.add(e.id);
    return true;
  }).slice(0, 10);
  $('#recentList').innerHTML = recent.length
    ? recent.map(e => {
        const r = state.recipeMap.get(e.id);
        return `<div class="recent-row">
          <span class="recent-emoji" aria-hidden="true">${escapeHTML(r.emoji)}</span>
          <div class="txt"><strong>${escapeHTML(r.name)}</strong><small>${relativeDay(e.t)}</small></div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="open-recipe" data-id="${escapeHTML(r.id)}">View</button>
        </div>`;
      }).join('')
    : `<p class="muted" style="margin:0 4px">When you cook something, tap “We made this today” on the recipe. Those dishes will be suggested less for the next few days.</p>`;
}

/* ---------- All recipes ---------- */
function recipeMatchesQuery(recipe, query) {
  const q = normalizeText(query);
  if (!q) return true;
  const keys = [recipe.name, recipe.gu, ...recipe.aka].map(normalizeText);
  if (keys.some(k => k.includes(q))) return true;
  const ingIds = new Set(searchIngredients(query).filter(r => r.score >= 72).map(r => r.ing.id));
  if (!ingIds.size) return false;
  return [...recipe.required, ...recipe.optional].some(i => ingIds.has(i.id) || (i.sub && ingIds.has(i.sub)));
}

function renderRecipeCats() {
  const cats = [
    { id: 'all', label: 'All' },
    { id: 'fits', label: '✓ Fits my rules' },
    { id: 'snack', label: '☕ Snacks' },
    { id: 'meal', label: '🍽️ Light meals' },
    { id: 'gujarati', label: '🪔 Gujarati' },
    { id: 'mine', label: '★ Added by me' }
  ];
  $('#recipeCats').innerHTML = cats.map(c => {
    const on = state.ui.recipeCat === c.id;
    return `<button type="button" class="chip ${on ? 'is-active' : ''}" aria-pressed="${on}" data-action="set-recipe-cat" data-id="${c.id}">${escapeHTML(c.label)}</button>`;
  }).join('');
}

function renderRecipeList() {
  const selected = allowedSelection();
  const cat = state.ui.recipeCat;
  const list = state.recipes.filter(r => {
    if (!recipeMatchesQuery(r, state.ui.recipeQuery)) return false;
    if (cat === 'snack' || cat === 'meal') return r.category === cat;
    if (cat === 'gujarati') return r.gujarati;
    if (cat === 'mine') return !r.builtin;
    if (cat === 'fits') return resolveRecipe(r).allowed;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  $('#recipeCount').textContent = `${list.length} dish${list.length === 1 ? '' : 'es'}`;
  $('#recipeList').innerHTML = list.length
    ? list.map(r => recipeCardHTML(r, { mode: 'browse', selected })).join('')
    : `<div class="empty-state" style="grid-column:1/-1"><div class="big" aria-hidden="true">📭</div><h3>No dishes found</h3><p>Try another name, or add your own recipe.</p>
         <div class="btn-row"><button type="button" class="btn btn-primary" data-action="new-recipe">+ Add recipe</button></div></div>`;
}

/* ---------- Settings ---------- */
function switchRowHTML(key, title, help, checked, locked = false) {
  return `<label class="switch-row${locked ? ' is-locked' : ''}">
    <span class="txt"><strong>${title}</strong><small>${help}${locked ? ' <em>(on because Strict Jain mode is on)</em>' : ''}</small></span>
    <input type="checkbox" class="switch" role="switch" data-setting="${key}" ${checked ? 'checked' : ''} ${locked ? 'disabled' : ''}>
  </label>`;
}

function renderSettings() {
  const s = state.settings;
  const strict = s.strictJain;
  const visible = state.ingredients.filter(i => !i.deleted);

  const excludedChips = INGREDIENT_CATEGORIES.map(c => {
    const items = visible.filter(i => i.category === c.id);
    if (!items.length) return '';
    return `<p class="manage-cat">${escapeHTML(c.label)}</p><div class="chip-wrap" style="padding-top:4px">${items.map(i => {
      const on = s.excluded.includes(i.id);
      return `<button type="button" class="chip chip-x" aria-pressed="${on}" data-action="toggle-excluded" data-id="${escapeHTML(i.id)}">${on ? '🚫 ' : ''}${escapeHTML(i.local)}</button>`;
    }).join('')}</div>`;
  }).join('');

  const manageRows = INGREDIENT_CATEGORIES.map(c => {
    const items = visible.filter(i => i.category === c.id);
    if (!items.length) return '';
    return `<p class="manage-cat">${escapeHTML(c.label)}</p><ul class="manage-list">${items.map(i => `
      <li class="manage-row">
        <span class="ing-icon" style="background:${safeColor(i.bg)}">${ingredientIconHTML(i)}</span>
        <span class="txt"><strong>${escapeHTML(i.local)}</strong>${!i.builtin ? ' <span class="custom-dot">★ yours</span>' : ''}
          <small>${escapeHTML([i.gu, i.name, ...i.aliases.slice(0, 4)].filter(Boolean).join(' · '))}</small></span>
        <button type="button" class="btn btn-ghost btn-sm" data-action="edit-ingredient" data-id="${escapeHTML(i.id)}">Edit</button>
      </li>`).join('')}</ul>`;
  }).join('');

  const removedIng = state.deletedIngredients.length;
  const removedRec = state.deletedRecipes.length;

  $('#settingsBody').innerHTML = `
    <section class="settings-section" aria-labelledby="rulesTitle">
      <h3 id="rulesTitle">🪔 Our family’s food rules</h3>
      <p class="muted">Every Jain home follows its own customs. These rules are applied to every suggestion — a dish that breaks them is never suggested.</p>
      ${switchRowHTML('strictJain', 'Strict Jain mode', 'Turns on all the Jain restrictions below: no onion, garlic or root vegetables (kandmool), and avoids many-seeded vegetables.', strict)}
      ${switchRowHTML('noOnionGarlic', 'No onion &amp; garlic', 'Dungri and lasan are never suggested.', strict || s.noOnionGarlic, strict)}
      ${switchRowHTML('noRoots', 'No root vegetables', 'Potato, carrot, ginger, onion, garlic and other roots.', strict || s.noRoots, strict)}
      ${switchRowHTML('noHardVeg', 'Avoid many-seeded vegetables', 'Brinjal, cauliflower and cabbage — some families avoid these.', strict || s.noHardVeg, strict)}
      ${switchRowHTML('allowSwaps', 'Suggest Jain swaps', 'When potato isn’t allowed, still show dishes like vada pav or tikki made with raw banana (kacha kela) instead.', s.allowSwaps)}
      ${switchRowHTML('noFried', 'No deep-fried dishes', 'Hide bhajiya, samosa, vada and other deep-fried snacks.', s.noFried)}
    </section>

    <section class="settings-section" aria-labelledby="exclTitle">
      <h3 id="exclTitle">🚫 Ingredients we don’t use</h3>
      <p class="muted">Tap anything your family never uses. Dishes that need it won’t be suggested.</p>
      <details ${s.excluded.length ? 'open' : ''}>
        <summary>Choose ingredients (${s.excluded.length} selected)</summary>
        ${excludedChips}
      </details>
    </section>

    <section class="settings-section" aria-labelledby="notesTitle">
      <h3 id="notesTitle">📝 Our household notes</h3>
      <p class="muted">Anything else to remember while cooking (for example “no curd after sunset” or “use sunth instead of fresh ginger”). Shown at the bottom of every recipe.</p>
      <label class="field"><span class="visually-hidden">Household notes</span>
        <textarea id="notesInput" maxlength="500" rows="3" placeholder="Write your family’s own food notes here…">${escapeHTML(s.notes)}</textarea>
      </label>
    </section>

    <section class="settings-section" aria-labelledby="manageTitle">
      <h3 id="manageTitle">🧺 Manage Ingredients &amp; Recipes</h3>
      <p class="muted">Add your own ingredients and photos, fix names, or add other spellings so search finds them.</p>
      <div class="btn-row" style="margin-top:4px">
        <button type="button" class="btn btn-primary" data-action="add-ingredient">+ Add ingredient</button>
        <button type="button" class="btn btn-ghost" data-action="new-recipe">+ Add recipe</button>
        <button type="button" class="btn btn-ghost" data-action="nav" data-id="recipes">Edit recipes →</button>
      </div>
      <details>
        <summary>All ingredients (${visible.length})</summary>
        ${manageRows}
      </details>
      ${removedIng ? `<p style="margin-top:10px">${removedIng} built-in ingredient${removedIng > 1 ? 's' : ''} removed. <button type="button" class="btn-link" data-action="restore-ingredients">Bring them back</button></p>` : ''}
      ${removedRec ? `<p style="margin-top:6px">${removedRec} built-in recipe${removedRec > 1 ? 's' : ''} removed. <button type="button" class="btn-link" data-action="restore-recipes">Bring them back</button></p>` : ''}
    </section>

    <section class="settings-section" aria-labelledby="dataTitle">
      <h3 id="dataTitle">💾 Your data</h3>
      <p class="muted">Everything — food rules, favourites, your ingredients, recipes and photos — is saved <strong>only in this browser on this device</strong>. It does not sync to another phone or computer, and clearing the browser’s data will remove it. Today’s ingredient selection is not saved unless you tap “Save this list for later”.</p>
      <p class="small muted" style="margin-top:6px">Photos are stored in ${ImageStore.available ? 'the browser’s photo storage (IndexedDB)' : 'basic browser storage — only a few photos will fit'}.</p>
      <div class="btn-row">
        <button type="button" class="btn btn-danger-ghost" data-action="reset-app">Reset App Data…</button>
      </div>
    </section>

    <p class="muted small" style="text-align:center;margin:20px 0">Aaje Shu Banavishu? · ${state.recipes.length} recipes · ${visible.length} ingredients</p>`;
}

function renderHome() {
  renderGreeting();
  renderBanners();
  renderCategoryTabs();
  renderGrid();
  renderTray();
  renderFilters();
  renderResults();
  if ($('#ingSearch').value) renderSearchResults();
}

function renderAll() {
  renderHome();
  renderFavourites();
  renderRecipeCats();
  renderRecipeList();
  renderSettings();
}

/** Re-render only what depends on recipes/ingredients (keeps scroll & focus). */
function refreshAfterDataChange() {
  rebuildData();
  sanitizeSelection();
  renderAll();
  if (state.ui.detail && state.recipeMap.has(state.ui.detail.id) && $('#sheet').open && $('#sheet').dataset.mode === 'detail') {
    renderDetail();
  }
}

function showView(name) {
  const views = ['home', 'favourites', 'recipes', 'settings'];
  if (!views.includes(name)) name = 'home';
  state.ui.view = name;
  views.forEach(v => { $('#view-' + v).hidden = v !== name; });
  $$('.bottom-nav button').forEach(b => {
    if (b.dataset.nav === name) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  $('#ctaBar').hidden = name !== 'home';
  $('.app').classList.toggle('no-cta', name !== 'home');
  if (name === 'favourites') renderFavourites();
  if (name === 'recipes') renderRecipeList();
  if (name === 'settings') renderSettings();
  window.scrollTo(0, 0);
}


/* =====================================================================
   10. RECIPE DETAIL, EDITORS AND DIALOGS
   ===================================================================== */

function openDialog(dialog) {
  if (dialog.open) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}
function closeDialog(dialog) {
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.removeAttribute('open');
}

function closeSheet() {
  const sheet = $('#sheet');
  closeDialog(sheet);
  sheet.innerHTML = '';
  sheet.dataset.mode = '';
  state.ui.detail = null;
  state.ui.pendingImage = undefined;
}

/** Simple yes/no confirmation that returns a Promise<boolean>. */
function confirmAction({ title, message, confirmLabel = 'Yes', danger = false }) {
  return new Promise(resolve => {
    const d = $('#confirmDialog');
    d.innerHTML = `<div class="confirm-box">
      <h2 id="confirmTitle">${escapeHTML(title)}</h2>
      <p>${escapeHTML(message)}</p>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost" data-confirm="no">Cancel</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm="yes">${escapeHTML(confirmLabel)}</button>
      </div>
    </div>`;
    const finish = value => {
      d.removeEventListener('click', onClick);
      d.removeEventListener('cancel', onCancel);
      closeDialog(d);
      resolve(value);
    };
    const onClick = e => {
      const btn = e.target.closest('[data-confirm]');
      if (btn) finish(btn.dataset.confirm === 'yes');
      else if (e.target === d) finish(false);
    };
    const onCancel = e => { e.preventDefault(); finish(false); };
    d.addEventListener('click', onClick);
    d.addEventListener('cancel', onCancel);
    openDialog(d);
    const cancelBtn = d.querySelector('[data-confirm="no"]');
    if (cancelBtn) cancelBtn.focus();
  });
}

/* ---------- Recipe detail ---------- */
function openRecipe(id) {
  const recipe = state.recipeMap.get(id);
  if (!recipe) { showToast('That recipe is no longer available.'); return; }
  state.ui.detail = { id, servings: recipe.servings };
  const sheet = $('#sheet');
  sheet.dataset.mode = 'detail';
  renderDetail();
  openDialog(sheet);
  sheet.scrollTop = 0;
  const closeBtn = sheet.querySelector('[data-action="close-sheet"]');
  if (closeBtn) closeBtn.focus();
}

function ingredientLineHTML(item, factor, selected, mark) {
  const qty = item.qty !== null ? formatQty(item.qty * factor) : '';
  const amount = [qty, item.unit].filter(Boolean).join(' ');
  const ing = getIngredient(item.id);
  const english = ing && ing.name.toLowerCase() !== (ing.local || '').toLowerCase() ? ing.name : '';
  return `<li>
    <span class="mark" aria-hidden="true">${mark}</span>
    <span>${amount ? `<span class="qty">${escapeHTML(amount)}</span> ` : ''}<strong>${escapeHTML(ingShort(item.id))}</strong>
      ${english ? `<small>${escapeHTML(english)}</small>` : ''}
      ${item.swappedFrom ? ` <em class="swap-tag">instead of ${escapeHTML(ingShort(item.swappedFrom))}</em>` : ''}
      ${selected.has(item.id) && mark !== '✅' ? ' <small>(you have it)</small>' : ''}
    </span>
  </li>`;
}

function renderDetail() {
  const d = state.ui.detail;
  const recipe = d && state.recipeMap.get(d.id);
  const sheet = $('#sheet');
  if (!recipe) { closeSheet(); return; }

  const selected = allowedSelection();
  const a = analyseRecipe(recipe, selected);
  const factor = d.servings / recipe.servings;
  const fav = state.favourites.includes(recipe.id);

  const have = a.required.filter(i => selected.has(i.id));
  const need = a.required.filter(i => !selected.has(i.id));
  const extras = a.optional;

  let warnings = '';
  if (!a.allowed) {
    const items = a.blocked.map(b => `${ingFull(b.id)} (${b.reason.toLowerCase()})`);
    if (a.friedBlocked) items.push('it is deep-fried');
    warnings += `<div class="notice notice-warn"><strong>⚠️ Not suitable with your current food rules.</strong><br>This dish needs: ${escapeHTML(items.join(', '))}. It will not be suggested. You can edit the recipe or change your rules in Settings.</div>`;
  }
  if (a.swaps.length) {
    warnings += `<div class="notice notice-swap"><strong>🔁 Jain swap used.</strong> ${a.swaps.map(s => `Wherever the steps say ${escapeHTML(ingFull(s.from))}, use ${escapeHTML(ingFull(s.to))}.`).join(' ')}</div>`;
  }
  if (a.skipped.length) {
    warnings += `<div class="notice notice-info">Skip ${escapeHTML(a.skipped.map(s => ingFull(s.id)).join(', '))} — not used by your family. The dish works fine without ${a.skipped.length > 1 ? 'them' : 'it'}.</div>`;
  }

  const ingSection = (title, cls, items, mark, emptyText) => `
    <section class="detail-section ${cls}">
      <h3>${title}</h3>
      ${items.length ? `<ul class="ing-list">${items.map(i => ingredientLineHTML(i, factor, selected, mark)).join('')}</ul>` : `<p class="muted">${emptyText}</p>`}
    </section>`;

  sheet.innerHTML = `
    <div class="sheet-inner">
      <div class="sheet-top">
        <button type="button" class="icon-btn" data-action="close-sheet" aria-label="Close recipe">✕</button>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-ghost btn-sm" data-action="fav" data-id="${escapeHTML(recipe.id)}" aria-pressed="${fav}">${fav ? '❤️ Favourite' : '🤍 Add to favourites'}</button>
        </div>
      </div>
      <div class="detail-media">${recipeMediaHTML(recipe)}</div>
      <div class="sheet-body">
        <h2 id="sheetTitle" class="detail-title">${escapeHTML(recipe.name)}</h2>
        ${recipe.gu ? `<p class="detail-gu" lang="gu">${escapeHTML(recipe.gu)}</p>` : ''}
        <div class="detail-meta">
          <span class="pill">⏱️ ${recipe.time} min</span>
          <span class="pill">👩‍🍳 ${recipe.difficulty}</span>
          <span class="pill">${recipe.category === 'meal' ? '🍽️ Light meal' : '☕ Evening snack'}</span>
          ${recipe.gujarati ? '<span class="pill">🪔 Gujarati favourite</span>' : ''}
          ${recipe.fried ? '<span class="pill">🍳 Deep-fried</span>' : '<span class="pill">✨ No deep-frying</span>'}
        </div>
        ${recipe.description ? `<p>${escapeHTML(recipe.description)}</p>` : ''}
        ${warnings}

        <div class="stepper" role="group" aria-label="Servings">
          <span class="label">🍽️ Servings</span>
          <button type="button" data-action="servings" data-delta="-1" aria-label="Fewer servings" ${d.servings <= 1 ? 'disabled' : ''}>−</button>
          <output aria-live="polite">${d.servings}</output>
          <button type="button" data-action="servings" data-delta="1" aria-label="More servings" ${d.servings >= 20 ? 'disabled' : ''}>+</button>
        </div>

        ${ingSection('✅ Already at home', 'have', have, '✅', selected.size ? 'None of the main ingredients are selected yet.' : 'Select ingredients on the Home screen to see what you already have.')}
        ${ingSection('🛒 Still needed', 'need', need, '🛒', 'Nothing! You have all the main ingredients. 🎉')}
        ${extras.length ? `<section class="detail-section">
          <h3>➕ Optional extras</h3>
          <ul class="ing-list">${extras.map(i => ingredientLineHTML(i, factor, selected, selected.has(i.id) ? '✅' : '•')).join('')}</ul>
        </section>` : ''}
        ${recipe.pantry ? `<p class="pantry-line">🧂 <strong>Pantry basics:</strong> ${escapeHTML(recipe.pantry)}</p>` : ''}

        <section class="detail-section">
          <h3>👩‍🍳 How to make it</h3>
          ${recipe.steps.length ? `<ol class="steps">${recipe.steps.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ol>` : '<p class="muted">No steps added yet. Tap “Edit recipe” to add them.</p>'}
          ${factor !== 1 ? '<p class="small muted" style="margin-top:8px">Quantities above are adjusted for your servings; cooking times stay about the same.</p>' : ''}
        </section>

        ${state.settings.notes ? `<div class="notice notice-info">📝 <strong>Our notes:</strong> ${escapeHTML(state.settings.notes)}</div>` : ''}

        <div class="btn-row">
          <button type="button" class="btn btn-primary" data-action="made-today" data-id="${escapeHTML(recipe.id)}">👍 We made this today</button>
          <button type="button" class="btn btn-ghost" data-action="edit-recipe" data-id="${escapeHTML(recipe.id)}">✏️ Edit recipe</button>
        </div>
        ${recipe.builtin && recipe.edited ? '<p class="small muted" style="margin-top:8px">You have edited this recipe.</p>' : ''}
      </div>
    </div>`;
}

/* ---------- Shared photo field for editors ---------- */
function photoFieldHTML(currentSrc, fallbackEmoji) {
  return `<div class="field">
    <span>Photo <small>(optional — from your gallery or camera)</small></span>
    <div class="photo-field">
      <div class="photo-preview" id="photoPreview">${currentSrc ? `<img src="${escapeHTML(currentSrc)}" alt="Current photo" data-fallback="${escapeHTML(fallbackEmoji)}">` : `<span aria-hidden="true">${escapeHTML(fallbackEmoji)}</span>`}</div>
      <div class="photo-actions">
        <label class="btn btn-ghost btn-sm file-btn">📷 ${currentSrc ? 'Change photo' : 'Add photo'}
          <input type="file" id="photoInput" accept="image/*">
        </label>
        <button type="button" class="btn btn-danger-ghost btn-sm" data-action="remove-photo" ${currentSrc ? '' : 'hidden'} id="removePhotoBtn">Remove photo</button>
      </div>
    </div>
    <small id="photoStatus" class="hint"></small>
  </div>`;
}

async function handlePhotoInput(input) {
  const file = input.files && input.files[0];
  const status = $('#photoStatus');
  if (!file) return;
  if (status) status.textContent = 'Preparing photo…';
  try {
    const dataUrl = await fileToResizedDataURL(file);
    state.ui.pendingImage = dataUrl;
    $('#photoPreview').innerHTML = `<img src="${escapeHTML(dataUrl)}" alt="New photo preview">`;
    $('#removePhotoBtn').hidden = false;
    if (status) status.textContent = 'Photo ready — it will be saved when you tap Save.';
  } catch (err) {
    if (status) status.textContent = photoErrorMessage(err);
    showToast(photoErrorMessage(err));
  }
  input.value = '';
}

/** Save or delete the pending photo for a key; returns false if it could not be stored. */
async function commitPendingImage(key) {
  const pending = state.ui.pendingImage;
  if (pending === undefined) return true;
  if (pending === null) {
    await ImageStore.remove(key);
    state.images.delete(key);
    return true;
  }
  const ok = await ImageStore.put(key, pending);
  if (ok) state.images.set(key, pending);
  return ok;
}

function formErrorsHTML(errors) {
  return `<div class="form-errors" role="alert">Please fix:<ul>${errors.map(e => `<li>${escapeHTML(e)}</li>`).join('')}</ul></div>`;
}

/* ---------- Ingredient editor ---------- */
function openIngredientEditor(id, presetName = '') {
  const ing = id ? getIngredient(id) : null;
  state.ui.pendingImage = undefined;
  const sheet = $('#sheet');
  sheet.dataset.mode = 'ingredient';
  sheet.dataset.editId = ing ? ing.id : '';
  const currentPhoto = ing ? state.images.get('ing:' + ing.id) : null;
  const fallbackIcon = ing && !ing.icon.startsWith('svg:') ? ing.icon : '🥗';
  const isNew = !ing;
  const excluded = ing && state.settings.excluded.includes(ing.id);
  // Guess if the typed text is Gujarati script
  const presetIsGujarati = /[઀-૿]/.test(presetName);

  sheet.innerHTML = `
    <div class="sheet-inner">
      <div class="sheet-top">
        <h2 id="sheetTitle">${isNew ? '➕ Add an ingredient' : '✏️ Edit ingredient'}</h2>
        <button type="button" class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button>
      </div>
      <form class="sheet-body form" id="ingForm" novalidate>
        <div id="ingFormErrors"></div>
        <label class="field"><span>Name in English letters *</span>
          <input name="local" maxlength="40" required value="${escapeHTML(ing ? ing.local : (presetIsGujarati ? '' : presetName))}" placeholder="e.g. Turiya">
        </label>
        <label class="field"><span>English name <small>(optional)</small></span>
          <input name="name" maxlength="40" value="${escapeHTML(ing ? ing.name : '')}" placeholder="e.g. Ridge Gourd">
        </label>
        <label class="field"><span>Gujarati name <small>(optional)</small></span>
          <input name="gu" maxlength="40" lang="gu" value="${escapeHTML(ing ? ing.gu : (presetIsGujarati ? presetName : ''))}" placeholder="e.g. તુરિયા">
        </label>
        <label class="field"><span>Other names &amp; spellings <small>— separate with commas. Search will find all of these.</small></span>
          <input name="aliases" maxlength="300" value="${escapeHTML(ing ? ing.aliases.join(', ') : '')}" placeholder="e.g. turai, toorai, તુરીયા">
        </label>
        <label class="field"><span>Group</span>
          <select name="category">${INGREDIENT_CATEGORIES.map(c => `<option value="${c.id}" ${(ing ? ing.category : 'veg') === c.id ? 'selected' : ''}>${escapeHTML(c.label)}</option>`).join('')}</select>
        </label>
        <fieldset>
          <legend>Jain details</legend>
          <label class="check-row"><input type="checkbox" name="root" ${ing && ing.root ? 'checked' : ''}><span>It is a root vegetable (kandmool)</span></label>
          <label class="check-row"><input type="checkbox" name="onionGarlic" ${ing && ing.onionGarlic ? 'checked' : ''}><span>It is onion / garlic family</span></label>
          <label class="check-row"><input type="checkbox" name="hardVeg" ${ing && ing.hardVeg ? 'checked' : ''}><span>Many-seeded / hard to clean</span></label>
          <label class="check-row"><input type="checkbox" name="excluded" ${excluded ? 'checked' : ''}><span>We don’t use this at home</span></label>
        </fieldset>
        ${photoFieldHTML(currentPhoto, fallbackIcon)}
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">💾 Save ingredient</button>
          <button type="button" class="btn btn-ghost" data-action="close-sheet">Cancel</button>
          ${ing ? `<button type="button" class="btn btn-danger-ghost" data-action="delete-ingredient" data-id="${escapeHTML(ing.id)}">🗑️ Remove</button>` : ''}
        </div>
      </form>
    </div>`;
  openDialog(sheet);
  sheet.scrollTop = 0;
  const first = sheet.querySelector('input[name="local"]');
  if (first) first.focus();
}

async function saveIngredientForm(form) {
  const editId = $('#sheet').dataset.editId || '';
  const existing = editId ? getIngredient(editId) : null;
  const data = new FormData(form);
  const local = String(data.get('local') || '').trim();
  const name = String(data.get('name') || '').trim();
  const gu = String(data.get('gu') || '').trim();
  const aliases = splitList(data.get('aliases')).slice(0, 30);
  const category = String(data.get('category') || 'other');

  const errors = [];
  if (!local && !gu) errors.push('Please enter a name (in English letters or Gujarati).');
  // Don't create a second copy of something that already exists
  if (!existing) {
    [local, name, gu].filter(Boolean).forEach(text => {
      const match = searchIngredients(text)[0];
      if (match && match.score === 100) errors.push(`“${text}” already exists as ${ingFull(match.ing.id)}. Edit that one instead.`);
    });
  }
  if (errors.length) {
    $('#ingFormErrors').innerHTML = formErrorsHTML(errors);
    $('#sheet').scrollTop = 0;
    return;
  }

  const record = {
    local: local || gu,
    name: name || local || gu,
    gu,
    category,
    aliases,
    root: data.get('root') === 'on',
    onionGarlic: data.get('onionGarlic') === 'on',
    hardVeg: data.get('hardVeg') === 'on'
  };

  let id;
  if (existing && existing.builtin) {
    id = existing.id;
    state.ingredientOverrides[id] = record;
    save('ingredientOverrides');
  } else if (existing) {
    id = existing.id;
    const idx = state.customIngredients.findIndex(c => c.id === id);
    if (idx >= 0) state.customIngredients[idx] = { ...state.customIngredients[idx], ...record, id };
    save('customIngredients');
  } else {
    id = makeId('c_', record.local);
    state.customIngredients.push({ id, icon: '🥗', bg: '#eef3e6', ...record });
    save('customIngredients');
  }

  // "We don't use this" lives in settings
  const wantsExcluded = data.get('excluded') === 'on';
  state.settings.excluded = state.settings.excluded.filter(x => x !== id);
  if (wantsExcluded) state.settings.excluded.push(id);
  save('settings');

  const photoOk = await commitPendingImage('ing:' + id);
  rebuildData();
  if (!existing && !ingredientBlockReason(id)) state.ui.selected.add(id); // new ingredient → select it
  sanitizeSelection();
  closeSheet();
  $('#ingSearch').value = '';
  renderAll();
  showToast(photoOk ? (existing ? 'Ingredient updated ✓' : `${record.local} added ✓`) : 'Saved, but the photo could not be stored (storage full?).');
}

async function deleteIngredient(id) {
  const ing = getIngredient(id);
  if (!ing) return;
  const usedBy = state.recipes.filter(r => [...r.required, ...r.optional].some(i => i.id === id || i.sub === id)).length;
  const ok = await confirmAction({
    title: `Remove ${ing.local}?`,
    message: (ing.builtin ? 'It will be hidden from the ingredient list. You can bring it back from Settings.' : 'Your ingredient and its photo will be deleted.')
      + (usedBy ? ` ${usedBy} recipe${usedBy > 1 ? 's use' : ' uses'} it — they will show it as “still needed”.` : ''),
    confirmLabel: 'Remove',
    danger: true
  });
  if (!ok) return;
  if (ing.builtin) {
    if (!state.deletedIngredients.includes(id)) state.deletedIngredients.push(id);
    save('deletedIngredients');
  } else {
    state.customIngredients = state.customIngredients.filter(c => c.id !== id);
    save('customIngredients');
  }
  await ImageStore.remove('ing:' + id);
  state.images.delete('ing:' + id);
  state.settings.excluded = state.settings.excluded.filter(x => x !== id);
  save('settings');
  state.ui.selected.delete(id);
  closeSheet();
  refreshAfterDataChange();
  showToast(`${ing.local} removed`);
}

/* ---------- Recipe editor ---------- */
function ingredientOptionsHTML(selectedId) {
  const pool = state.ingredients.filter(i => !i.deleted || i.id === selectedId);
  let html = `<option value="">— choose ingredient —</option>`;
  INGREDIENT_CATEGORIES.forEach(c => {
    const items = pool.filter(i => i.category === c.id).sort((a, b) => a.local.localeCompare(b.local));
    if (!items.length) return;
    html += `<optgroup label="${escapeHTML(c.label)}">${items.map(i => `<option value="${escapeHTML(i.id)}" ${i.id === selectedId ? 'selected' : ''}>${escapeHTML(ingFull(i.id))}</option>`).join('')}</optgroup>`;
  });
  if (selectedId && !getIngredient(selectedId)) {
    html += `<option value="${escapeHTML(selectedId)}" selected>${escapeHTML(ingShort(selectedId))} (removed)</option>`;
  }
  return html;
}

function ingredientRowHTML(item = {}, kind = 'req') {
  return `<div class="ing-row" data-sub="${escapeHTML(item.sub || '')}" data-orig="${escapeHTML(item.id || '')}">
    <select class="ing-select" name="ingId" aria-label="Ingredient">${ingredientOptionsHTML(item.id || '')}</select>
    <input name="qty" type="number" inputmode="decimal" step="any" min="0" max="10000" placeholder="Qty" aria-label="Quantity" value="${item.qty !== null && item.qty !== undefined ? escapeHTML(item.qty) : ''}">
    <input name="unit" maxlength="40" placeholder="cup, tbsp, g…" aria-label="Unit" value="${escapeHTML(item.unit || '')}">
    <select class="kind" name="kind" aria-label="Must have or optional">
      <option value="req" ${kind === 'req' ? 'selected' : ''}>Must have</option>
      <option value="opt" ${kind === 'opt' ? 'selected' : ''}>Optional</option>
    </select>
    <button type="button" class="row-remove" data-action="remove-row" aria-label="Remove this ingredient">✕</button>
  </div>`;
}

function openRecipeEditor(id) {
  const recipe = id ? state.recipeMap.get(id) : null;
  state.ui.pendingImage = undefined;
  state.ui.editorReturn = id || null;
  const sheet = $('#sheet');
  sheet.dataset.mode = 'recipe';
  sheet.dataset.editId = recipe ? recipe.id : '';
  const r = recipe || { name: '', gu: '', aka: [], category: 'snack', difficulty: 'Easy', time: 20, servings: 3, emoji: '🍽️', gujarati: false, fried: false, filling: false, description: '', required: [], optional: [], pantry: 'Salt, oil, haldi, red chilli powder', steps: [] };
  const rows = [...r.required.map(i => ingredientRowHTML(i, 'req')), ...r.optional.map(i => ingredientRowHTML(i, 'opt'))];
  if (!rows.length) rows.push(ingredientRowHTML({}, 'req'), ingredientRowHTML({}, 'req'));
  const photo = recipe ? state.images.get('rec:' + recipe.id) : null;

  sheet.innerHTML = `
    <div class="sheet-inner">
      <div class="sheet-top">
        <h2 id="sheetTitle">${recipe ? '✏️ Edit recipe' : '➕ Add a new recipe'}</h2>
        <button type="button" class="icon-btn" data-action="close-sheet" aria-label="Close">✕</button>
      </div>
      <form class="sheet-body form" id="recipeForm" novalidate>
        <div id="recipeFormErrors"></div>
        <label class="field"><span>Dish name *</span>
          <input name="name" maxlength="70" required value="${escapeHTML(r.name)}" placeholder="e.g. Sev Usal">
        </label>
        <label class="field"><span>Gujarati name <small>(optional)</small></span>
          <input name="gu" maxlength="70" lang="gu" value="${escapeHTML(r.gu)}" placeholder="e.g. સેવ ઉસળ">
        </label>
        <label class="field"><span>Other names <small>— separate with commas</small></span>
          <input name="aka" maxlength="200" value="${escapeHTML(r.aka.join(', '))}">
        </label>
        <div class="row2">
          <label class="field"><span>Type</span>
            <select name="category">
              <option value="snack" ${r.category === 'snack' ? 'selected' : ''}>Evening snack</option>
              <option value="meal" ${r.category === 'meal' ? 'selected' : ''}>Light meal</option>
            </select>
          </label>
          <label class="field"><span>Difficulty</span>
            <select name="difficulty">
              <option value="Easy" ${r.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
              <option value="Medium" ${r.difficulty === 'Medium' ? 'selected' : ''}>Medium</option>
            </select>
          </label>
        </div>
        <div class="row3">
          <label class="field"><span>Time (min) *</span>
            <input name="time" type="number" inputmode="numeric" min="1" max="600" step="1" value="${escapeHTML(r.time)}">
          </label>
          <label class="field"><span>Serves *</span>
            <input name="servings" type="number" inputmode="numeric" min="1" max="20" step="1" value="${escapeHTML(r.servings)}">
          </label>
          <label class="field"><span>Picture emoji</span>
            <input name="emoji" maxlength="8" value="${escapeHTML(r.emoji)}">
          </label>
        </div>
        <fieldset>
          <legend>About this dish</legend>
          <label class="check-row"><input type="checkbox" name="gujarati" ${r.gujarati ? 'checked' : ''}><span>Gujarati favourite</span></label>
          <label class="check-row"><input type="checkbox" name="filling" ${r.filling ? 'checked' : ''}><span>Filling enough for dinner</span></label>
          <label class="check-row"><input type="checkbox" name="fried" ${r.fried ? 'checked' : ''}><span>Deep-fried</span></label>
        </fieldset>
        <label class="field"><span>Short description</span>
          <textarea name="description" maxlength="220" rows="2">${escapeHTML(r.description)}</textarea>
        </label>
        <fieldset>
          <legend>Ingredients *</legend>
          <p class="hint" style="margin-bottom:8px">“Must have” ingredients decide when this dish is suggested. Missing an ingredient? Add it first in Settings → Manage Ingredients.</p>
          <div class="ing-rows" id="ingRows">${rows.join('')}</div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="add-row">+ Add another ingredient</button>
        </fieldset>
        <label class="field"><span>Pantry basics used <small>(salt, oil, spices — not used for matching)</small></span>
          <input name="pantry" maxlength="300" value="${escapeHTML(r.pantry)}">
        </label>
        <label class="field"><span>How to make it * <small>— write one step per line</small></span>
          <textarea name="steps" rows="7" maxlength="4000" placeholder="Step 1…&#10;Step 2…">${escapeHTML(r.steps.join('\n'))}</textarea>
        </label>
        ${photoFieldHTML(photo, r.emoji || '🍽️')}
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">💾 Save recipe</button>
          <button type="button" class="btn btn-ghost" data-action="cancel-recipe-edit">Cancel</button>
          ${recipe && recipe.builtin && recipe.edited ? `<button type="button" class="btn btn-ghost" data-action="restore-original" data-id="${escapeHTML(recipe.id)}">↩️ Restore original</button>` : ''}
          ${recipe ? `<button type="button" class="btn btn-danger-ghost" data-action="delete-recipe" data-id="${escapeHTML(recipe.id)}">🗑️ Delete</button>` : ''}
        </div>
      </form>
    </div>`;
  openDialog(sheet);
  sheet.scrollTop = 0;
  const first = sheet.querySelector('input[name="name"]');
  if (first) first.focus();
}

async function saveRecipeForm(form) {
  const editId = $('#sheet').dataset.editId || '';
  const existing = editId ? state.recipeMap.get(editId) : null;
  const data = new FormData(form);
  const errors = [];

  const name = String(data.get('name') || '').trim();
  const time = Number(data.get('time'));
  const servings = Number(data.get('servings'));
  const steps = String(data.get('steps') || '').split('\n').map(s => s.replace(/^\s*(step\s*)?\d+[.):-]?\s*/i, '').trim()).filter(Boolean);

  const required = [];
  const optional = [];
  const used = new Set();
  let badQty = false;
  $$('#ingRows .ing-row').forEach(row => {
    const id = row.querySelector('[name="ingId"]').value;
    if (!id || used.has(id)) return;
    used.add(id);
    const qtyRaw = row.querySelector('[name="qty"]').value.trim();
    const qty = qtyRaw === '' ? null : Number(qtyRaw);
    if (qtyRaw !== '' && (!Number.isFinite(qty) || qty < 0 || qty > 10000)) badQty = true;
    const item = {
      id,
      qty: Number.isFinite(qty) ? qty : null,
      unit: row.querySelector('[name="unit"]').value.trim().slice(0, 40),
      // keep a built-in Jain swap only if the ingredient wasn't changed
      sub: row.dataset.orig === id && row.dataset.sub ? row.dataset.sub : null
    };
    (row.querySelector('[name="kind"]').value === 'opt' ? optional : required).push(item);
  });

  if (!name) errors.push('Give the dish a name.');
  if (!Number.isInteger(time) || time < 1 || time > 600) errors.push('Time must be a whole number of minutes between 1 and 600.');
  if (!Number.isInteger(servings) || servings < 1 || servings > 20) errors.push('Serves must be a whole number between 1 and 20.');
  if (!required.length) errors.push('Choose at least one “Must have” ingredient.');
  if (badQty) errors.push('Quantities must be numbers (for example 2 or 0.5). Leave empty for “as needed”.');
  if (!steps.length) errors.push('Add at least one cooking step.');

  if (errors.length) {
    $('#recipeFormErrors').innerHTML = formErrorsHTML(errors);
    $('#sheet').scrollTop = 0;
    return;
  }

  const record = {
    name,
    gu: String(data.get('gu') || '').trim(),
    aka: splitList(data.get('aka')).slice(0, 20),
    category: data.get('category') === 'meal' ? 'meal' : 'snack',
    difficulty: data.get('difficulty') === 'Medium' ? 'Medium' : 'Easy',
    time, servings,
    emoji: String(data.get('emoji') || '').trim() || '🍽️',
    gujarati: data.get('gujarati') === 'on',
    filling: data.get('filling') === 'on',
    fried: data.get('fried') === 'on',
    description: String(data.get('description') || '').trim(),
    required, optional,
    pantry: String(data.get('pantry') || '').trim(),
    steps
  };

  let id;
  if (existing && existing.builtin) {
    id = existing.id;
    state.recipeOverrides[id] = record;
    save('recipeOverrides');
  } else if (existing) {
    id = existing.id;
    const idx = state.customRecipes.findIndex(c => c.id === id);
    if (idx >= 0) state.customRecipes[idx] = { ...record, id };
    save('customRecipes');
  } else {
    id = makeId('r_', name);
    state.customRecipes.push({ ...record, id });
    save('customRecipes');
  }

  const photoOk = await commitPendingImage('rec:' + id);
  rebuildData();
  renderAll();
  openRecipe(id);
  showToast(photoOk ? (existing ? 'Recipe updated ✓' : 'Recipe added ✓') : 'Recipe saved, but the photo could not be stored (storage full?).');
}

async function deleteRecipe(id) {
  const recipe = state.recipeMap.get(id);
  if (!recipe) return;
  const ok = await confirmAction({
    title: `Delete ${recipe.name}?`,
    message: recipe.builtin ? 'It will be hidden. You can bring built-in recipes back from Settings.' : 'Your recipe and its photo will be deleted permanently.',
    confirmLabel: 'Delete',
    danger: true
  });
  if (!ok) return;
  if (recipe.builtin) {
    if (!state.deletedRecipes.includes(id)) state.deletedRecipes.push(id);
    delete state.recipeOverrides[id];
    save('deletedRecipes');
    save('recipeOverrides');
  } else {
    state.customRecipes = state.customRecipes.filter(r => r.id !== id);
    save('customRecipes');
  }
  await ImageStore.remove('rec:' + id);
  state.images.delete('rec:' + id);
  state.favourites = state.favourites.filter(f => f !== id);
  save('favourites');
  if (state.ui.surpriseId === id) state.ui.surpriseId = null;
  closeSheet();
  refreshAfterDataChange();
  showToast(`${recipe.name} deleted`);
}


/* =====================================================================
   11. EVENT HANDLING & START-UP
   ---------------------------------------------------------------------
   One click listener handles every button via data-action="…".
   ===================================================================== */

function toggleFavourite(id) {
  const recipe = state.recipeMap.get(id);
  if (!recipe) return;
  if (state.favourites.includes(id)) {
    state.favourites = state.favourites.filter(f => f !== id);
    showToast(`Removed ${recipe.name} from favourites`);
  } else {
    state.favourites.push(id);
    showToast(`❤️ ${recipe.name} added to favourites`);
  }
  save('favourites');
  renderResults();
  renderFavourites();
  renderRecipeList();
  if (state.ui.detail && state.ui.detail.id === id) renderDetail();
}

function toggleIngredient(id, fromSearch) {
  const ing = getIngredient(id);
  if (!ing) return;
  const reason = ingredientBlockReason(id);
  if (reason) {
    showToast(`${ing.local}: ${reason}. You can change this in Settings.`);
    return;
  }
  if (state.ui.selected.has(id)) state.ui.selected.delete(id);
  else state.ui.selected.add(id);

  if (fromSearch) {
    // Clear the search so the next ingredient can be typed straight away
    const input = $('#ingSearch');
    input.value = '';
    renderSearchResults();
    input.focus();
    if (state.ui.selected.has(id)) showToast(`✓ ${ing.local} added`);
  }
  afterSelectionChange();
}

function afterSelectionChange() {
  state.ui.showAll = false;
  // Keep the visible card states in sync without rebuilding (keeps focus)
  $$('#ingredientGrid .ing-card[data-id]').forEach(card => {
    const on = state.ui.selected.has(card.dataset.id);
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-pressed', String(on));
  });
  renderTray();
  if (state.ui.hasSuggested || state.ui.surpriseId) renderResults(); // live-update once suggestions are showing
}

function scrollToResults() {
  const results = $('#results');
  requestAnimationFrame(() => {
    results.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    results.focus({ preventScroll: true });
  });
}

function doSuggest() {
  state.ui.hasSuggested = true;
  state.ui.surpriseId = null;
  state.ui.showAll = false;
  const selected = allowedSelection();
  if (selected.size) {
    const { ready, almost } = getSuggestions({ selected });
    logSuggestions([...ready, ...almost]);
  }
  renderResults();
  scrollToResults();
}

function doSurprise() {
  const pick = pickSurprise();
  if (!pick) {
    showToast('No dish fits your food rules and filters right now. Try clearing filters.');
    return;
  }
  state.ui.surpriseId = pick.id;
  if (state.ui.view !== 'home') showView('home');
  renderResults();
  scrollToResults();
}

async function handleAction(btn, event) {
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  switch (action) {
    /* ----- navigation ----- */
    case 'nav': closeSheet(); showView(id); break;
    case 'open-settings': Store.set('seenIntro', true); renderBanners(); showView('settings'); break;
    case 'dismiss-intro': Store.set('seenIntro', true); renderBanners(); break;

    /* ----- ingredient selection ----- */
    case 'set-category': state.ui.category = id; renderCategoryTabs(); renderGrid(); break;
    case 'toggle-ing': toggleIngredient(id, btn.dataset.fromSearch === '1'); break;
    case 'remove-selected': state.ui.selected.delete(id); afterSelectionChange(); break;
    case 'select-many': {
      const ids = String(btn.dataset.ids || '').split(',').filter(Boolean);
      let added = 0;
      ids.forEach(x => { if (getIngredient(x) && !ingredientBlockReason(x)) { state.ui.selected.add(x); added++; } });
      $('#ingSearch').value = '';
      renderSearchResults();
      afterSelectionChange();
      showToast(`✓ ${added} ingredient${added === 1 ? '' : 's'} added`);
      break;
    }
    case 'clear-selection':
      state.ui.selected.clear();
      state.ui.hasSuggested = false;
      state.ui.surpriseId = null;
      afterSelectionChange();
      renderResults();
      showToast('Today’s selection cleared');
      break;
    case 'save-selection':
      Store.set('savedSelection', [...state.ui.selected]);
      state.ui.savedBannerDismissed = true;
      showToast('💾 List saved. It will be offered next time you open the app.');
      break;
    case 'use-saved': {
      const saved = asArray(Store.get('savedSelection', []));
      saved.forEach(x => { if (getIngredient(x) && !getIngredient(x).deleted && !ingredientBlockReason(x)) state.ui.selected.add(x); });
      state.ui.savedBannerDismissed = true;
      renderBanners();
      afterSelectionChange();
      break;
    }
    case 'discard-saved':
      Store.remove('savedSelection');
      renderBanners();
      showToast('Saved list removed');
      break;
    case 'add-ingredient': openIngredientEditor(null, btn.dataset.name || ''); break;

    /* ----- suggestions ----- */
    case 'suggest': doSuggest(); break;
    case 'surprise': doSurprise(); break;
    case 'close-surprise': state.ui.surpriseId = null; renderResults(); break;
    case 'refresh':
      state.ui.refreshSeed++;
      state.ui.showAll = false;
      renderResults();
      showToast('🔄 Fresh ideas');
      break;
    case 'show-more': state.ui.showAll = true; renderResults(); break;
    case 'toggle-filter':
      if (state.ui.filters.has(id)) state.ui.filters.delete(id); else state.ui.filters.add(id);
      renderFilters();
      renderResults();
      break;
    case 'clear-filters': state.ui.filters.clear(); renderFilters(); renderResults(); break;
    case 'not-today': {
      notTodayIds();
      if (!state.notToday.ids.includes(id)) state.notToday.ids.push(id);
      save('notToday');
      renderResults();
      const r = state.recipeMap.get(id);
      showToast(`${r ? r.name : 'Dish'} hidden for today`);
      break;
    }
    case 'undo-not-today': state.notToday = { day: todayKey(), ids: [] }; save('notToday'); renderResults(); break;

    /* ----- recipes ----- */
    case 'open-recipe': openRecipe(id); break;
    case 'fav': toggleFavourite(id); break;
    case 'close-sheet': closeSheet(); break;
    case 'servings': {
      const d = state.ui.detail;
      if (!d) break;
      d.servings = Math.round(clampNumber(d.servings + Number(btn.dataset.delta || 0), 1, 20, d.servings));
      renderDetail();
      const again = $(`#sheet [data-action="servings"][data-delta="${btn.dataset.delta}"]`);
      if (again && !again.disabled) again.focus();
      break;
    }
    case 'made-today': {
      state.cookedLog.push({ id, t: Date.now() });
      state.cookedLog = state.cookedLog.slice(-100);
      save('cookedLog');
      renderFavourites();
      showToast('👍 Noted! We’ll suggest it less for the next few days.');
      break;
    }
    case 'edit-recipe': openRecipeEditor(id); break;
    case 'new-recipe': closeSheet(); openRecipeEditor(null); break;
    case 'cancel-recipe-edit':
      if (state.ui.editorReturn && state.recipeMap.has(state.ui.editorReturn)) openRecipe(state.ui.editorReturn);
      else closeSheet();
      break;
    case 'delete-recipe': await deleteRecipe(id); break;
    case 'add-row': {
      const rows = $('#ingRows');
      rows.insertAdjacentHTML('beforeend', ingredientRowHTML({}, 'req'));
      const last = rows.lastElementChild.querySelector('select');
      if (last) last.focus();
      break;
    }
    case 'remove-row': {
      const row = btn.closest('.ing-row');
      if (row) row.remove();
      if (!$$('#ingRows .ing-row').length) $('#ingRows').insertAdjacentHTML('beforeend', ingredientRowHTML({}, 'req'));
      break;
    }
    case 'set-recipe-cat': state.ui.recipeCat = id; renderRecipeCats(); renderRecipeList(); break;

    /* ----- photos in editors ----- */
    case 'remove-photo':
      state.ui.pendingImage = null;
      $('#photoPreview').innerHTML = '<span aria-hidden="true">🖼️</span>';
      btn.hidden = true;
      $('#photoStatus').textContent = 'Photo will be removed when you tap Save.';
      break;

    /* ----- ingredients management ----- */
    case 'edit-ingredient': openIngredientEditor(id); break;
    case 'delete-ingredient': await deleteIngredient(id); break;

    /* ----- settings ----- */
    case 'toggle-excluded': {
      const list = state.settings.excluded;
      state.settings.excluded = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
      save('settings');
      sanitizeSelection();
      renderSettings();
      renderHome();
      renderRecipeList();
      renderFavourites();
      const again = $(`#settingsBody [data-action="toggle-excluded"][data-id="${CSS.escape(id)}"]`);
      if (again) again.focus();
      break;
    }
    case 'restore-ingredients':
      state.deletedIngredients = [];
      save('deletedIngredients');
      refreshAfterDataChange();
      showToast('Built-in ingredients are back');
      break;
    case 'restore-recipes':
      state.deletedRecipes = [];
      save('deletedRecipes');
      refreshAfterDataChange();
      showToast('Built-in recipes are back');
      break;
    case 'restore-original': {
      const ok = await confirmAction({ title: 'Restore the original recipe?', message: 'Your changes to this recipe will be lost (your photo stays).', confirmLabel: 'Restore' });
      if (!ok) break;
      delete state.recipeOverrides[id];
      save('recipeOverrides');
      rebuildData();
      renderAll();
      openRecipe(id);
      showToast('Original recipe restored');
      break;
    }
    case 'reset-app': {
      const ok = await confirmAction({
        title: 'Reset all app data?',
        message: 'This permanently deletes your food rules, favourites, your own ingredients and recipes, edits, photos and history from this browser. This cannot be undone.',
        confirmLabel: 'Yes, erase everything',
        danger: true
      });
      if (!ok) break;
      Store.clearAll();
      await ImageStore.clear();
      location.reload();
      break;
    }
    default:
      break;
  }
}

function applySettingChange(input) {
  const key = input.dataset.setting;
  if (!(key in DEFAULT_SETTINGS)) return;
  state.settings[key] = input.checked;
  save('settings');
  sanitizeSelection();
  renderSettings();
  renderHome();
  renderRecipeList();
  renderFavourites();
  const again = $(`#settingsBody [data-setting="${key}"]`);
  if (again) again.focus();
  showToast('Food rules updated ✓');
}

function bindEvents() {
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-nav]');
    if (nav) { closeSheet(); showView(nav.dataset.nav); return; }
    const btn = event.target.closest('[data-action]');
    if (!btn || btn.disabled) return;
    handleAction(btn, event).catch(err => {
      console.error(err);
      showToast('Something went wrong — please try again.');
    });
  });

  document.addEventListener('change', event => {
    const t = event.target;
    if (t.matches('[data-setting]')) applySettingChange(t);
    if (t.id === 'photoInput') handlePhotoInput(t);
  });

  document.addEventListener('submit', event => {
    const form = event.target;
    if (form.id !== 'recipeForm' && form.id !== 'ingForm') return;
    event.preventDefault();
    const task = form.id === 'recipeForm' ? saveRecipeForm(form) : saveIngredientForm(form);
    task.catch(err => { console.error(err); showToast('Could not save — please check the form and try again.'); });
  });

  // Ingredient search (works in Gujarati, English and transliteration)
  const search = $('#ingSearch');
  search.addEventListener('input', renderSearchResults);
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const first = $('#searchResults .sr-item');
      if (first) first.click();
    } else if (event.key === 'Escape') {
      search.value = '';
      renderSearchResults();
    }
  });

  $('#recipeSearch').addEventListener('input', debounce(event => {
    state.ui.recipeQuery = event.target.value;
    renderRecipeList();
  }, 200));

  // Household notes save as you type
  document.addEventListener('input', debounce(event => {
    if (event.target.id === 'notesInput') {
      state.settings.notes = event.target.value.slice(0, 500);
      save('settings');
    }
  }, 400));

  // Close the sheet when tapping the dark backdrop, or with Escape
  const sheet = $('#sheet');
  sheet.addEventListener('click', event => { if (event.target === sheet) closeSheet(); });
  sheet.addEventListener('cancel', event => { event.preventDefault(); closeSheet(); });

  // Any image that fails to load is replaced with a friendly placeholder
  document.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.fallback) return;
    const fallback = document.createElement(img.dataset.fallbackClass ? 'div' : 'span');
    if (img.dataset.fallbackClass) fallback.className = img.dataset.fallbackClass;
    fallback.setAttribute('aria-hidden', 'true');
    fallback.innerHTML = `<span>${escapeHTML(img.dataset.fallback)}</span>`;
    img.replaceWith(fallback);
  }, true);

  // Refresh greeting/"not today" list if the app is left open past midnight
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderGreeting();
      if (state.notToday.day !== todayKey()) { notTodayIds(); renderResults(); }
    }
  });
}

async function init() {
  loadState();
  rebuildData();
  bindEvents();
  showView('home');
  renderAll();

  // Photos load in the background; the app is usable immediately
  await ImageStore.init();
  state.images = await ImageStore.getAll();
  if (state.images.size) renderAll();
  renderSettings();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

// Handy for curious users: open the browser console and type AajeShu
window.AajeShu = { state, normalizeText, searchIngredients, getSuggestions, analyseRecipe, resolveRecipe };
