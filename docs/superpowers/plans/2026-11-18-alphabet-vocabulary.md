# Alphabet Vocabulary Implementation Plan

> **For agentic workers:** Execute inline in the current checkout. Track the steps below.

**Goal:** Show all four supplied picture words for each letter A–V on the Oxford Phonics Level 1 detail screen, with vocabulary stored in JSON.

**Architecture:** Import grouped JSON vocabulary into the existing lesson-content module. Keep its first-word alphabet interface compatible with the mini game; expose each letter's full words list to the detail screen and pronunciation allowlist.

**Tech Stack:** Next.js 16.4.6, React 19, TypeScript, CSS modules, local PNG assets.

**Spec:** User request in this chat: four words per supplied letter, JSON fields for letter, word, meaning, image, and other learning metadata.

## Global Constraints

- Use the existing 88 images in public/images/alphabet, without renaming them.
- Include English word, Vietnamese meaning, phonetic transcription, image URL, and emoji fallback in JSON.
- Retain the existing W–Z entries until their pictures are supplied.
- Preserve letter navigation, game compatibility, locale switching, and normal/slow pronunciation.
- Work in the current checkout; leave changes uncommitted for review.

## Review Focus

- Each supplied image belongs to exactly one word and resolves to a real local file.
- Changing letters resets the selected word, including transitions from four-word to one-word letters.
- All four words remain selectable on small screens.
- Pronunciation accepts the new words and continues to reject unrelated text.
- Multiword vocabulary uses the exact filename, especially hot_dog.png.

### Task 1: JSON vocabulary and detail selection

**Files:** Create alphabet.json; modify lesson-content.ts, level-detail.tsx, level-detail.module.css, and app/api/tts/route.ts.

- [x] Read the installed Next.js image and client component documentation.
- [x] Store A–V vocabulary as four words per letter and retain W–Z fallback entries.
- [x] Import JSON into the shared lesson module and expand the TTS allowlist to every word.
- [x] Add four picture word buttons, active-word state, a word counter, and image rendering to the detail screen.
- [x] Check JSON completeness, exact asset coverage, unique words, and nonempty metadata using Node assertions.
- [x] Run ESLint and production build; inspect desktop/mobile behavior where browser access is available.
- [x] Review the final diff and record verification results.

## Verification results

- Node assertions passed: 26 ordered letters, 92 unique words, all 88 supplied images used exactly once, complete metadata, and correct Hot dog filename.
- All 78 mini-game letter/round combinations retained three distinct choices and exactly one correct answer.
- `npm run lint`, `npm run build`, and `git diff --check` passed. Build required execution outside the filesystem sandbox to write generated output.
- Chrome: selected Ax (word 4/4), switched to Watch (word 1/1), selected Hot dog, and switched locale to English successfully.
- Responsive check: at a 390px viewport, the document content and scroll widths were both 375px; all four word buttons fit in two columns and no loaded image was broken.
- HTTP: detail page returned 200; Ax, Hot dog, and Apple passed the pronunciation allowlist, while unrelated text returned 400.
- Initial audio check returned 503 because `.venv/Scripts/python.exe` did not exist. Resolved in the follow-up setup: created `.venv` with Python 3.13, installed `requirements.txt` (`edge-tts==7.3.1`), and verified `pip check` passed. Live `/api/tts` calls for Apple, Ax, and Hot dog each returned HTTP 200 with nonempty `audio/mpeg`; unrelated text still returned 400. The temporary verification server was stopped afterward.
- Independent read-only code review reported no actionable findings.
