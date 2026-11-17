const paths = {
  arrow_back: "m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8Z",
  auto_awesome: "m19 2 1.3 3.7L24 7l-3.7 1.3L19 12l-1.3-3.7L14 7l3.7-1.3L19 2ZM9 5l2.2 5.8L17 13l-5.8 2.2L9 21l-2.2-5.8L1 13l5.8-2.2L9 5Zm10 9 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z",
  flag: "M5 21V4h10l.4 2H21v11h-7l-.4-2H7v6H5Zm2-8h8.2l.4 2H19V8h-5.2l-.4-2H7v7Z",
  lock: "M6 22a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6Zm0-2h12V10H6v10Zm6-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 8h6V6a3 3 0 1 0-6 0v2Z",
  lock_open: "M6 22a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0h-2a3 3 0 1 0-6 0v2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6Zm0-2h12V10H6v10Zm6-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  menu_book: "M2 4a10 10 0 0 1 10 1 10 10 0 0 1 10-1v15a10 10 0 0 0-10 1 10 10 0 0 0-10-1V4Zm2 1.5v11a11 11 0 0 1 7 1V6.7a8.5 8.5 0 0 0-7-1.2Zm16 0a8.5 8.5 0 0 0-7 1.2v10.8a11 11 0 0 1 7-1v-11ZM5 8h4v1H5V8Zm0 3h4v1H5v-1Zm0 3h4v1H5v-1Zm10-6h4v1h-4V8Zm0 3h4v1h-4v-1Zm0 3h4v1h-4v-1Z",
  play_circle: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-2 3.5v9l6-4.5-6-4.5Z",
};

export function SelectionIcon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={paths[name]} fillRule="evenodd" />
    </svg>
  );
}
