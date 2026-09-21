"use client";

import { useRef, useState } from "react";

const grades = [
  { label: "F", min: 0, points: 0 },
  { label: "C", min: 50, points: 5 },
  { label: "B", min: 56, points: 6 },
  { label: "B+", min: 61, points: 7 },
  { label: "A", min: 71, points: 8 },
  { label: "A+", min: 81, points: 9 },
  { label: "O", min: 91, points: 10 },  
];

export default function DynamicGradeCalculator({ marksData }: any) {
  const [internals, setInternals] = useState<any>({});
  const [gradeIndex, setGradeIndex] = useState<any>({});
  const [includedInCgpa, setIncludedInCgpa] = useState<any>({});
  const internalInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getDefaultInclusion = (sub: any) => Number(sub?.credits) > 0;

  const getDefaultAchievableGradeIndex = (internal: number) => {
    const maxTotalWithExternal = internal + 40;
    let defaultIndex = 0;

    grades.forEach((g, index) => {
      if (g.min <= maxTotalWithExternal) {
        defaultIndex = index;
      }
    });

    return defaultIndex;
  };

  const getGradeIndexFromTotalMarks = (marks: number) => {
    if (marks >= 91) return 6; // O
    if (marks >= 81) return 5; // A+
    if (marks >= 71) return 4; // A
    if (marks >= 61) return 3; // B+
    if (marks >= 56) return 2; // B
    if (marks >= 50) return 1; // C
    return 0; // F
  };

  const focusInternalInput = (code: string) => {
    const input = internalInputRefs.current[code];

    if (!input) return;

    input.focus();
    input.select();
  };

  const calculateCGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;

    marksData.forEach((sub: any) => {
      const isIncluded = includedInCgpa[sub.code] ?? getDefaultInclusion(sub);
      if (!isIncluded) return;

      const internal = Number(internals[sub.code] ?? sub.totalMarks ?? 0);
      const isCompletelyInternal =
        /P\s*$/i.test(String(sub.code || "").trim()) || Number(internal) > 60;
      const defaultGradeIndex = isCompletelyInternal
        ? getGradeIndexFromTotalMarks(internal)
        : getDefaultAchievableGradeIndex(internal);
      const gIndex = gradeIndex[sub.code] ?? defaultGradeIndex;
      const grade = grades[gIndex];

      // ✅ CREDIT FIX (STRICT)
      const credits = Number(sub.credits);

      if (!credits || credits <= 0) return; // ignore invalid credits

      totalPoints += grade.points * credits;
      totalCredits += credits;
    });

    return totalCredits
      ? (totalPoints / totalCredits).toFixed(2)
      : "0.00";
  };

  const headingTitle = "CalcGPA+";

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          {headingTitle}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Calculate grade outcomes and CGPA impact based on internal marks
        </p>
      </div>
      {/* CGPA */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 text-center">
        <p className="text-gray-400 text-sm">Predicted CGPA</p>
        <p className="text-5xl font-bold text-orange-500">
          {calculateCGPA()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">

          {marksData.map((sub: any) => {
            const internal = internals[sub.code] ?? sub.totalMarks ?? 0;
            const inputMax = 100;
            const internalMax = Number(sub.totalMaxMarks) || 60;
            const isAutoInternalByMarks = Number(internal) > 60;
            const isCompletelyInternal =
              /P\s*$/i.test(String(sub.code || "").trim()) || isAutoInternalByMarks;
            const defaultGradeIndex = isCompletelyInternal
              ? getGradeIndexFromTotalMarks(Number(internal))
              : getDefaultAchievableGradeIndex(Number(internal));
            const gIndex = gradeIndex[sub.code] ?? defaultGradeIndex;
            const isIncluded = includedInCgpa[sub.code] ?? getDefaultInclusion(sub);
            const isZeroCreditCourse = Number(sub.credits) <= 0;
            const grade = grades[gIndex];

            const required = grade.min - internal;
            const required75 = Math.max(0, (required / 40) * 75);
            const isAboveExternalLimit = required75 > 75;
            const required75Display = isAboveExternalLimit
              ? "75+"
              : `${required75.toFixed(2)}`;

            return (
              <div
                key={sub.code}
                className="bg-[#111111] border border-[#222222] rounded-xl p-5 hover:border-orange-500/30 transition"
              >

                {/* HEADER */}
                <div className="flex justify-between mb-4">

                  <div>
                    <p className="text-white font-semibold text-sm">
                      {sub.code}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {sub.title}
                    </p>
                  </div>

                  {/* ✅ IMPROVED CREDIT DISPLAY */}
                  <div className="inline-flex min-w-24 items-center justify-center rounded-full bg-orange-500/10 px-4 py-1 text-center text-xs font-semibold text-orange-400 whitespace-nowrap">
                    {sub.credits ? `${sub.credits} credits` : "--"}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">

                  {/* INTERNAL */}
                  <div>
                    <p className="text-gray-400 text-xs mb-1">
                      Internal Marks (edit to see marks required in external)
                    </p>

                    {(() => {
                      const updateInternalMarks = (value: number) => {
                        if (value < 0 || value > inputMax) return;

                        const roundedValue = Math.round(value * 100) / 100;
                        const isInternalByCode = /P\s*$/i.test(String(sub.code || "").trim());
                        const shouldResyncGradeBar = isInternalByCode || roundedValue > 60;

                        setInternals((prev: any) => ({
                          ...prev,
                          [sub.code]: roundedValue,
                        }));

                        if (shouldResyncGradeBar) {
                          setGradeIndex((prev: any) => ({
                            ...prev,
                            [sub.code]: getGradeIndexFromTotalMarks(roundedValue),
                          }));
                        }
                      };

                      return (
                        <div
                          className="inline-flex items-center gap-2 rounded-lg border border-[#333333] bg-[#222222] px-3 py-2 text-white"
                          onClick={() => focusInternalInput(sub.code)}
                        >
                          <button
                            type="button"
                            onClick={() => focusInternalInput(sub.code)}
                            className="rounded-sm text-gray-500 transition hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-0"
                            aria-label={`Edit internal marks for ${sub.code}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            value={internal}
                            max={inputMax}
                            step="0.01"
                            ref={(node) => {
                              internalInputRefs.current[sub.code] = node;
                            }}
                            onChange={(e) => updateInternalMarks(Number(e.target.value))}
                            className="marks-input w-14 bg-transparent text-center text-sm font-semibold outline-none"
                          />

                          <span className="text-gray-400 text-sm">/</span>
                          <span className="text-gray-300 text-sm">{internalMax}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* GRADE */}
                  <div>
                    <p className="text-gray-400 text-xs mb-1">
                      Grade: <span className="text-white">{grade.label}</span>
                    </p>

                    <input
                      type="range"
                      min="0"
                      max={grades.length - 1}
                      value={gIndex}
                      onChange={(e) =>
                        setGradeIndex((prev: any) => ({
                          ...prev,
                          [sub.code]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-orange-500"
                    />

                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      {grades.map((g) => (
                        <span key={g.label}>{g.label}</span>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="mt-4">
                  <p className="text-gray-400 text-xs mb-2">CGPA Inclusion</p>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                      <input
                        type="radio"
                        name={`include-${sub.code}`}
                        checked={isIncluded}
                        onChange={() =>
                          setIncludedInCgpa((prev: any) => ({
                            ...prev,
                            [sub.code]: true,
                          }))
                        }
                        className="accent-orange-500"
                      />
                      Included
                    </label>
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name={`include-${sub.code}`}
                        checked={!isIncluded}
                        onChange={() =>
                          setIncludedInCgpa((prev: any) => ({
                            ...prev,
                            [sub.code]: false,
                          }))
                        }
                        className="accent-orange-500"
                      />
                      Not Included
                    </label>
                  </div>
                  {isZeroCreditCourse && (
                    <p className="mt-2 text-right text-[11px] text-amber-300">
                      No credit course, hence not included in CGPA calculation.
                    </p>
                  )}
                </div>

                {/* Predicted marks block (same on all screen sizes) */}
                <div className="mt-4">
                  <div className="bg-[#222222] rounded-lg p-3">
                    {isCompletelyInternal ? (
                      <div className="text-center">
                        <span className="text-orange-300 text-xs font-semibold">
                          Completely Internal Subject
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3 items-end">
                          <div className ="text-left">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">
                              Target grade
                            </p>
                            <p className="text-sm font-semibold text-white">
                              {grade.label}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">
                              External marks needed
                            </p>
                            <p className="text-2xl font-bold text-orange-400 leading-none">
                              {required75Display}
                            </p>
                            <p className="text-[11px] text-gray-400">out of 75</p>
                          </div>
                        </div>

                        {isAboveExternalLimit ? (
                          <p className="mt-2 text-xs text-amber-300">
                            Above the external exam limit.
                          </p>
                        ) : (
                          <div className="w-full bg-[#333333] h-2 rounded mt-2">
                            <div
                              className="bg-orange-500 h-2 rounded"
                              style={{
                                width: `${Math.min(100, (required75 / 75) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
      </div>

      <style jsx global>{`
        .marks-input {
          -moz-appearance: textfield;
          appearance: textfield;
        }

        .marks-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .marks-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}