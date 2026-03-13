/**
 * Event parser module.
 *
 * Currently returns mock data so the UI is fully functional without a backend.
 * When the real backend is ready, replace the body of `parseEvent` with an API call:
 *
 *   const res = await fetch('/api/parse-event', {
 *     method: 'POST',
 *     body: JSON.stringify(input),
 *     headers: { 'Content-Type': 'application/json' },
 *   });
 *   return res.json();
 */

const MOCK_EVENTS = {
  image: {
    title: 'AI Startup Mixer',
    date: '2025-04-14',
    startTime: '18:30',
    endTime: '21:00',
    location: 'Atlanta Tech Village, Atlanta, GA',
    description: 'Networking event with food & drinks provided. Meet founders and investors.',
    organizer: 'Atlanta Tech Community',
  },
  text: {
    title: 'Team Lunch',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '13:30',
    location: 'Ponce City Market',
    description: 'Casual team gathering',
    organizer: 'Team Lead',
  },
};

/**
 * @param {{ type: 'image' | 'text', data: string }} input
 * @returns {Promise<Object>} Parsed event data
 */
export async function parseEvent(input) {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const base = input.type === 'image' ? MOCK_EVENTS.image : MOCK_EVENTS.text;

  return {
    ...base,
    // If the user pasted text, use it as the description
    description: input.type === 'text' && input.data ? input.data : base.description,
    id: Date.now(),
  };
}
