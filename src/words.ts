import { buildZhPassage } from './lexicon-zh.ts'
import type { Difficulty, Script } from './types.ts'

const EASY = [
  'act', 'age', 'air', 'and', 'ant', 'arm', 'art', 'ask', 'bag', 'bar', 'bat', 'bed', 'bee', 'big', 'bit',
  'box', 'boy', 'bus', 'buy', 'can', 'cap', 'car', 'cat', 'cup', 'cut', 'day', 'den', 'dig', 'dog', 'dry',
  'ear', 'eat', 'egg', 'end', 'eye', 'far', 'fig', 'fin', 'fly', 'fog', 'fox', 'fun', 'gap', 'get', 'hat',
  'hen', 'her', 'him', 'hop', 'hot', 'hug', 'ice', 'ink', 'jam', 'jar', 'jet', 'job', 'joy', 'key', 'kid',
  'kit', 'lab', 'leg', 'let', 'lid', 'lip', 'log', 'lot', 'low', 'map', 'mat', 'mix', 'mud', 'net', 'new',
  'nod', 'now', 'nut', 'oak', 'odd', 'oil', 'old', 'one', 'our', 'out', 'owl', 'own', 'pad', 'pan', 'pay',
  'pea', 'pen', 'pet', 'pie', 'pig', 'pin', 'pot', 'put', 'rag', 'ran', 'rat', 'red', 'rib', 'rim', 'rod',
  'row', 'rug', 'run', 'sad', 'sap', 'sat', 'saw', 'say', 'sea', 'set', 'she', 'shy', 'sit', 'six', 'ski',
  'sky', 'son', 'soy', 'sun', 'tan', 'tap', 'tea', 'ten', 'the', 'tie', 'tin', 'tip', 'toe', 'top', 'toy',
  'try', 'tub', 'two', 'use', 'van', 'vet', 'war', 'was', 'way', 'web', 'wet', 'who', 'why', 'win', 'won',
  'yak', 'yes', 'yet', 'you', 'zip', 'zoo', 'able', 'back', 'bake', 'ball', 'band', 'bank', 'base', 'bath',
  'beak', 'bean', 'bear', 'bell', 'belt', 'bird', 'blue', 'boat', 'bold', 'bone', 'book', 'boot', 'bowl',
  'burn', 'busy', 'cake', 'calf', 'call', 'calm', 'came', 'camp', 'card', 'care', 'cart', 'case', 'cast',
  'cave', 'chat', 'chip', 'city', 'clay', 'club', 'coal', 'coat', 'code', 'cold', 'cook', 'cool', 'corn',
  'cozy', 'crab', 'crew', 'crop', 'crow', 'dark', 'dawn', 'dear', 'deck', 'deep', 'deer', 'desk', 'dish',
  'door', 'down', 'draw', 'drop', 'drum', 'duck', 'dune', 'dust', 'each', 'earn', 'east', 'easy', 'edge',
  'even', 'face', 'fair', 'fall', 'farm', 'fast', 'feel', 'file', 'find', 'fine', 'fire', 'fish', 'five',
  'flag', 'flat', 'flow', 'foam', 'fold', 'food', 'foot', 'fork', 'form', 'fort', 'four', 'free', 'full',
  'game', 'gate', 'gift', 'girl', 'give', 'glad', 'glow', 'goal', 'goat', 'gold', 'golf', 'good', 'grow',
  'half', 'hall', 'hand', 'hang', 'hard', 'hare', 'harp', 'have', 'head', 'hear', 'heat', 'help', 'herd',
  'hero', 'hide', 'high', 'hill', 'hint', 'hold', 'home', 'hook', 'hope', 'horn', 'hour', 'huge', 'hunt',
  'idea', 'iron', 'item', 'join', 'joke', 'jump', 'june', 'just', 'keen', 'keep', 'kick', 'kind', 'king',
  'kite', 'knee', 'knit', 'knot', 'know', 'lace', 'lack', 'lady', 'lake', 'lamb', 'lamp', 'land', 'lane',
  'last', 'late', 'lava', 'lazy', 'lead', 'leaf', 'lean', 'left', 'life', 'lift', 'like', 'line', 'link',
  'lion', 'list', 'live', 'load', 'lock', 'long', 'look', 'loop', 'lose', 'lost', 'love', 'luck', 'mail',
  'main', 'make', 'many', 'mark', 'mask', 'meal', 'mean', 'meat', 'meet', 'melt', 'menu', 'mild', 'mile',
  'milk', 'mind', 'mine', 'mint', 'miss', 'mist', 'moon', 'more', 'most', 'move', 'much', 'must', 'name',
  'near', 'neck', 'need', 'nest', 'news', 'next', 'nice', 'nine', 'noon', 'nose', 'note', 'open', 'oven',
  'over', 'pace', 'pack', 'page', 'pair', 'pale', 'palm', 'park', 'part', 'pass', 'past', 'path', 'peak',
  'pear', 'peel', 'pile', 'pine', 'pink', 'pipe', 'plan', 'play', 'plum', 'plus', 'poem', 'poet', 'pond',
  'pool', 'port', 'post', 'pull', 'pure', 'push', 'race', 'rail', 'rain', 'rake', 'ramp', 'rank', 'rare',
  'rate', 'read', 'real', 'rest', 'rice', 'rich', 'ride', 'ring', 'rise', 'risk', 'road', 'roar', 'rock',
  'role', 'roll', 'roof', 'room', 'root', 'rope', 'rose', 'rule', 'rush', 'safe', 'sage', 'sail', 'salt',
  'same', 'sand', 'save', 'seat', 'seed', 'seem', 'self', 'sell', 'send', 'ship', 'shop', 'show', 'shut',
  'sick', 'side', 'sign', 'silk', 'sing', 'sink', 'site', 'size', 'skin', 'skip', 'slip', 'slow', 'snow',
  'soap', 'sock', 'soft', 'soil', 'some', 'song', 'soon', 'sort', 'soul', 'soup', 'spin', 'spot', 'star',
  'stay', 'stem', 'step', 'stew', 'stir', 'stop', 'such', 'suit', 'sure', 'swim', 'tail', 'take', 'tale',
  'talk', 'tall', 'tank', 'tape', 'task', 'team', 'tell', 'tent', 'term', 'test', 'text', 'than', 'that',
  'them', 'then', 'they', 'thin', 'this', 'tide', 'tile', 'time', 'tiny', 'tone', 'took', 'tool', 'tour',
  'town', 'trap', 'tray', 'tree', 'trip', 'true', 'tune', 'turn', 'twin', 'type', 'unit', 'upon', 'used',
  'vast', 'very', 'view', 'vine', 'vote', 'wage', 'wait', 'wake', 'walk', 'wall', 'want', 'warm', 'wash',
  'wave', 'weak', 'wear', 'week', 'well', 'west', 'what', 'when', 'wide', 'wild', 'will', 'wind', 'wine',
  'wing', 'wink', 'wire', 'wise', 'wish', 'with', 'wood', 'wool', 'word', 'work', 'worm', 'yard', 'year',
  'your', 'zero', 'zone', 'zoom',
] as const

