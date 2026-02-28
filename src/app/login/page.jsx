import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import LoginComponent from "./component";
import { authOptions } from "@/modules/auth";


export default async function CreateAd() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return <LoginComponent />;
}