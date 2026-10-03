/* Ferret Frenzy dossier alignment layer.
   Frontend-only: derives UI from the already-authorized game.state view and never
   assigns roles, rolls dice, resolves votes, or changes backend state. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const upper = v => String(v ?? '').trim().toUpperCase();
  let lastSignature = '';

  function participantName(state, id) {
    const p = (state?.participants || []).find(x => String(x.id) === String(id));
    return p ? `Player ${p.seat || '?'}${p.displayName ? ` · ${p.displayName}` : ''}` : String(id || 'another player');
  }
  function factType(f) { return upper(f?.type); }
  function idsFrom(f) {
    const ids = [];
    for (const key of ['participantId','targetId','targetAId','targetBId','partnerId','guardianId','hunterId']) if (f?.[key]) ids.push(f[key]);
    for (const key of ['participants','candidates','targets']) for (const p of (Array.isArray(f?.[key]) ? f[key] : [])) ids.push(p?.participantId || p?.id);
    return ids.filter(Boolean);
  }
  function renderList(id, rows, className='') {
    const list = $(id); if (!list) return;
    list.innerHTML = '';
    const unique = [...new Set(rows.filter(Boolean))];
    if (!unique.length) {
      const li = document.createElement('li'); li.textContent = 'No additional confirmed information yet.'; list.append(li); return;
    }
    for (const row of unique) { const li = document.createElement('li'); li.textContent = row; if (className) li.className = className; list.append(li); }
  }
  function teamworkRows(state) {
    const me = state?.me || {}, facts = Array.isArray(me.privateFacts) ? me.privateFacts : [], rows = [];
    if (me.isRaider === true) rows.push('You are the historical Raider. Moving your card later cannot move or erase Raider status.');
    if (me.troubleAccomplice === true) rows.push('You are In On It. Trouble accomplice status follows you, not your current card.');
    if (me.hunterConverted === true) rows.push('You converted to the Bandit side. Guardian is not automatically told.');
    for (const f of facts) {
      const t = factType(f);
      if (t === 'BANDIT_ROSTER') {
        const names = (f.participants || []).map(x => x.displayName || participantName(state, x.participantId)).join(', ');
        rows.push(`Starting Bandit roster: ${names || 'known privately'}.`);
      } else if (t === 'RAIDER_IDENTITY') rows.push(`Historical Raider: ${f.displayName || participantName(state, f.participantId)}.`);
      else if (t === 'SNUGGLE_BOND') rows.push(`Snuggle-Bonded with ${f.displayName || participantName(state, f.participantId)}. The bond follows players even if cards move.`);
      else if (t === 'SNUGGLER_BOND_SET') rows.push('Your Snuggle Bond pair is locked; the bond is player-bound, not card-bound.');
      else if (t === 'HUNTER_RECOGNITION') rows.push(`You recognize ${f.displayName || participantName(state, f.participantId)} as the starting Hunter. This does not reveal later conversion.`);
      else if (t === 'GUARDIAN_RECOGNITION') rows.push(`You recognize ${f.displayName || participantName(state, f.participantId)} as the starting Guardian.`);
      else if (t === 'HUNTER_CONVERSION') rows.push(f.converted ? 'Your Hunter conversion roll converted you to the Bandit side.' : 'Your Hunter conversion roll left you on the Business side.');
      else if (t === 'TROUBLE_CONVERTED') rows.push(`You became In On It during Hour ${f.hour || '?'}.`);
      else if (t === 'GUARDIAN_PROTECTION') rows.push(`Your protection is locked on ${f.displayName || participantName(state, f.participantId || f.targetId)}.`);
      else if (t === 'HUNT_MARK') rows.push(`Your Hunt Mark is on ${f.displayName || participantName(state, f.participantId || f.targetId)}.`);
    }
    return rows;
  }
  function tamperingRows(state) {
    const me = state?.me || {}, facts = Array.isArray(me.privateFacts) ? me.privateFacts : [], rows = [];
    for (const f of facts) {
      const t = factType(f);
      if (t === 'TROUBLE_SWAP') {
        const a = f.displayNameA || participantName(state, f.targetAId);
        const b = f.displayNameB || participantName(state, f.targetBId);
        rows.push(`Blind swap: ${a} ↔ ${b}. You know the positions moved, not the hidden identities of those cards.`);
      } else if (t === 'DOOKER_HAMMOCK_PEEK') rows.push(`Dooker viewed Hammock ${Number(f.hammockIndex) + 1}: ${String(f.role || 'a private card').replaceAll('_',' ')}.`);
      else if (t === 'DOOKER_TRIP') rows.push(`Dooker Trip moved the viewed Hammock ${Number(f.hammockIndex) + 1} card onto ${f.displayName || participantName(state, f.participantId || f.targetId)}; the displaced player card was not revealed by the Trip.`);
      else if (/SWAP|TRIP|CARD_MOV|HAMMOCK/.test(t) && !['DOOKER_HAMMOCK_PEEK','DOOKER_TRIP','TROUBLE_SWAP'].includes(t)) {
        const names = idsFrom(f).map(id => participantName(state,id)).join(' / ');
        rows.push(`${String(f.type || 'Card movement').replaceAll('_',' ')}${names ? ` · ${names}` : ''}.`);
      }
    }
    if (!rows.length) rows.push('No card movement has been confirmed to you. A hidden swap may still have occurred; do not treat absence here as proof that cards are unchanged.');
    return rows;
  }
  function updateSleepAndCrime(state) {
    const phase = upper(state?.game?.phase), hour = Number(state?.game?.currentHour || 0), prompt = state?.me?.actionPrompt || {};
    const sleeping = phase === 'NIGHT' && upper(prompt.kind) === 'SLEEP';
    const sleepText = $('sleepStateText');
    if (sleepText) sleepText.textContent = sleeping ? `SLEEPING · HOUR ${hour || '?'} / 12 · HUD CLOCK CONTINUES ABOVE` : 'SLEEPING · BURROW CLOCK CONTINUES ABOVE';
    const crimeHint = $('crimeActionHint');
    if (crimeHint) crimeHint.hidden = !(phase === 'NIGHT' && window.FFMinnowHitbox?.canSteal?.());
  }

  function renderResultsNotes(state) {
    const box = $('resultsDossierNotes'); if (!box || upper(state?.game?.phase) !== 'RESULTS') return;
    box.innerHTML = '';
    const rows = [];
    for (const p of (state.participants || [])) {
      const label = `Player ${p.seat || '?'}${p.displayName ? ` · ${p.displayName}` : ''}`;
      const started = String(p.startingRole || '').replaceAll('_',' ');
      const finalCard = String(p.currentCard || p.startingRole || '').replaceAll('_',' ');
      if (started && finalCard && upper(started) !== upper(finalCard)) rows.push(`${label}: ${started} → ${finalCard} (Current Card moved; Starting Role history is unchanged).`);
      if (p.isRaider === true) rows.push(`${label}: historical Raider${p.caught ? ' · CAUGHT' : ' · ESCAPED'}.`);
      if (p.troubleAccomplice === true) rows.push(`${label}: Trouble accomplice / In On It status was player-bound.`);
      if (p.hunterConverted === true) rows.push(`${label}: Hunter converted to Bandit side; conversion was player-bound.`);
      if (p.caught === true && p.isRaider !== true) rows.push(`${label}: caught/revealed by Paw Point or a secondary resolution effect.`);
    }
    if (!rows.length) rows.push('No public card movement or player-bound status details were returned in this result view. The card reveal above remains authoritative for what this client may display.');
    const ul=document.createElement('ul');ul.className='trail-list';for(const row of rows){const li=document.createElement('li');li.textContent=row;ul.append(li)}box.append(ul);
  }

  function update() {
    const state = window.FFNetwork?.getState?.(); if (!state?.game) return;
    const facts = state?.me?.privateFacts || [];
    const publicDigest = (state.participants || []).map(p => [p.id,p.startingRole,p.currentCard,p.caught,p.isRaider,p.troubleAccomplice,p.hunterConverted]);
    const signature = JSON.stringify([state.game.phase,state.game.currentHour,state.me?.actionPrompt?.kind,state.me?.actionPrompt?.type,state.me?.isRaider,state.me?.troubleAccomplice,state.me?.hunterConverted,facts,publicDigest]);
    if (signature === lastSignature) { updateSleepAndCrime(state); return; }
    lastSignature = signature;
    renderList('privateTeamwork', teamworkRows(state), 'fact-conversion');
    renderList('privateTampering', tamperingRows(state), 'fact-movement');
    updateSleepAndCrime(state);
    renderResultsNotes(state);
    document.documentElement.dataset.roleDeal = 'backend-random';
    document.documentElement.dataset.cardStateModel = 'starting-current-status-separated';
  }
  window.addEventListener('ferret-frenzy-treat-stolen', () => { const hint=$('crimeActionHint'); if(hint) hint.hidden=true; });
  window.addEventListener('ff-role-card-acknowledged', update);
  const timer = setInterval(update, 500);
  update();
  window.addEventListener('pagehide', () => clearInterval(timer), {once:true});
})();