const MEDIUM = [
  'about', 'above', 'after', 'again', 'album', 'alert', 'alien', 'alone', 'amber', 'angel', 'apple', 'apron',
  'arrow', 'audio', 'awake', 'bacon', 'badge', 'baker', 'banana', 'beach', 'beard', 'begin', 'below', 'bench',
  'berry', 'black', 'blade', 'blank', 'blast', 'blaze', 'blend', 'blind', 'block', 'bloom', 'board', 'bonus',
  'boost', 'bound', 'brain', 'brake', 'brand', 'brass', 'brave', 'bread', 'break', 'brick', 'brief', 'bring',
  'brisk', 'broad', 'brook', 'brown', 'brush', 'build', 'bunch', 'burst', 'cabin', 'cable', 'camel', 'candy',
  'canoe', 'cargo', 'carry', 'carve', 'catch', 'cause', 'cedar', 'chain', 'chair', 'chalk', 'charm', 'chart',
  'chase', 'cheap', 'check', 'cheese', 'chest', 'chief', 'child', 'chili', 'chill', 'chord', 'chunk', 'cider',
  'claim', 'class', 'clean', 'clear', 'clerk', 'click', 'cliff', 'climb', 'clock', 'close', 'cloth', 'cloud',
  'coach', 'coast', 'cocoa', 'color', 'comet', 'coral', 'couch', 'count', 'court', 'cover', 'craft', 'crane',
  'crash', 'crate', 'cream', 'creek', 'crisp', 'cross', 'crowd', 'crown', 'crumb', 'crush', 'cycle', 'daily',
  'dance', 'delta', 'depth', 'diary', 'diner', 'dizzy', 'dodge', 'donut', 'doubt', 'draft', 'drain', 'drama',
  'dream', 'dress', 'drift', 'drink', 'drive', 'eager', 'eagle', 'early', 'earth', 'eight', 'elbow', 'elder',
  'empty', 'enjoy', 'enter', 'entry', 'equal', 'event', 'every', 'exact', 'extra', 'fable', 'fairy', 'faith',
  'fancy', 'feast', 'fence', 'ferry', 'fever', 'field', 'fifth', 'fifty', 'fight', 'final', 'first', 'flame',
  'flash', 'fleet', 'float', 'flock', 'flood', 'floor', 'flour', 'flute', 'focus', 'foggy', 'force', 'forge',
  'found', 'frame', 'fresh', 'front', 'frost', 'fruit', 'funny', 'giant', 'glass', 'gleam', 'glide', 'globe',
  'glory', 'glove', 'grace', 'grade', 'grain', 'grand', 'grape', 'grass', 'gravy', 'great', 'green', 'greet',
  'grill', 'group', 'grove', 'guard', 'guess', 'guest', 'guide', 'guitar', 'habit', 'happy', 'haste', 'haven',
  'heart', 'heavy', 'hedge', 'hello', 'honey', 'honor', 'horse', 'hotel', 'house', 'human', 'humor', 'hurry',
  'image', 'index', 'inner', 'input', 'ivory', 'jelly', 'jewel', 'jolly', 'judge', 'juice', 'jumbo', 'kettle',
  'kneel', 'knife', 'knock', 'label', 'ladle', 'large', 'laser', 'later', 'laugh', 'layer', 'learn', 'lease',
  'leave', 'lemon', 'level', 'light', 'lilac', 'limit', 'linen', 'liver', 'lobby', 'local', 'lodge', 'logic',
  'loose', 'lotus', 'lover', 'lower', 'loyal', 'lucky', 'lunch', 'lyric', 'magic', 'major', 'mango', 'manor',
  'maple', 'march', 'match', 'maybe', 'mayor', 'medal', 'media', 'melon', 'mercy', 'merry', 'metal', 'meter',
  'might', 'minor', 'misty', 'model', 'money', 'month', 'moral', 'motor', 'mount', 'mouse', 'mouth', 'movie',
  'music', 'nerve', 'never', 'night', 'noble', 'noise', 'north', 'novel', 'nurse', 'oasis', 'ocean', 'offer',
  'often', 'olive', 'onion', 'opera', 'orbit', 'order', 'other', 'otter', 'outer', 'owner', 'paint', 'panel',
  'paper', 'party', 'pasta', 'paste', 'patch', 'pause', 'peace', 'peach', 'pearl', 'pedal', 'penny', 'pepper',
  'perch', 'petal', 'phase', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pitch', 'pixel', 'place', 'plain',
  'plane', 'plant', 'plate', 'plaza', 'pluck', 'plush', 'point', 'polar', 'porch', 'pound', 'power', 'press',
  'price', 'pride', 'prime', 'print', 'prize', 'proof', 'proud', 'prove', 'pulse', 'punch', 'pupil', 'purse',
  'queen', 'quest', 'quick', 'quiet', 'quilt', 'quite', 'quote', 'radio', 'rainy', 'raise', 'rally', 'ranch',
  'range', 'rapid', 'reach', 'ready', 'realm', 'relax', 'reply', 'rider', 'ridge', 'right', 'river', 'roast',
  'robot', 'rocky', 'rough', 'round', 'route', 'royal', 'ruler', 'rural', 'salad', 'salsa', 'sandy', 'sauce',
  'scale', 'scare', 'scene', 'scent', 'scoop', 'scope', 'score', 'scout', 'serve', 'seven', 'shade', 'shady',
  'shake', 'shame', 'shape', 'share', 'shark', 'sharp', 'sheep', 'sheet', 'shelf', 'shell', 'shift', 'shine',
  'shirt', 'shock', 'shore', 'short', 'shout', 'sight', 'silly', 'since', 'sixth', 'sixty', 'skate', 'skill',
  'skirt', 'skull', 'slate', 'sleep', 'slice', 'slide', 'slope', 'small', 'smart', 'smell', 'smile', 'smoke',
  'snack', 'snail', 'snake', 'sneak', 'solar', 'solid', 'solve', 'sorry', 'sound', 'south', 'space', 'spade',
  'spare', 'spark', 'speak', 'speed', 'spell', 'spice', 'spicy', 'spike', 'spine', 'spoil', 'spoke', 'spoon',
  'sport', 'spray', 'stack', 'staff', 'stage', 'stain', 'stair', 'stake', 'stall', 'stamp', 'stand', 'stare',
  'start', 'state', 'steam', 'steel', 'steep', 'steer', 'stick', 'still', 'stock', 'stone', 'stool', 'store',
  'storm', 'story', 'stove', 'straw', 'stray', 'strip', 'study', 'stuff', 'style', 'sugar', 'sunny', 'super',
  'surge', 'swamp', 'swear', 'sweat', 'sweet', 'swift', 'swing', 'sword', 'table', 'taste', 'teach', 'tempo',
  'thank', 'their', 'theme', 'there', 'thick', 'thief', 'thing', 'think', 'third', 'those', 'three', 'threw',
  'throw', 'thumb', 'tiger', 'tight', 'timer', 'title', 'toast', 'today', 'token', 'tooth', 'topic', 'torch',
  'total', 'touch', 'tough', 'towel', 'tower', 'trace', 'track', 'trade', 'trail', 'train', 'tramp', 'trash',
  'treat', 'trend', 'trial', 'tribe', 'trick', 'trout', 'truck', 'truly', 'trunk', 'trust', 'truth', 'tulip',
  'twice', 'twist', 'uncle', 'under', 'union', 'unite', 'until', 'upper', 'upset', 'urban', 'usual', 'valid',
  'value', 'vault', 'verse', 'video', 'vigor', 'villa', 'vinyl', 'viola', 'visit', 'vital', 'vivid', 'vocal',
  'voice', 'wagon', 'waist', 'watch', 'water', 'weave', 'wedge', 'whale', 'wheat', 'wheel', 'where', 'which',
  'while', 'whisk', 'white', 'whole', 'whose', 'widow', 'width', 'windy', 'woman', 'world', 'worry', 'worth',
  'would', 'wound', 'wrist', 'write', 'wrong', 'yacht', 'yeast', 'young', 'youth', 'zebra',
] as const

