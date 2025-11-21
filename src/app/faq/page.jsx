"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/app/ui/card";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      question: "What is PackHub?",
      answer:
        "PackHub is a peer-to-peer rental and sharing platform where people can lend, rent, and access items directly from one another—no middlemen, no extra fees.",
    },
    {
      question: "How do I get started?",
      answer:
        "Create an account, list your items, browse what's available near you, book, meet, and share. Quick and effortless.",
    },
    {
      question: "Is PackHub free to use?",
      answer:
        "Yes! Creating an account and listing items is completely free. Our mission is to make sharing accessible, affordable, and fair for everyone.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-screen-xl mx-auto mt-20 p-4">
      <h1 className="text-4xl font-extrabold text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
        Frequently Asked Questions
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="cursor-pointer"
            onClick={() => toggleIndex(index)}
          >
            <Card className="border rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-lg font-semibold text-gray-900">{faq.question}</h2>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={24} className="text-gray-600" />
                </motion.div>
              </div>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="text-gray-700 p-6 border-t bg-gray-50">
                      {faq.answer}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
