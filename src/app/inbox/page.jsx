import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { ConvertDateToDaysAgo } from "@/modules/utilities";
import { authOptions } from "@/modules/auth";

async function getChatList() {
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_URL + "/api/chats/getList", {
      method: "GET",
      headers: { Cookie: cookies().toString() },
      cache: "no-store",
    });
    return await res.json();
  } catch (e) {
    return {};
  }
}

export default async function MessageList() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const chatList = await getChatList();

  if (!chatList || chatList.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto mt-[80px]">
        <div className="m-4 p-6 rounded-2xl bg-white/60 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center h-[calc(80vh-80px)] animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 28 28" className="text-gray-500 animate-pulse">
            <path fill="currentColor" d="M14 3.5C8.201 3.5 3.5 8.201 3.5 14c0 1.884.496 3.65 1.363 5.178a.75.75 0 0 1 .07.575l-1.318 4.634l4.634-1.318a.75.75 0 0 1 .576.07A10.449 10.449 0 0 0 14 24.5c5.799 0 10.5-4.701 10.5-10.5S19.799 3.5 14 3.5ZM2 14C2 7.373 7.373 2 14 2s12 5.373 12 12s-5.373 12-12 12a11.95 11.95 0 0 1-5.637-1.404l-4.77 1.357a1.25 1.25 0 0 1-1.544-1.544l1.356-4.77A11.95 11.95 0 0 1 2 14Z"/>
          </svg>
          <div className="text-lg font-bold mt-4 text-gray-700">Your inbox is empty</div>
          <p className="text-sm text-gray-500 mt-2">Chats with sellers will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto mt-[80px] flex flex-col gap-4 animate-fadeSlideUp">
      <div className="px-4 mt-2">
        <div className="text-3xl font-extrabold bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent tracking-tight">My Messages</div>
      </div>

      {chatList.reverse().map((chat, index) => (
        <Link
          key={index}
          href={`/message/${chat._id}`}
          className="bg-white/80 backdrop-blur-lg p-5 mx-4 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 flex items-center justify-between border border-gray-200 hover:border-gray-300 group animate-fadeInCard"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
              <Image
                src={`https://wsrv.nl?url=${chat.itemInfo.images[0]}&w=64&h=64&fit=cover&a=attention`}
                alt={chat.itemInfo.name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>

            <div className="flex flex-col">
              <div className="font-semibold text-gray-900 text-lg">
                {chat.users.find((u) => u.name !== session.user.name)?.name || "Unknown User"}
              </div>

              <div className="text-sm text-gray-500 truncate max-w-[220px]">
                {chat.messages[0].sender._id === chat.me[0]._id ? "You: " : ""}
                {chat.messages[0].message}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" className="text-gray-400">
              <path fill="currentColor" d="M216 48H40a16 16 0 0 0-16 16v160a15.84 15.84 0 0 0 9.25 14.5A16.05 16.05 0 0 0 40 240a15.89 15.89 0 0 0 10.25-3.78a.69.69 0 0 0 .13-.11L82.5 208H216a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16Z" />
            </svg>
            {ConvertDateToDaysAgo(new Date(chat.messages[0].createdAt))}
          </div>
        </Link>
      ))}
    </div>
  );
}
