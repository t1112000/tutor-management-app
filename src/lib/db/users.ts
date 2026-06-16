import { User } from "./index";

export async function upsertUserByEmail(data: {
  email: string;
  name?: string | null;
  image?: string | null;
  googleId?: string | null;
}): Promise<User> {
  const [user] = await User.upsert(
    {
      email: data.email,
      name: data.name ?? null,
      image: data.image ?? null,
      googleId: data.googleId ?? null,
    },
    { conflictFields: ["email"] }
  );
  return user;
}
