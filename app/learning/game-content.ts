export const scrambleWords = [
  { word: "BREAKFAST", meaning: "Bữa ăn sáng đầy năng lượng", icon: "🍽️", letters: "TERSKABFA" },
  { word: "PANCAKE", meaning: "Bánh xèo ngọt", icon: "🥞", letters: "AKEPNAC" },
  { word: "MILK", meaning: "Sữa tươi ngon", icon: "🥛", letters: "LKMI" },
  { word: "EGG", meaning: "Trứng ốp la", icon: "🍳", letters: "GEG" },
  { word: "TOAST", meaning: "Bánh mì nướng", icon: "🍞", letters: "STOAT" },
  { word: "APPLE", meaning: "Quả táo", icon: "🍎", letters: "PPAEL" },
  { word: "JUICE", meaning: "Nước ép trái cây", icon: "🧃", letters: "ECUJI" },
  { word: "BANANA", meaning: "Quả chuối", icon: "🍌", letters: "ANABNA" },
];

export const boxPictures = [
  { id: "milk", label: "Milk", caption: "Một cốc sữa tươi", hint: "Tìm chiếc cốc có thức uống màu trắng nhé!" },
  { id: "water", label: "Water", caption: "Một ly nước lọc", hint: "Thức uống trong suốt này giúp bé hết khát." },
  { id: "egg", label: "Egg", caption: "Một quả trứng chiên", hint: 'Từ "egg" bắt đầu bằng âm /e/. Bé tìm món có lòng đỏ tròn xoe nhé!' },
  { id: "juice", label: "Juice", caption: "Một ly nước cam", hint: "Tìm thức uống màu cam được ép từ trái cây nhé!" },
] as const;

export const mysteryBoxes = [
  { answer: "milk", sentence: "It's milk.", translation: "Đó là sữa.", color: "blue" },
  { answer: "water", sentence: "It's water.", translation: "Đó là nước lọc.", color: "pink" },
  { answer: "juice", sentence: "It's juice.", translation: "Đó là nước ép.", color: "gold" },
  { answer: "egg", sentence: "I see an egg.", translation: "Bé nhìn thấy một quả trứng.", color: "green" },
  { answer: "milk", sentence: "I drink milk.", translation: "Bé uống sữa.", color: "purple" },
  { answer: "water", sentence: "I drink water.", translation: "Bé uống nước lọc.", color: "navy" },
  { answer: "egg", sentence: "It's an egg.", translation: "Đó là một quả trứng.", color: "mint" },
  { answer: "juice", sentence: "It's orange juice.", translation: "Đó là nước cam.", color: "orange" },
  { answer: "water", sentence: "A glass of water.", translation: "Một ly nước lọc.", color: "purple" },
  { answer: "milk", sentence: "A glass of milk.", translation: "Một ly sữa.", color: "cyan" },
  { answer: "egg", sentence: "A fried egg.", translation: "Một quả trứng chiên.", color: "pink" },
  { answer: "juice", sentence: "I like orange juice.", translation: "Bé thích nước cam.", color: "gold" },
] as const;
