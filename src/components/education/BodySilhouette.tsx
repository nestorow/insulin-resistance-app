"use client";

// Clickable body silhouette mapping anatomical regions to disease body
// systems. Re-implementation of the legacy DiseaseMapModule's centerpiece
// in the new light teal palette (ported from src/components/diseases/
// DiseaseMapModule.tsx @ 6c0c24c).

// Each region maps to the most representative bodySystem; clicking it sets
// the filter in EducationModule. Multi-system regions pick the primary one.
const REGION_SYSTEM: Record<string, string> = {
  head: "brain",
  chest: "heart",
  abdomen: "metabolic",
  pelvis: "reproductive",
  limbs: "skin_muscle_bone",
  general: "cancer",
};

export default function BodySilhouette({
  activeSystem,
  onRegionClick,
}: {
  activeSystem: string;
  onRegionClick: (system: string) => void;
}) {
  // Same fill/stroke logic for every clickable region, parametrised by the
  // system it maps to.
  const regionClasses = (region: keyof typeof REGION_SYSTEM) => {
    const isActive = REGION_SYSTEM[region] === activeSystem;
    return [
      "cursor-pointer transition-colors duration-200",
      isActive
        ? "fill-teal-500 stroke-teal-700"
        : "fill-teal-50 stroke-teal-300 hover:fill-teal-200",
    ].join(" ");
  };

  const labelClasses = (region: keyof typeof REGION_SYSTEM) => {
    const isActive = REGION_SYSTEM[region] === activeSystem;
    return `pointer-events-none text-[9px] font-medium ${
      isActive ? "fill-white" : "fill-slate-600"
    }`;
  };

  return (
    <svg
      viewBox="0 0 200 290"
      className="mx-auto w-full max-w-[220px] select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body outline — head + torso/limbs, drawn behind the regions */}
      <ellipse
        cx="100"
        cy="38"
        rx="26"
        ry="26"
        className="fill-white stroke-teal-200"
        strokeWidth={1.2}
      />
      <path
        d="M 85 68 L 78 74 L 50 80 L 28 110 L 16 160 L 22 164 L 34 130
           L 46 100 L 60 88 L 72 82 L 80 100 L 76 140 L 72 200 L 70 260
           L 84 262 L 88 220 L 96 180 L 100 170 L 104 180 L 112 220
           L 116 262 L 130 260 L 128 200 L 124 140 L 120 100 L 128 82
           L 140 88 L 154 100 L 166 130 L 178 164 L 184 160 L 172 110
           L 150 80 L 122 74 L 115 68 Z"
        className="fill-white stroke-teal-200"
        strokeWidth={1.2}
      />

      {/* Head / Brain */}
      <ellipse
        cx="100" cy="38" rx="26" ry="26"
        className={regionClasses("head")}
        strokeWidth={1.5}
        onClick={() => onRegionClick(REGION_SYSTEM.head)}
      />
      <text x="100" y="42" textAnchor="middle" className={labelClasses("head")}>
        Мозък
      </text>

      {/* Chest / Heart */}
      <ellipse
        cx="100" cy="108" rx="28" ry="20"
        className={regionClasses("chest")}
        strokeWidth={1.5}
        onClick={() => onRegionClick(REGION_SYSTEM.chest)}
      />
      <text x="100" y="112" textAnchor="middle" className={labelClasses("chest")}>
        Сърце
      </text>

      {/* Abdomen / Metabolic + GI */}
      <ellipse
        cx="100" cy="165" rx="30" ry="28"
        className={regionClasses("abdomen")}
        strokeWidth={1.5}
        onClick={() => onRegionClick(REGION_SYSTEM.abdomen)}
      />
      <text x="100" y="162" textAnchor="middle" className={labelClasses("abdomen")}>
        Корем
      </text>
      <text
        x="100"
        y="173"
        textAnchor="middle"
        className={`pointer-events-none text-[7px] ${
          REGION_SYSTEM.abdomen === activeSystem ? "fill-white/80" : "fill-slate-500"
        }`}
      >
        ГИТ / Метаб.
      </text>

      {/* Pelvis / Reproductive */}
      <ellipse
        cx="100" cy="215" rx="24" ry="16"
        className={regionClasses("pelvis")}
        strokeWidth={1.5}
        onClick={() => onRegionClick(REGION_SYSTEM.pelvis)}
      />
      <text x="100" y="219" textAnchor="middle" className={labelClasses("pelvis")}>
        Репрод.
      </text>

      {/* Left arm / Skin */}
      <rect
        x="18" y="120" width="28" height="44" rx="10"
        className={regionClasses("limbs")}
        strokeWidth={1.5}
        onClick={() => onRegionClick(REGION_SYSTEM.limbs)}
      />
      <text x="32" y="146" textAnchor="middle" className={labelClasses("limbs")}>
        Кожа
      </text>

      {/* Right arm / Bone */}
      <rect
        x="154" y="120" width="28" height="44" rx="10"
        className={regionClasses("limbs")}
        strokeWidth={1.5}
        onClick={() => onRegionClick(REGION_SYSTEM.limbs)}
      />
      <text x="168" y="146" textAnchor="middle" className={labelClasses("limbs")}>
        Кости
      </text>

      {/* General — cancer indicator */}
      <circle
        cx="100" cy="260" r="14"
        className={regionClasses("general")}
        strokeWidth={1.5}
        onClick={() => onRegionClick(REGION_SYSTEM.general)}
      />
      <text x="100" y="264" textAnchor="middle" className={labelClasses("general")}>
        Рак
      </text>
    </svg>
  );
}
