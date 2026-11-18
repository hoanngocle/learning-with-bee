import vocabulary from "./alphabet.json";

type Vocabulary = {
  word: string;
  emoji: string;
  meaning: string;
};

export const alphabet = vocabulary.map(({ letter, words }) => ({
  letter,
  ...words[0],
  words,
}));

export const questionCount = 3;

export function getQuestion(letterIndex: number, round: number) {
  const index = (letterIndex + round) % alphabet.length;
  const target = alphabet[index];
  const next = alphabet[(index + 1) % alphabet.length];
  const afterNext = alphabet[(index + 2) % alphabet.length];
  if (index === 0) {
    const banana = { word: "Banana", emoji: "🍌", meaning: "Quả chuối" };
    return { target, options: [banana, target, afterNext] };
  }

  const options: Vocabulary[] = [next, afterNext];
  options.splice((index + 1) % questionCount, 0, target);
  return { target, options };
}

export const lessonContent = {
  vi: {
    breadcrumb: "Đường dẫn",
    progress: (count: number) => `Bé Ong chăm chỉ: Đã khám phá ${count}/26 chữ cái!`,
    intro: "Chọn một chữ cái để nghe và xem từ vựng.",
    vocabulary: "Học từ vựng",
    letter: "Chữ cái",
    wordsForLetter: (letter: string) => `Từ vựng chữ ${letter}`,
    wordProgress: (current: number, total: number) => `Từ ${current} / ${total}`,
    tap: "Chạm vào hình để nghe tiếng Anh",
    meaning: "Ý nghĩa",
    listen: "Nghe phát âm",
    slow: "Đọc chậm",
    previous: "Chữ trước",
    next: "Chữ tiếp",
    audioLoading: "Đang tải giọng đọc…",
    audioUnavailable: "Chưa phát được. Bấm nút nghe để thử lại.",
    game: "Mini game chữ cái",
    reward: "+10 Điểm Sao ⭐",
    question: "Câu",
    gameCaption: "Luyện phản xạ nghe và nhận diện từ",
    gameIntro: "Bé hãy nhìn hình và nhấn vào ô đúng nhé!",
    hearQuestion: "Nghe câu hỏi",
    correct: "Đúng rồi! Bé giỏi quá! Hoan hô! 🎉",
    retry: "Bé thử nghe lại và chọn lần nữa nhé!",
    celebration: "Kuromi và Ong Vàng tặng bé 1 ngôi sao chăm chỉ! ⭐",
    replay: "Chơi lại",
    nextQuestion: "Câu hỏi tiếp theo",
    newRound: "Chơi lượt mới",
  },
  en: {
    breadcrumb: "Breadcrumb",
    progress: (count: number) => `Busy Bee: ${count}/26 letters explored!`,
    intro: "Pick a letter to hear it and explore its word.",
    vocabulary: "Time to learn",
    letter: "Letter",
    wordsForLetter: (letter: string) => `Words for letter ${letter}`,
    wordProgress: (current: number, total: number) => `Word ${current} / ${total}`,
    tap: "Tap the picture to hear the word",
    meaning: "Vietnamese",
    listen: "Listen",
    slow: "Listen slowly",
    previous: "Previous letter",
    next: "Next letter",
    audioLoading: "Loading pronunciation…",
    audioUnavailable: "Audio couldn’t play. Tap the listen button to try again.",
    game: "Alphabet mini game",
    reward: "+10 Star Points ⭐",
    question: "Question",
    gameCaption: "Listen and recognize words",
    gameIntro: "Look at the pictures and choose the right one!",
    hearQuestion: "Listen to the question",
    correct: "That’s right! Great job! 🎉",
    retry: "Listen again and give it another try!",
    celebration: "Kuromi and Busy Bee give you a star! ⭐",
    replay: "Play again",
    nextQuestion: "Next question",
    newRound: "Start a new round",
  },
};
