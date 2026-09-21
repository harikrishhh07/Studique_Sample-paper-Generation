import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import SocialIconsHorizontal from "../SocialIconsHorizontal";
import { FaGithub, FaLinkedin, FaGlobe, FaInstagram, FaTimes, FaChevronDown, FaChevronUp, FaExternalLinkAlt } from "react-icons/fa";
import { useCoreTeam, useContributors, useFoundingTeam } from "@/hooks/useTeam";
import { AlertCircle } from "lucide-react";
import type { TeamMember } from "@/lib/teamService";
import Link from "next/link";
import Image from 'next/image';
import { GlowingEffect } from "../ui/glowing-effect";

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%2327224a'/%3E%3Ccircle cx='60' cy='46' r='22' fill='%23ddd'/%3E%3Cpath d='M18 102c0-20 18-30 42-30s42 10 42 30' fill='%23ddd'/%3E%3C/svg%3E";

// Loading skeleton components
const TeamMemberSkeleton = () => (
  <div className="flex flex-col items-center rounded-2xl p-6 bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 border border-zinc-800 min-h-[180px] animate-pulse">
    <div className="w-20 h-20 rounded-full bg-zinc-700 mb-5" />
    <div className="h-4 bg-zinc-700 rounded w-24 mb-2" />
    <div className="h-3 bg-zinc-700 rounded w-32 mb-2" />
    <div className="flex gap-3 mt-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-5 h-5 bg-zinc-700 rounded" />
      ))}
    </div>
  </div>
);

const ContributorsSkeleton = () => (
  <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 animate-pulse">
    <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-1.5 sm:gap-1.5 md:gap-2 justify-items-center w-full">
      {[...Array(70)].map((_, i) => (
        <div key={i} className="w-6 h-6 bg-zinc-700 rounded" />
      ))}
    </div>
  </div>
);

// Small Avatar wrapper using next/image with an onError fallback
const Avatar = ({ src, alt, size = 56, className = '', ...props }: { src?: string | null; alt?: string; size?: number; className?: string } & React.HTMLAttributes<HTMLImageElement>) => {
  const [errored, setErrored] = useState(false);
  const finalSrc = !src || errored ? DEFAULT_AVATAR : src;

  return (
    <Image
      src={finalSrc}
      alt={alt ?? ''}
      width={size}
      height={size}
      className={`${className} object-cover`}
      onError={() => setErrored(true)}
      loading="lazy"
      // Let Next.js optimize when domain allowed; otherwise it's still safe.
      {...props}
    />
  );
};

// Error component
const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4 text-center max-w-md">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
      <p className="text-gray-400">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

