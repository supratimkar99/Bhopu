export const initialRoundOf32 = [
  { id: 'r32-1', teamA: 'Germany', teamB: 'Paraguay', selected: '' },
  { id: 'r32-2', teamA: 'France', teamB: 'Sweden', selected: '' },
  { id: 'r32-3', teamA: 'South Africa', teamB: 'Canada', selected: '' },
  { id: 'r32-4', teamA: 'Netherlands', teamB: 'Morocco', selected: '' },
  { id: 'r32-5', teamA: 'Portugal', teamB: 'Croatia', selected: '' },
  { id: 'r32-6', teamA: 'Spain', teamB: 'Austria', selected: '' },
  { id: 'r32-7', teamA: 'USA', teamB: 'Bosnia & Herzegovina', selected: '' },
  { id: 'r32-8', teamA: 'Belgium', teamB: 'Senegal', selected: '' },
  { id: 'r32-9', teamA: 'Brazil', teamB: 'Japan', selected: '' },
  { id: 'r32-10', teamA: 'Ivory Coast', teamB: 'Norway', selected: '' },
  { id: 'r32-11', teamA: 'Mexico', teamB: 'Ecuador', selected: '' },
  { id: 'r32-12', teamA: 'England', teamB: 'DR Congo', selected: '' },
  { id: 'r32-13', teamA: 'Argentina', teamB: 'Cape Verde', selected: '' },
  { id: 'r32-14', teamA: 'Australia', teamB: 'Egypt', selected: '' },
  { id: 'r32-15', teamA: 'Switzerland', teamB: 'Algeria', selected: '' },
  { id: 'r32-16', teamA: 'Colombia', teamB: 'Ghana', selected: '' }
];

export function createNextRound(prevMatches, prefix) {
  return Array.from({ length: prevMatches.length / 2 }, (_, index) => {
    const matchA = prevMatches[index * 2];
    const matchB = prevMatches[index * 2 + 1];

    return {
      id: `${prefix}-${index + 1}`,
      teamA: matchA.selected || '',
      teamB: matchB.selected || '',
      selected: ''
    };
  });
}

export function createEmptyMatch(id) {
  return {
    id,
    teamA: '',
    teamB: '',
    selected: ''
  };
}
