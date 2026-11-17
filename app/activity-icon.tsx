import { Icon } from "./material-icon";
import { SelectionIcon } from "./oxford-phonics-world/selection-icon";

const activityPaths = {
  auto_fix_high: "m4 20 11-11 3 3L7 23zM15 4h6m-3-3v6M3 6h6M6 3v6",
  casino: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2.5 4.5h.01m9 0h.01m-4.5 4.5h.01m-4.5 4.5h.01m9 0h.01",
  check_circle: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM7.5 12l3 3 6-6",
  emoji_events: "M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4m-5 4v5m-4 1h8",
  inventory_2: "M3 4h18v4H3zM5 8v12h14V8m-9 4h4",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5",
  lightbulb: "M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9l-1-2Z",
  military_tech: "M7 3h10v6l-5 3-5-3V3Zm5 9 1.55 3.15 3.45.5-2.5 2.45.59 3.44L12 19.91l-3.09 1.63.59-3.44L7 15.65l3.45-.5L12 12Z",
  record_voice_over: "M13.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM3 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2H3Zm15-14a5 5 0 0 1 0 7m2-9a8 8 0 0 1 0 11",
  replay: "M3 5v5h5m-5 0a9 9 0 1 1 1 8",
  restaurant: "M4 3v6a3 3 0 0 0 6 0V3M7 3v18m11 0V3c-3 2-4 5-4 9h4",
  rocket_launch: "M14 6c2-2 5-3 8-3 0 3-1 6-3 8l-6 6-5-5 6-6Zm-4 4H6l-4 4 6 1m6 1 1 6 4-4v-4M7 18l-4 4m14-13h.01",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  stars: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-10-5 1.5 3 3.5.5-2.5 2.4.6 3.5-3.1-1.65-3.1 1.65.6-3.5L7 10.5l3.5-.5L12 7Z",
  task_alt: "M21.7 10a10 10 0 1 1-4.1-6M8 11l4 4 9-10",
  timer: "M15 2H9m3 8v4m6-8 2-2m1 9a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  touch_app: "M8 13V5a2 2 0 0 1 4 0v7l5 1a3 3 0 0 1 2 3l-1 5h-7l-6-6a2 2 0 0 1 3-2Z",
  verified: "m12 2 3 2 4 .5.5 4L22 12l-2.5 3.5-.5 4-4 .5-3 2-3-2-4-.5-.5-4L2 12l2.5-3.5.5-4 4-.5 3-2Zm-4 10 2.5 2.5L16 9",
  videogame_asset: "M7 6h10c3 0 4 3 4 6l1 3c1 3-2 4-4 2l-2-2H8l-2 2c-2 2-5 1-4-2l1-3c0-3 1-6 4-6Zm0 3v5M4.5 11.5h5M15 10h.01M18 12h.01",
  volume_up: "M3 9h4l5-4v14l-5-4H3V9Zm13-1a6 6 0 0 1 0 8m2-10a9 9 0 0 1 0 12",
};

type SharedIcon = "arrow_forward" | "emoji_nature";
type LessonIcon = "arrow_back" | "auto_awesome" | "flag" | "lock_open" | "menu_book";

export function ActivityIcon({ name }: { name: SharedIcon | LessonIcon | keyof typeof activityPaths }) {
  switch (name) {
    case "arrow_forward":
    case "emoji_nature":
      return <Icon name={name} />;
    case "arrow_back":
    case "auto_awesome":
    case "flag":
    case "lock_open":
    case "menu_book":
      return <span className="material-icon" aria-hidden="true"><SelectionIcon name={name} size={16} /></span>;
    default:
      return (
        <svg className="material-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d={activityPaths[name]} />
        </svg>
      );
  }
}