const HARD = [
  'absolute', 'accident', 'accuracy', 'acoustic', 'activity', 'adventure', 'alphabet', 'altitude', 'ambition',
  'ancestor', 'anything', 'approach', 'aquarium', 'architect', 'argument', 'asteroid', 'audience', 'backpack',
  'baseball', 'basement', 'beautiful', 'beginner', 'behavior', 'birthday', 'blizzard', 'bookshelf', 'boundary',
  'bracelet', 'breakfast', 'briefcase', 'broccoli', 'building', 'bulletin', 'butterfly', 'calendar', 'campfire',
  'candidate', 'capacity', 'carnival', 'carpenter', 'carriage', 'category', 'celebrate', 'champion', 'charcoal',
  'chemical', 'chestnut', 'children', 'chocolate', 'circular', 'classroom', 'complete', 'computer', 'concrete',
  'conflict', 'constant', 'continue', 'contract', 'contrast', 'convince', 'cookbook', 'corridor', 'coverage',
  'creative', 'creature', 'critical', 'crocodile', 'crossword', 'customer', 'darkness', 'daughter', 'daylight',
  'deadline', 'decision', 'decorate', 'definite', 'delicate', 'delivery', 'describe', 'designer', 'detective',
  'dictionary', 'difference', 'difficult', 'dinosaur', 'direction', 'discover', 'distance', 'document', 'domestic',
  'donation', 'dramatic', 'dragonfly', 'duration', 'earliest', 'electric', 'elephant', 'elevator', 'emphasis',
  'employee', 'enormous', 'entrance', 'envelope', 'estimate', 'evidence', 'exchange', 'exciting', 'exercise',
  'explorer', 'fabulous', 'familiar', 'favorite', 'festival', 'fingerprint', 'fireplace', 'firework', 'flamingo',
  'flexible', 'floating', 'football', 'forecast', 'fountain', 'fraction', 'frequent', 'friendly', 'frontier',
  'function', 'furniture', 'generous', 'geometry', 'gigantic', 'glorious', 'goldfish', 'gorgeous', 'governor',
  'graceful', 'graduate', 'guardian', 'guidance', 'handmade', 'handsome', 'headache', 'headline', 'hedgehog',
  'heritage', 'hesitate', 'honeybee', 'hospital', 'household', 'hurricane', 'hydrogen', 'identify', 'increase',
  'industry', 'infinite', 'innocent', 'interest', 'internet', 'inventor', 'jellyfish', 'judgment', 'kangaroo',
  'keyboard', 'knitting', 'knowledge', 'language', 'laughter', 'lavender', 'lightning', 'literary', 'location',
  'magazine', 'magnetic', 'maintain', 'majority', 'marathon', 'material', 'medicine', 'merchant', 'midnight',
  'military', 'minister', 'mischief', 'moderate', 'mountain', 'movement', 'multiple', 'mushroom', 'musician',
  'navigate', 'necklace', 'negative', 'neighbor', 'notebook', 'novelist', 'nutrient', 'occasion', 'official',
  'opposite', 'ordinary', 'organize', 'ornament', 'overcome', 'overflow', 'overhead', 'overlook', 'overseas',
  'panorama', 'paragraph', 'parallel', 'passport', 'password', 'patience', 'peaceful', 'peculiar', 'personal',
  'physical', 'pineapple', 'platform', 'pleasant', 'portrait', 'position', 'positive', 'possible', 'postcard',
  'practice', 'precious', 'preserve', 'president', 'pressure', 'previous', 'priority', 'progress', 'purchase',
  'quantity', 'question', 'railroad', 'reaction', 'rectangle', 'relation', 'reliable', 'remember', 'requested',
  'required', 'research', 'resident', 'resolved', 'respected', 'response', 'restaurant', 'roadside', 'romantic',
  'sandwich', 'satellite', 'scissors', 'scramble', 'sentence', 'separate', 'sequence', 'shoulder', 'skyscraper',
  'slightly', 'somebody', 'something', 'sometime', 'somewhere', 'specific', 'splendid', 'sprinkle', 'squirrel',
  'standard', 'starfish', 'straight', 'stranger', 'strategy', 'strawberry', 'strength', 'struggle', 'sunflower',
  'sunshine', 'surprise', 'surround', 'telescope', 'terrible', 'territory', 'textbook', 'threaten', 'together',
  'tomorrow', 'tortoise', 'tradition', 'transfer', 'transform', 'translate', 'treasure', 'triangle', 'tropical',
  'ultimate', 'umbrella', 'universe', 'upstairs', 'vacation', 'vegetable', 'vertical', 'volunteer', 'wilderness',
  'woodland', 'yesterday', 'orchestra', 'waterfall', 'lighthouse', 'cinnamon', 'discovery', 'typewriter',
  'astronaut', 'blueberry', 'greenhouse', 'crosswalk', 'snowflake', 'moonlight', 'starlight', 'coastline',
  'riverbank', 'suitcase', 'fireworks', 'courtyard', 'handwriting', 'screwdriver', 'toothbrush', 'watermelon',
  'blackberry', 'peppermint', 'gingerbread', 'marshmallow', 'cheesecake', 'underground', 'thunderstorm',
  'grasshopper', 'caterpillar', 'hummingbird', 'woodpecker', 'chandelier', 'microscope', 'laboratory',
  'experiment', 'hypothesis', 'calculus', 'vocabulary', 'adjective', 'consonant', 'syllable', 'spelling',
  'photograph', 'basketball', 'campground', 'constantly', 'whirlwind', 'notebooks',
] as const

