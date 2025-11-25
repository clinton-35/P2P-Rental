import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import RegisterComponent from "./component";

export default async function RegisterPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/");
  }

  return <RegisterComponent />;
}
