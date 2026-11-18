import { getDisplayName } from "./login/session";
import { AccountButton } from "./site-shell";

export async function AccountControls() {
  const displayName = await getDisplayName();
  return <AccountButton signedIn={displayName !== null} />;
}