const SENTENCES = [
  'The night market smells like grilled corn and sweet tea.',
  'A quiet library is a good place to practice long words.',
  'She keeps a spare key under the blue flower pot.',
  'Rain tapped the window while the kettle began to sing.',
  'Please bring your notebook, a pencil, and a calm mind.',
  'The old bridge creaks when the evening train rolls by.',
  'His dog learned to wait at the corner without barking.',
  'We crossed the river before the fog covered the path.',
  'A fresh pot of ginger tea can warm a cold afternoon.',
  'The pianist paused, smiled, and started the next piece.',
  'Keep your wrists loose and your eyes on the next word.',
  'Stars came out over the harbor as the boats returned.',
  'I wrote the address twice so the letter would not wander.',
  'The bakery opens early, and the first loaf sells fast.',
  'Children counted fireflies along the edge of the field.',
  'This keyboard clicks softly, which makes late work easier.',
  'After the storm, the street shone like a dark mirror.',
  'He folded the map, checked the trail, and kept walking.',
  'Orange leaves gathered in the courtyard overnight.',
  'Tell the truth quickly, then stay to hear the answer.',
  'The courier climbed three flights with a careful package.',
  'Our class planted basil, mint, and a stubborn tomato vine.',
  'When the signal turns green, look both ways anyway.',
  'A good sentence has a clear subject and a lively verb.',
  'Midnight noodles taste better when shared with a friend.',
  'The lighthouse kept its slow blink over the black water.',
  'She typed the whole paragraph without looking down once.',
  'A paper crane sat on the desk beside a chipped cup.',
  'They packed sandwiches, apples, and a folded city map.',
  'Winter light came through the curtains in pale stripes.',
  'The violin student repeated the hard measure patiently.',
  "Please don't rush the commas, they belong in the sentence.",
  'His uncle repairs bicycles in a lane behind the market.',
  'We found a smooth stone and skipped it four times.',
  'The recipe calls for butter, salt, and a little honey.',
  'Clouds moved fast, but the afternoon stayed warm.',
  'A red umbrella leaned against the bookstore door.',
  'The team practiced until the streetlights flickered on.',
  'Write the word, read it back, and then trust your fingers.',
  'Small habits, repeated daily, become a quiet kind of skill.',
] as const