const About = () => {
  const [activeContributor, setActiveContributor] = useState<number | null>(null);
  const [isTermsExpanded, setIsTermsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Use optimized data hooks
  const { data: foundingTeam = [], isLoading: foundingLoading, error: foundingError, refetch: refetchFounding } = useFoundingTeam();
  const { data: coreTeam = [], isLoading: coreLoading, error: coreError, refetch: refetchCore } = useCoreTeam();
  const { data: contributors = [], isLoading: contributorsLoading, error: contributorsError, refetch: refetchContributors } = useContributors();

  const allContributors = contributors;
  const allContributorsLoading = contributorsLoading;
  const foundingTeamLoading = foundingLoading;

  const hasError = foundingError || coreError || contributorsError;

  // Prepare two rows by splitting contributors into two equal halves.
  // This keeps the layout predictable and balances the rows visually.
  const contributorRows = useMemo(() => {
    const half = Math.ceil(contributors.length / 2);
    const first = contributors.slice(0, half);
    const second = contributors.slice(half);
    return [first, second];
  }, [contributors]);

  // Small subcomponent to render a single marquee row. It manages a paused
  // state so hovering/focusing an avatar pauses only that row.
  const ContributorRow = ({ row, rowIdx, baseIndex }: { row: TeamMember[]; rowIdx: number; baseIndex: number }) => {
    const [paused, setPaused] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const singleRef = useRef<HTMLDivElement | null>(null);
    const [repeat, setRepeat] = useState(1);

    // compute how many times we need to repeat the row inside one "unit"
    // so that one unit (which is duplicated) is at least half the container
    // width — this ensures two units (original + duplicate) always cover
    // the visible area and the marquee never shows empty space.
    useEffect(() => {
      const update = () => {
        const cw = containerRef.current?.offsetWidth ?? 0;
        const sw = singleRef.current?.scrollWidth ?? 0;
        if (!sw || !cw) {
          setRepeat(1);
          return;
        }
        const minRepeats = Math.max(1, Math.ceil((cw / 2) / sw));
        setRepeat(minRepeats);
      };

      update();
      const ro = new ResizeObserver(() => update());
      if (singleRef.current) ro.observe(singleRef.current);
      if (containerRef.current) ro.observe(containerRef.current);
      window.addEventListener('resize', update);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', update);
      };
    }, [row]);

  const sourceRow = useMemo(() => (rowIdx === 1 ? [...row].reverse() : row), [row, rowIdx]);

    const oneSet: TeamMember[] = useMemo(() => {
      const arr: TeamMember[] = [];
      for (let i = 0; i < repeat; i++) arr.push(...sourceRow);
      return arr;
    }, [sourceRow, repeat]);

    // duration: vary more strongly between rows for parallax
    const duration = rowIdx % 2 === 0 ? `${8 + oneSet.length * 0.7}s` : `${14 + oneSet.length * 0.9}s`;
  // First row should move left->right (use marquee-reverse), second row
  // should move right->left (use marquee). This matches the requested
  // behavior: first row L→R, second R→L.
  const classNames = rowIdx === 0 ? 'marquee marquee-reverse' : 'marquee';

    const handlePointerEnter = () => setPaused(true);
    const handlePointerLeave = () => setPaused(false);

    return (
    <div className="mb-6">
      <div ref={containerRef} className="relative overflow-hidden px-2 py-2 marquee-mask">
          <div
            className={classNames}
            style={{ ['--duration' as any]: duration, ['--gap' as any]: '1rem', animationPlayState: paused ? 'paused' : 'running' }}
          >
            <div ref={singleRef} className="inline-flex items-start gap-4">
                {oneSet.map((contributor: TeamMember, idx: number) => {
                // compute original index within the original row so clicks map
                // to the correct contributor. If we've reversed the display
                // (for rowIdx === 1), map accordingly.
                const posInRow = idx % row.length;
                const origIdx = rowIdx === 1 ? (row.length - 1 - posInRow) : posInRow;
                const isInteractive = Math.floor(idx / row.length) === 0; // only first repetition interactive
                return (
                  <div key={`r${rowIdx}-c${idx}-${contributor.id ?? idx}`} className="inline-flex flex-col items-center text-center p-1">
                    {isInteractive ? (
                      <button
                        onClick={() => handleContributorClick(baseIndex + origIdx)}
                        onMouseEnter={handlePointerEnter}
                        onMouseLeave={handlePointerLeave}
                        onFocus={handlePointerEnter}
                        onBlur={handlePointerLeave}
                        onTouchStart={handlePointerEnter}
                        onTouchEnd={handlePointerLeave}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleContributorClick(baseIndex + origIdx);
                          }
                        }}
                        className="group inline-flex flex-col items-center text-center p-1 rounded focus:outline-none cursor-pointer transition-transform duration-200 transform hover:scale-110 focus-visible:scale-110 active:scale-95"
                        aria-label={`View ${contributor.name}'s profile`}
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shadow transition-transform duration-200 group-hover:scale-110 group-focus:scale-110">
                          <Avatar
                            src={contributor.img}
                            alt={`${contributor.name}'s avatar`}
                            size={56}
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-sm text-white mt-2 truncate max-w-[96px] hidden sm:block">{contributor.name?.split(" ")[0]}</span>
                      </button>
                    ) : (
                      <div className="pointer-events-none inline-flex flex-col items-center text-center p-1" aria-hidden>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shadow">
                          <Avatar
                            src={contributor.img}
                            alt={contributor.name ?? ''}
                            size={56}
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-sm text-white mt-2 truncate max-w-[96px] hidden sm:block">{contributor.name?.split(" ")[0]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* duplicate the same oneSet for seamless loop; duplicates non-interactive */}
            <div className="inline-flex items-start gap-4" aria-hidden>
              {oneSet.map((contributor: TeamMember, idx: number) => (
                <div key={`dup-r${rowIdx}-c${idx}-${contributor.id ?? idx}`} className="inline-flex flex-col items-center text-center p-1 pointer-events-none" aria-hidden>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shadow border-2 border-zinc-900">
                    <Avatar
                      src={contributor.img}
                      alt={contributor.name ?? ''}
                      size={56}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-sm text-white mt-2 truncate max-w-[96px] hidden sm:block">{contributor.name?.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // (Removed) previous orbit/network visualization — using a simple grid instead.

  // Optimized event handlers
  const handleContributorClick = useCallback((index: number) => {
    setActiveContributor(index);
  }, []);

  const handleCardClick = useCallback((linkedinUrl: string) => {
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const handleCloseCard = useCallback(() => {
    setActiveContributor(null);
  }, []);

  const handleRetry = useCallback(() => {
    refetchFounding?.();
    refetchCore?.();
    refetchContributors?.();
  }, [refetchFounding, refetchCore, refetchContributors]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleCloseCard();
    }
  }, [handleCloseCard]);

  const handleToggleTerms = useCallback(() => {
    setIsTermsExpanded(prev => !prev);
  }, []);

  // Close card when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setActiveContributor(null);
      }
    };

    if (activeContributor !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [activeContributor, handleKeyDown]);

  // Simple contributors grid: responsive columns; avatars slightly larger on phones
  const ContributorsGrid = ({ contributors }: { contributors: TeamMember[] }) => {
    return (
      <div className="w-full bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 rounded-2xl p-4 sm:p-6">
      <div className="grid grid-cols-5 md:grid-cols-12 xl:grid-cols-[repeat(15,minmax(0,1fr))] gap-3 sm:gap-4 md:gap-6 justify-items-center w-full">
              {contributors.map((c, i) => (
            <button
              key={c.id ?? i}
              onClick={() => handleContributorClick(i)}
              className="w-full aspect-square rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shadow transition-all duration-150 hover:scale-110 hover:shadow-orange-500/20 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-orange-400/50"
              aria-label={`View ${c.name}'s profile`}
            >
              <Avatar src={c.img} alt={c.name} size={64} className="w-full h-full" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Error state
  if (hasError) {
    return (
      <ErrorState 
        message="Failed to load team data. Please check your connection and try again."
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Main Heading */}
        <header>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            About Studique
          </h1>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Your all-in-one student companion at SRM. No more hopping between apps or scrolling endlessly through group chats - everything you need is right here, with new features added regularly.
            </p>
          </div>
        </header>

  <main className="space-y-12">
          {/* The Studique Team */}
          <section aria-labelledby="core-team-heading">
            <div className="flex justify-center mb-8">
              <article className="relative w-fit max-w-full flex flex-col items-center rounded-2xl px-4 py-4 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 hover:border-orange-400/70 shadow transition-all duration-200 hover:shadow-xl min-h-0">
                <GlowingEffect spread={40} proximity={64} status="success" />
                <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center mb-3 shadow-lg border-4 border-zinc-900">
                  <Avatar
                    src="/images/team/KarthikeyanH.png"
                    alt="Karthikeyan"
                    size={64}
                    className="w-full h-full"
                  />
                </div>
                <h3 className="text-base font-bold text-white text-center whitespace-normal break-words w-full">
                  Dr. H. Karthikeyan
                </h3>
                <p className="text-sm text-orange-400 mt-1 text-center">Faculty Mentor</p>
                <a
                  href="https://www.srmist.edu.in/faculty/h-karthikeyan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-orange-400 hover:text-orange-300 hover:underline transition-colors mt-2 outline-none text-center leading-tight"
                  aria-label="Visit Dr. H. Karthikeyan profile"
                >
                  <span className="hidden max-[360px]:block">
                    Department<br />Of<br />Networking And Communications
                  </span>
                  <span className="max-[360px]:hidden whitespace-nowrap">Department of Networking And Communications</span>
                </a>
              </article>
            </div>
            <h2 id="core-team-heading" className="text-2xl sm:text-3xl font-bold text-orange-400 mb-6 mt-2">
              Core Team
            </h2>
            {coreLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                {[...Array(5)].map((_, i) => <TeamMemberSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                {coreTeam.map((member: TeamMember) => (
                  <article
                    key={member.name}
                    className="relative flex flex-col items-center rounded-2xl p-6 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 hover:border-orange-400/70 shadow transition-all duration-200 hover:shadow-xl focus-within:border-orange-400/70 focus-within:shadow-xl min-h-[180px] cursor-pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${member.name}'s profile`}
                  >
                    <GlowingEffect spread={40} proximity={64} status="success" />
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center mb-5 shadow-lg border-4 border-zinc-900">
                      {member.img ? (
                        <Avatar
                          src={member.img}
                          alt={`${member.name}'s profile picture`}
                          size={80}
                          className="w-full h-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white" aria-hidden="true">
                          {member.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white text-center whitespace-normal break-words w-full">
                      {member.name}
                    </h3>
                    {member.role && (
                      <p className="text-sm text-orange-400 mt-1 text-center">{member.role}</p>
                    )}
                    {member.year && (
                      <p className="text-sm text-orange-400 mt-2">{member.year}</p>
                    )}
                    {member.links.portfolio && (
                      <a
                        href={member.links.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-orange-400 hover:text-orange-300 hover:underline transition-colors mb-3 outline-none"
                        aria-label={`Visit ${member.name}'s portfolio`}
                      >
                        {member.links.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                    <nav className="flex flex-row flex-wrap justify-center gap-3 mt-4 w-full" aria-label={`${member.name}'s social links`}>
                      {member.links.instagram && (
                        <a
                          href={member.links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-orange-400 transition-colors p-1 rounded outline-none"
                          aria-label={`${member.name}'s Instagram profile`}
                        >
                          <FaInstagram size={20} />
                        </a>
                      )}
                      <a
                        href={member.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-orange-400 transition-colors p-1 rounded outline-none"
                        aria-label={`${member.name}'s LinkedIn profile`}
                      >
                        <FaLinkedin size={20} />
                      </a>
                      <a
                        href={member.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-orange-400 transition-colors p-1 rounded outline-none"
                        aria-label={`${member.name}'s GitHub profile`}
                      >
                        <FaGithub size={20} />
                      </a>
                    </nav>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Founding Team */}
          <section aria-labelledby="founding-team-heading">
            <h2 id="founding-team-heading" className="text-2xl sm:text-3xl font-bold text-orange-400 mb-6 mt-12">
              Founding Team
            </h2>

            {foundingTeamLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                {[...Array(5)].map((_, i) => <TeamMemberSkeleton key={`collab-skel-${i}`} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                {foundingTeam.map((member: TeamMember) => (
                  <article
                    key={member.name}
                    className="relative flex flex-col items-center rounded-2xl p-6 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 hover:border-orange-400/70 shadow transition-all duration-200 hover:shadow-xl focus-within:border-orange-400/70 focus-within:shadow-xl min-h-[180px] cursor-pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${member.name}'s profile`}
                  >
                    <GlowingEffect spread={40} proximity={64} status="success" />
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center mb-5 shadow-lg border-4 border-zinc-900">
                      {member.img ? (
                        <Avatar
                          src={member.img}
                          alt={`${member.name}'s profile picture`}
                          size={80}
                          className="w-full h-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white" aria-hidden="true">
                          {member.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white text-center whitespace-normal break-words w-full">
                      {member.name}
                    </h3>
                    {member.year && (
                      <p className="text-sm text-orange-400 mt-2">{member.year}</p>
                    )}
                    {member.links.portfolio && (
                      <a
                        href={member.links.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-orange-400 hover:text-orange-300 hover:underline transition-colors mb-3 outline-none"
                        aria-label={`Visit ${member.name}'s portfolio`}
                      >
                        {member.links.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                    <nav className="flex flex-row flex-wrap justify-center gap-3 mt-auto w-full" aria-label={`${member.name}'s social links`}>
                      {member.links.instagram && (
                        <a
                          href={member.links.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-orange-400 transition-colors p-1 rounded outline-none"
                          aria-label={`${member.name}'s Instagram profile`}
                        >
                          <FaInstagram size={20} />
                        </a>
                      )}
                      <a
                        href={member.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-orange-400 transition-colors p-1 rounded outline-none"
                        aria-label={`${member.name}'s LinkedIn profile`}
                      >
                        <FaLinkedin size={20} />
                      </a>
                      <a
                        href={member.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-orange-400 transition-colors p-1 rounded outline-none"
                        aria-label={`${member.name}'s GitHub profile`}
                      >
                        <FaGithub size={20} />
                      </a>
                    </nav>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Community Contributors - GitHub Style Grid */}
          <section className="relative" aria-labelledby="contributors-heading">
            <h2 id="contributors-heading" className="text-2xl sm:text-3xl font-bold text-orange-400 mb-6">
              Contributors
            </h2>
            
            {allContributorsLoading ? (
              <ContributorsSkeleton />
            ) : (
              <>
  {/* Render contributors as a simple responsive grid */}
  <ContributorsGrid contributors={allContributors} />
              </>
            )}

            {/* Profile Card Overlay */}
            {activeContributor !== null && allContributors[activeContributor] && (
              <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="contributor-modal-title"
              >
                <div 
                  ref={cardRef}
                  className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-xl cursor-pointer"
                  onClick={() => handleCardClick(allContributors[activeContributor].links.linkedin!)}
                >
                  <button 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 p-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseCard();
                    }}
                    aria-label="Close profile card"
                  >
                    <FaTimes size={20} />
                  </button>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shadow-lg">
                      <Avatar
                        src={allContributors[activeContributor].img}
                        alt={`${allContributors[activeContributor].name}'s profile picture`}
                        size={80}
                        className="w-full h-full"
                      />
                    </div>
                    
                    <h3 id="contributor-modal-title" className="text-2xl font-bold text-white mt-2">
                      {allContributors[activeContributor].name}
                    </h3>

                    {allContributors[activeContributor].role && (
                      <div className="text-orange-300 text-sm text-center mt-1">
                        {allContributors[activeContributor].role}
                      </div>
                    )}
                    
                    <div className="text-orange-400">
                      {allContributors[activeContributor].year}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connect Section */}
            <section className="w-full mt-12" aria-labelledby="connect-heading">
              <h2 id="connect-heading" className="text-2xl sm:text-3xl font-bold text-orange-400 mb-6">
                Connect with Us
              </h2>
              <div className="w-full flex justify-start">
                <SocialIconsHorizontal />
              </div>
            </section>

            {/* Legal & Policies Section */}
            <section className="w-full mt-12" aria-labelledby="legal-heading">
  <div className="mt-6 pt-6 border-t border-zinc-700">
    <div className="bg-gradient-to-r from-orange-500/10 to-zinc-800/50 rounded-xl p-4 border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-2">
      
      <p className="text-center text-sm text-gray-300 sm:text-left">
      © 2025 Studique. All rights reserved.
      </p>
      
      <Link 
        href="/termsofservice"
        className="flex items-center gap-2 text-sm text-white hover:text-orange-300 transition-all duration-200"
      >
        <span>Terms & Conditions</span>
        <FaExternalLinkAlt size={14} />
      </Link>

    </div>
  </div>
</section>


          </section>
        </main>
      </div>
    </div>
  );
};

  

export default About;