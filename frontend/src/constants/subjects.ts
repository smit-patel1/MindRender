import React from "react";
import { Atom, Dna, Cpu } from "lucide-react";

export const SUBJECTS = ["Physics", "Biology", "Computer Science"] as const;
export type SubjectType = (typeof SUBJECTS)[number];

export const SUBJECT_INFO: Record<
  SubjectType,
  {
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    examples: string[];
  }
> = {
  Physics: {
    icon: Atom,
    description: "Interactive physics simulations with real-time controls",
    examples: [
      "pendulum motion",
      "wave interference",
      "electromagnetic fields",
      "thermodynamics",
    ],
  },
  Biology: {
    icon: Dna,
    description: "Dynamic biological process visualizations",
    examples: [
      "cell division",
      "photosynthesis",
      "genetic inheritance",
      "ecosystem dynamics",
    ],
  },
  "Computer Science": {
    icon: Cpu,
    description: "Algorithm and data structure visualizations",
    examples: [
      "sorting algorithms",
      "binary trees",
      "pathfinding",
      "recursive functions",
    ],
  },
};

