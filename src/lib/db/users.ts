import { User } from "./index";

/**
 * Find or create a user keyed on googleId (providerAccountId).
 * Returns null if the email already belongs to a different Google account
 * (potential account takeover attempt — caller should refuse sign-in).
 */
export async function upsertUserByGoogle(data: {
  email: string;
  name?: string | null;
  image?: string | null;
  googleId: string;
}): Promise<User | null> {
  // Primary key: googleId
  let user = await User.findOne({ where: { googleId: data.googleId } });
  if (user) {
    await user.update({ email: data.email, name: data.name ?? null, image: data.image ?? null });
    return user;
  }

  // Fall back to email lookup for first-time link
  user = await User.findOne({ where: { email: data.email } });
  if (user) {
    // Email exists but a *different* Google account owns it — refuse
    if (user.googleId && user.googleId !== data.googleId) return null;
    await user.update({ googleId: data.googleId, name: data.name ?? null, image: data.image ?? null });
    return user;
  }

  return User.create({
    email: data.email,
    name: data.name ?? null,
    image: data.image ?? null,
    googleId: data.googleId,
  });
}
