import { phonicsPath } from "../home-content";

export const alphabetPath = `${phonicsPath}/level-1`;

export const levels = [
  {
    number: 1,
    title: "The Alphabet",
    emoji: "🔤",
    cards: 32,
    vi: ["Chữ cái A - Z", "Làm quen bảng chữ cái & 26 âm cơ bản"],
    en: ["Letters A–Z", "Meet the alphabet and its 26 basic sounds"],
  },
  {
    number: 2,
    title: "Short Vowels",
    emoji: "🐱",
    cards: 35,
    vi: ["Nguyên âm ngắn", "Nguyên âm ngắn: a, e, i, o, u & ghép vần"],
    en: ["Short vowel sounds", "Short a, e, i, o, u and blending"],
  },
  {
    number: 3,
    title: "Long Vowels",
    emoji: "🍰",
    cards: 38,
    vi: ["Nguyên âm dài", "Quy tắc âm dài ma thuật: a_e, i_e, ee, oa"],
    en: ["Long vowel sounds", "Long vowel patterns: a_e, i_e, ee, oa"],
  },
  {
    number: 4,
    title: "Consonant Blends",
    emoji: "🚂",
    cards: 40,
    vi: ["Phụ âm ghép", "Học phụ âm đôi: bl, cl, fl, tr, st, sh, ch"],
    en: ["Consonant pairs", "Practice bl, cl, fl, tr, st, sh, ch"],
  },
  {
    number: 5,
    title: "Combinations",
    emoji: "🦆",
    cards: 42,
    vi: ["Tổ hợp âm nâng cao", "Tổ hợp âm đôi & đọc truyện nâng cao"],
    en: ["Advanced sound combinations", "Combine sounds and read longer stories"],
  },
] as const;

export const levelContent = {
  vi: {
    back: "Quay lại Trang chủ",
    breadcrumb: "Đường dẫn",
    levelCount: "5 Cấp độ bài học",
    badge: "Lộ trình Oxford Phonics World",
    title: "Chọn Level học tiếng Anh của bé",
    intro: "Chương trình phát âm chuẩn quốc tế gồm 5 cấp độ thú vị, giúp bé làm quen bảng chữ cái và tự tin đọc sách tiếng Anh!",
    current: "Đang học",
    locked: "Đã khóa",
    lessons: "8 bài học",
    flashcards: "thẻ từ",
    start: "Vào học ngay",
    unlock: "Mở khóa bài",
    ready: "Bé đã sẵn sàng khám phá cùng bạn Ong Vàng chưa?",
    encouragement: "Mỗi ngày hoàn thành 1 bài học chỉ mất 10 phút để nhận huy hiệu ngôi sao!",
    resume: "Tiếp tục bài đang học",
  },
  en: {
    back: "Back to Home",
    breadcrumb: "Breadcrumb",
    levelCount: "5 Learning Levels",
    badge: "Oxford Phonics World Roadmap",
    title: "Choose Your English Level",
    intro: "Explore five fun phonics levels, get to know the alphabet, and build confidence reading in English!",
    current: "In progress",
    locked: "Locked",
    lessons: "8 lessons",
    flashcards: "flashcards",
    start: "Start learning",
    unlock: "Unlock level",
    ready: "Ready to explore with Busy Bee?",
    encouragement: "Finish a 10-minute lesson each day to earn a star badge!",
    resume: "Continue learning",
  },
};
