import { authOptions } from "@/auth";
import NextAuth from "next-auth";

export const dynamic = "force-dynamic"; // ⬅️ add this

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
