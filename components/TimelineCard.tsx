"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface TimelineCardProps {
  version: string;
  releaseDate: string;
  features: string[];
  isLeft: boolean;
  year: number;
}

export default function TimelineCard({
  version,
  releaseDate,
  features,
  isLeft,
}: TimelineCardProps) {
  return (
    <motion.div
      className="relative bg-[#0d0e10] rounded-lg p-4 md:p-6 shadow-lg overflow-hidden text-white"
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.2 },
      }}
    >
      <div className="absolute inset-0 p-[1px] rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-[#32c2e8] to-[#63f655] rounded-lg"></div>
          <div className="absolute inset-[1px] bg-[#0d0e10] rounded-lg"></div>
        </div>

      <div className="relative z-10">
        <div className="flex items-center mb-3 md:mb-4">
          <h3 className="text-lg md:text-xl font-bold">
            <span
              className={`bg-gradient-to-r from-[#32c2e8] to-[#63f655] bg-clip-text text-transparent relative after:absolute after:inset-0 after:bg-black after:opacity-20`}
            >
              PostgreSQL {version}
            </span>
          </h3>
          {isLeft && (
            <div className="absolute -right-8 md:-right-10 top-1/2 transform -translate-y-1/2">
              <ArrowRight
                className={`h-4 w-4 md:h-5 md:w-5 text-[#63f655]/70"}`}
              />
            </div>
          )}
          {!isLeft && (
            <div className="absolute -left-8 md:-left-10 top-1/2 transform -translate-y-1/2 rotate-180">
              <ArrowRight
                className={`h-4 w-4 md:h-5 md:w-5 text-[#32c2e8]/70`}
              />
            </div>
          )}
        </div>
        <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">{releaseDate}</p>
        <div className="space-y-1 md:space-y-2">
          <h4 className="font-medium text-white text-sm md:text-base">Key Features:</h4>
          <ul className="list-disc pl-4 md:pl-5 space-y-0.5 md:space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="text-white text-xs md:text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