function rngIndex(rng: () => number, length: number): number {
  return Math.floor(rng() * length)
}

export function wordsFor(difficulty: Difficulty): readonly string[] {
  if (difficulty === 'easy') return EASY
  if (difficulty === 'medium') return MEDIUM
  return HARD
}

export function pickWord(bank: readonly string[], rng: () => number, avoid: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    const word = bank[rngIndex(rng, bank.length)] ?? bank[0] ?? 'word'
    if (!avoid.has(word)) return word
  }
  return bank[rngIndex(rng, bank.length)] ?? 'word'
}

export function passageFor(
  script: Script,
  difficulty: Difficulty,
  rng: () => number = Math.random,
  minChars = 900,
): string {
  if (script === 'zh') return buildZhPassage(difficulty, rng, minChars)
  return buildPassage(difficulty, rng, minChars)
}

export function buildPassage(difficulty: Difficulty, rng: () => number = Math.random, minChars = 900): string {
  if (difficulty === 'hard') {
    const bag = SENTENCES.slice()
    let cursor = bag.length
    let out = ''
    while (out.length < minChars) {
      if (cursor >= bag.length) {
        cursor = 0
        for (let i = bag.length - 1; i > 0; i--) {
          const j = rngIndex(rng, i + 1)
          const swap = bag[i]!
          bag[i] = bag[j]!
          bag[j] = swap
        }
      }
      const sentence = bag[cursor] ?? SENTENCES[0]
      cursor++
      out = out ? `${out} ${sentence}` : sentence
    }
    return out
  }

  const bank = wordsFor(difficulty)
  let out = ''
  while (out.length < minChars) {
    const word = bank[rngIndex(rng, bank.length)] ?? 'word'
    out = out ? `${out} ${word}` : word
  }
  return out
}

export function auditLexicon(): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  const check = (label: string, words: readonly string[], pattern: RegExp) => {
    for (const word of words) {
      if (!pattern.test(word)) problems.push(`${label}:${word}`)
      const key = `${label}:${word}`
      if (seen.has(key)) problems.push(`dup:${key}`)
      seen.add(key)
    }
  }
  check('easy', EASY, /^[a-z]{3,4}$/)
  check('medium', MEDIUM, /^[a-z]{5,7}$/)
  check('hard', HARD, /^[a-z]{8,12}$/)
  for (const sentence of SENTENCES) {
    if (!/^[A-Za-z ,.'-]+$/.test(sentence) || !sentence.endsWith('.') || sentence.includes('  ')) {
      problems.push(`sentence:${sentence}`)
    }
    if (sentence.length < 24) problems.push(`short:${sentence}`)
  }
  return problems
}
