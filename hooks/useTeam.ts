import { useQuery } from '@tanstack/react-query'
import { teamService, type TeamMember, type TeamStats } from '@/lib/teamService'

// Query keys for consistent cache management
export const teamQueryKeys = {
  all: ['team', 'v3'] as const,
  foundingTeam: () => [...teamQueryKeys.all, 'founding'] as const,
  coreTeam: () => [...teamQueryKeys.all, 'core'] as const,
  contributors: () => [...teamQueryKeys.all, 'contributors'] as const,
  stats: () => [...teamQueryKeys.all, 'stats'] as const,
  search: (query: string) => [...teamQueryKeys.all, 'search', query] as const,
  byYear: (year: string) => [...teamQueryKeys.all, 'year', year] as const,
}

export function useFoundingTeam() {
  return useQuery({
    queryKey: teamQueryKeys.foundingTeam(),
    queryFn: () => teamService.getFoundingTeam(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useCoreTeam() {
  return useQuery({
    queryKey: teamQueryKeys.coreTeam(),
    queryFn: () => teamService.getCoreTeam(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useContributors() {
  return useQuery({
    queryKey: teamQueryKeys.contributors(),
    queryFn: () => teamService.getContributors(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useTeamStats() {
  return useQuery({
    queryKey: teamQueryKeys.stats(),
    queryFn: () => teamService.getTeamStats(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useContributorsByYear(year: string) {
  return useQuery({
    queryKey: teamQueryKeys.byYear(year),
    queryFn: () => teamService.getContributorsByYear(year),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!year, // Only run if year is provided
  })
}

export function useSearchTeam(query: string) {
  return useQuery({
    queryKey: teamQueryKeys.search(query),
    queryFn: () => teamService.searchMembers(query),
    staleTime: 5 * 60 * 1000, // 5 minutes (shorter for search)
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: query.length >= 2, // Only search if query is at least 2 characters
  })
}

export function useAllTeamMembers() {
  return useQuery({
    queryKey: teamQueryKeys.all,
    queryFn: () => teamService.getAllMembers(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}
