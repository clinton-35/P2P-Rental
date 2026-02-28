import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Form from "./form";
import { authOptions } from "@/modules/auth";

export default async function CreateAd() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return <Form />;
}