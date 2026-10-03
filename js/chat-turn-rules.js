const DISCUSSION_PHASES = new Set(['MORNING', 'VOTE']);
const CHAT_PHASES = new Set(['LOBBY', ...DISCUSSION_PHASES]);

const upper = value => String(value ?? '').trim().toUpperCase();
const idOf = value => String(value ?? '');

/** Resolve the host when the backend marks a host ID, a participant row, or
 * only the current player's private view. */
export function hostIdForState(state = {}) {
  const explicit = idOf(state?.game?.hostParticipantId);
  if (explicit) return explicit;
  const participant = (state?.participants || []).find(player => player?.isHost === true);
  if (participant?.id != null && idOf(participant.id)) return idOf(participant.id);
  const me = state?.me || {};
  return me.isHost === true ? idOf(me.id) : '';
}

/** IDs can cross JSON boundaries with different primitive types. */
export function isOtherPlayer(participant, playerId) {
  const target = idOf(participant?.id);
  const actor = idOf(playerId);
  return Boolean(target && actor && target !== actor);
}

/** True when the in-game composer should accept an ordinary player message. */
export function canPlayerChat({phase, channel, turnState, playerId} = {}) {
  const currentPhase = upper(phase);
  const currentChannel = String(channel ?? 'burrow').toLowerCase();
  const player = idOf(playerId);
  if (!player || !CHAT_PHASES.has(currentPhase) || currentChannel === 'narrator') return false;
  if (currentPhase === 'LOBBY' || !turnState?.mode) return true;
  return DISCUSSION_PHASES.has(currentPhase) && idOf(turnState.floorId) === player;
}

/** Rebuild the shared Turn Floor from the public chat event stream. */
export function replayTurnState(messages = [], hostId = '', participantIds = [], phase = '') {
  const currentPhase = upper(phase);
  if (!DISCUSSION_PHASES.has(currentPhase)) return {mode: false, floorId: '', queue: []};

  const host = idOf(hostId);
  const validIds = new Set((participantIds || []).map(idOf).filter(Boolean));
  const state = {mode: false, floorId: '', queue: []};

  for (const message of messages) {
    const command = String(message?.system ?? '');
    if (!command.startsWith('TURN:')) continue;

    const [, action, ...parts] = command.split(':');
    const arg = parts.join(':');
    const sender = idOf(message?.senderId);
    if (!sender || (validIds.size && !validIds.has(sender))) continue;
    const isHost = !!host && sender === host;

    if (action === 'MODE' && isHost) {
      state.mode = arg === 'ON';
      if (!state.mode) {
        state.floorId = '';
        state.queue = [];
      }
    } else if (action === 'REQUEST' && state.mode && sender !== state.floorId) {
      if (!state.queue.includes(sender)) state.queue.push(sender);
    } else if (action === 'CANCEL') {
      state.queue = state.queue.filter(id => id !== sender);
    } else if (action === 'GRANT' && isHost && state.mode && state.queue.includes(idOf(arg))) {
      state.floorId = idOf(arg);
      state.queue = state.queue.filter(id => id !== state.floorId);
    } else if (action === 'YIELD' && state.mode && sender === state.floorId) {
      state.floorId = '';
    } else if (action === 'CLEAR' && isHost && state.mode) {
      state.floorId = '';
    }
  }

  return state;
}
