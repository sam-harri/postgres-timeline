"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import TimelineCard from "@/components/TimelineCard";
import type { PostgresVersion } from "@/types/postgres";

interface TimelineProps {
  items: PostgresVersion[];
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {/* Center line - now white */}
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-white/30" />

      <div className="relative">
        {items.map((item, index) => (
          <TimelineItem
            key={item.version}
            item={item}
            index={index}
            isLeft={index % 2 === 0}
            items={items}
          />
        ))}
      </div>
    </div>
  );
}

interface TimelineItemProps {
  item: PostgresVersion;
  index: number;
  isLeft: boolean;
  items: PostgresVersion[];
}

function TimelineItem({ item, index, isLeft, items }: TimelineItemProps) {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, inView]);

  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.1,
        delay: 0.05,
      },
    },
  };

  const previousItem = index > 0 ? items[index - 1] : null;
  const showYear = index === 0 || previousItem?.year !== item.year;

  return (
    <div ref={ref} className="mb-16 relative">
      {/* Year label */}
      {showYear && (
        <div className={`absolute ${isLeft ? 'left-[52%]' : 'right-[52%]'} top-6 transform ${isLeft ? 'translate-x-2' : '-translate-x-2'}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={controls}
            variants={variants}
            className="text-gray-700 text-4xl font-medium"
          >
            {item.year}
          </motion.div>
        </div>
      )}

      {/* Timeline dot with gap - improved to completely hide the line */}
      <div className="absolute left-1/2 top-6 transform -translate-x-1/2 flex flex-col items-center z-30">
        {/* White background block to completely hide the line */}
        <div className="absolute w-8 h-8 bg-black rounded-full"></div>

        {/* Dot */}
        <motion.div
          className={`w-4 h-4 rounded-full bg-gradient-to-r from-[#32c2e8] to-[#63f655] relative translate-y-2`}
          initial={{ scale: 0 }}
          animate={controls}
          variants={{
            hidden: { scale: 0 },
            visible: {
              scale: 1,
              transition: {
                duration: 0.1,
                delay: 0.05,
              },
            },
          }}
        >
<div className="absolute inset-0 bg-black opacity-20 rounded-full"></div>
        </motion.div>
      </div>

      {/* Card */}
      <motion.div
        className={`relative ${isLeft ? "pr-12 mr-auto" : "pl-12 ml-auto"} w-5/12`}
        initial="hidden"
        animate={controls}
        variants={variants}
      >
        <TimelineCard
          version={item.version}
          releaseDate={item.releaseDate}
          features={item.features}
          isLeft={isLeft}
          year={item.year}
        />
      </motion.div>
    </div>
  );
}
