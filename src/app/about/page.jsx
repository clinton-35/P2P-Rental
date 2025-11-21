"use client";

import { motion } from "framer-motion";

export default function AboutUs() {
  const listItems = [
    {
      title: "No Middleman",
      description:
        "Forget unnecessary charges and complicated processes. With PackHub, sharing happens directly — fair, transparent, and simple.",
    },
    {
      title: "Built on Trust",
      description:
        "Connect directly with people in your community. PackHub fosters real relationships built on reliability, honesty, and mutual benefit.",
    },
    {
      title: "Local or Global",
      description:
        "Whether you need something around the corner or want to list items for a wider audience, PackHub gives you access to a world of shared possibilities.",
    },
    {
      title: "User-Centric Experience",
      description:
        "Our platform is crafted to feel natural and effortless. PackHub makes sharing and renting smooth, intuitive, and enjoyable.",
    },
    {
      title: "Safe and Secure",
      description:
        "With secure communication, verified users, and active moderation, we make sure your sharing experience is protected from start to finish.",
    },
    {
      title: "Sustainable by Design",
      description:
        "PackHub promotes smarter use of resources. By sharing instead of buying new, you help reduce waste and contribute to a greener planet.",
    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto mt-20 p-4">
      <motion.h1
        className="text-4xl font-extrabold text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        About Us
      </motion.h1>

      <motion.section
        className="text-gray-700 text-lg mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <p>
          Imagine a community where anyone can access what they need without owning everything.
          That's exactly what PackHub is built for. Our story is about simplifying access,
          empowering people to share, and building a trusted network where every item brings
          someone value. PackHub celebrates convenience, community, and the power of a connected pack.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-8 text-gray-900 text-center">What Makes Us Different</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {listItems.map((item, index) => (
            <motion.div
              key={index}
              className="p-6 bg-white/70 backdrop-blur-xl rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h3>
              <p className="text-gray-700">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
