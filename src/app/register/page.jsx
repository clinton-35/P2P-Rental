import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import RegisterComponent from "./component";
import { authOptions } from "@/modules/auth";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return <RegisterComponent />;
}
