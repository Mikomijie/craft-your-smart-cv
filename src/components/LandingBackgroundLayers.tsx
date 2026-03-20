import { useEffect, useRef } from "react";

const floatingWords = [
  "React", "Product Manager", "Leadership", "TypeScript", "Communication",
  "Design", "Strategy", "Python", "Collaboration", "UX Research",
  "Analytics", "Full-Stack", "Agile", "Marketing", "Data Science",
  "JavaScript", "Figma", "Teamwork", "Innovation", "Engineering",
];

// Layer 1: Glowing orbs
export const GlowingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="landing-orb landing-orb-1" />
    <div className="landing-orb landing-orb-2" />
    <div className="landing-orb landing-orb-3" />
    <div className="landing-orb landing-orb-4" />
  </div>
);

// Layer 2: Drifting words
export const DriftingWords = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {floatingWords.map((word, i) => {
      const left = ((i * 37 + 13) % 90) + 5;
      const size = 12 + (i % 5) * 4;
      const delay = (i * 1.7) % 12;
      const duration = 18 + (i % 6) * 4;
      return (
        <span
          key={word}
          className="absolute whitespace-nowrap font-medium select-none landing-drift-word"
          style={{
            left: `${left}%`,
            bottom: `-${20 + (i % 3) * 10}px`,
            fontSize: `${size}px`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
          }}
        >
          {word}
        </span>
      );
    })}
  </div>
);

// Layer 3: Circuit lines (SVG with animated stroke)
export const CircuitLines = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const paths = svgRef.current?.querySelectorAll("path");
    paths?.forEach((path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        ref={svgRef}
        viewBox="0 0 1200 900"
        fill="none"
        className="absolute inset-0 w-full h-full landing-circuit-svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M100 200 L300 200 L300 400 L500 400 L500 300 L650 300" className="landing-circuit-path circuit-delay-1" />
        <path d="M800 100 L800 250 L600 250 L600 500 L750 500" className="landing-circuit-path circuit-delay-2" />
        <path d="M200 600 L400 600 L400 450 L550 450 L550 700 L700 700" className="landing-circuit-path circuit-delay-3" />
        <path d="M900 400 L1050 400 L1050 550 L900 550 L900 700 L1100 700" className="landing-circuit-path circuit-delay-4" />
        <path d="M150 800 L350 800 L350 650 L500 650 L500 850" className="landing-circuit-path circuit-delay-5" />
        {/* Dots at intersections */}
        {[
          [300, 200], [300, 400], [500, 300], [800, 250], [600, 500],
          [400, 600], [550, 450], [1050, 400], [900, 550], [350, 800],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" className="landing-circuit-dot" style={{ animationDelay: `${1.5 + i * 0.3}s` }} />
        ))}
      </svg>
    </div>
  );
};
