const iconPaths = {
  logout: "M9 4H4v16h5m5-13 5 5-5 5m-6-5h13",
  person: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2",
  account_circle: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 19a7 7 0 0 1 14 0",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 5v2",
  key: "M10 8a5 5 0 1 1-7 7 5 5 0 0 1 7-7Zm0 7 10-10m-3 3 3 3m-6 0 3 3",
  visibility: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  visibility_off: "m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a20 20 0 0 1-3 3.9M6.1 6.1A20 20 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.9-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2",
};

export function Icon({ name }: { name: string }) {
  if (Object.hasOwn(iconPaths, name)) {
    return (
      <svg className="material-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={iconPaths[name as keyof typeof iconPaths]} />
      </svg>
    );
  }

  return <span className="material-icon" aria-hidden="true">{name}</span>;
}
