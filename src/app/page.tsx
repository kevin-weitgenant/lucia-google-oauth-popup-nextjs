
import { cookies } from "next/headers";
import { validateRequest, lucia } from "./authentication/auth";
import PopupLauncher from "./PopupLauncher";


export default async function Page() {
  const { user } = await validateRequest();

  console.log("User object:", user);
  console.log("Profile Image URL:", user?.profileImageUrl);

  if (!user) {
    return (
      <div>
        <h1>Welcome</h1>
        <PopupLauncher />
      </div>
    );
  }

  return (
    <>
      <h1>Hi, {user.email}!</h1>
      <p>Your user ID is {user.id}.</p>
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt="Profile picture"
          width={50}
          height={50}
          style={{ borderRadius: '50%' }}
        />
      ) : (
        <p>No profile image available</p>
      )}
      <p>Google ID: {user.googleId}</p>
      <form action={logout}>
        <button>Sign out</button>
      </form>
    </>
  );
}

async function logout(): Promise<ActionResult> {
  "use server";
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return {
    error: null,
  };
}

interface ActionResult {
  error: string | null;
}
