import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { eq } from "drizzle-orm";

import { db, google, lucia } from "@/app/authentication/auth";
import { userTable } from "@/app/authentication/database";

interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

async function validateOAuthRequest(
  request: Request
): Promise<{ code: string; codeVerifier: string } | null> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("google_oauth_state")?.value ?? null;
  const codeVerifier = cookies().get("code_verifier")?.value ?? null;

  console.log(`Code: ${code}, State: ${state}, Stored State: ${storedState}`);

  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState ||
    !codeVerifier
  ) {
    console.log("Invalid code, state, or stored state");
    return null;
  }

  return { code, codeVerifier };
}

async function getGoogleUserData(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return await response.json();
}

async function findOrCreateUser(googleUser: GoogleUser): Promise<string> {
  const existingUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.googleId, googleUser.sub))
    .limit(1)
    .execute();

  if (existingUser.length > 0) {
    console.log("Existing user found");
    return existingUser[0].id;
  }

  console.log("Creating new user");
  const userId = generateId(15);
  await db
    .insert(userTable)
    .values({
      id: userId,
      googleId: googleUser.sub,
      email: googleUser.email,
      profileImageUrl: googleUser.picture,
    })
    .execute();
  console.log(`New user created with ID: ${userId}`);
  return userId;
}

async function createSessionAndSetCookie(userId: string): Promise<void> {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  console.log("Session created and cookie set");
}

function createSuccessResponse(): Response {
  return new Response(
    `
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(
              { type: "GOOGLE_LOGIN_COMPLETE", success: true },
              window.location.origin
            );
          }
          window.close();
        </script>
      </body>
    </html>
    `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}

export async function GET(request: Request): Promise<Response> {
  console.log("Starting GET function");

  const validationResult = await validateOAuthRequest(request);
  if (!validationResult) {
    return new Response(null, { status: 400 });
  }

  const { code, codeVerifier } = validationResult;

  try {
    console.log("Validating authorization code");
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    console.log("Authorization code validated successfully");

    console.log("Fetching Google user data");
    const googleUser = await getGoogleUserData(tokens.accessToken);
    console.log("googleUser = ", googleUser);

    const userId = await findOrCreateUser(googleUser);
    await createSessionAndSetCookie(userId);

    return createSuccessResponse();
  } catch (e) {
    console.error("Error occurred:", e);
    if (
      e instanceof OAuth2RequestError &&
      e.message === "bad_verification_code"
    ) {
      console.log("Bad verification code error");
      return new Response(null, { status: 400 });
    }
    console.log("Unknown error, returning 500");
    return new Response(null, { status: 500 });
  }
}
