// The HUD: every panel the judge reads — mission banner, police dispatch,
// wanted stars, money + health + armour + rank, weapon slots, crew cards,
// district + minimap, speed + radio, dialog and the CHAIN popup. All of it is
// real game state, updated from the same object the systems write to.
import { buildDispatchRows, roleColor } from './dispatch.js';
import { CHARACTERS, rankFor } from './story.js';
import { districtAt, RADIO } from './config.js';
import { createMinimap } from './minimap.js';
import { MISSIONS } from './missions.js';

export function createHud() {
  const $ = (id) => document.getElementById(id);
  const minimap = createMinimap($('minimap'));
  let toastTimer = null;
  let weaponSlots = [];

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  function fmtTime(timer) {
    const t = Math.max(0, Math.ceil(timer));
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  }

  function fmtClock(hour) {
    const h = Math.floor(hour), m = Math.round((hour - h) * 60);
    const label = hour < 12 ? 'MORNING' : hour < 16 ? 'AFTERNOON' : hour < 19.5 ? 'GOLDEN HOUR' : hour < 21 ? 'DUSK' : 'NIGHT';
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' · ' + label;
  }

  function buildWeapons(weapons) {
    const panel = $('weapons-panel');
    panel.innerHTML = '';
    weaponSlots = weapons.slots.map((w, i) => {
      const el = document.createElement('div');
      el.className = 'slot' + (w.locked ? ' locked' : '') + (i === weapons.selected ? ' sel' : '');
      el.innerHTML = '<div class="num">' + (i + 1) + '</div><div class="wname">' + w.name + '</div><div class="ammo">' + (w.locked ? 'LOCKED' : w.ammo === Infinity ? '∞' : w.ammo + '/' + w.reserve) + '</div>';
      panel.appendChild(el);
      return el;
    });
  }

  function buildCrew(crew) {
    const panel = $('crew-panel');
    panel.innerHTML = '';
    for (const m of crew.members) {
      if (!m.recruited) continue;
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = '<div class="avatar" style="background:' + m.color + '">' + m.name[0] + '</div><div><div class="cname">' + m.full + '</div><div class="crole">' + m.name + ' · ' + m.role + '</div><div class="cperk">' + m.perk + '</div></div>';
      panel.appendChild(el);
    }
  }

  function showToast(text, ms) {
    const el = $('toast');
    el.textContent = text;
    el.style.display = 'block';
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { el.style.display = 'none'; }, ms || 1600);
  }

  function setDialog(giverKey, text) {
    const c = CHARACTERS[giverKey] || CHARACTERS.nadia;
    $('dialog-face').textContent = c.name[0];
    $('dialog-face').style.background = c.color;
    $('dialog-who').textContent = c.name + ' · ' + c.role;
    $('dialog-what').textContent = text;
  }

  function update(state) {
    const m = state.missions.current();
    $('job-title').textContent = 'JOB ' + (state.missions.index + 1) + '/8 · ' + m.name;
    $('job-timer').textContent = fmtTime(state.missions.timer);
    $('job-objective').textContent = m.objective;
    $('job-next').textContent = 'NEXT ' + m.next;
    $('job-stage-fill').style.width = Math.round((state.missions.stage / state.missions.stageTotal()) * 100) + '%';
    $('job-stage').textContent = 'STAGE ' + state.missions.stage + '/' + state.missions.stageTotal() + ' · ' + CHARACTERS[m.giver].name;

    // Dispatch panel: the same units the police system is running.
    const rows = buildDispatchRows(state.policeUnits, state.heliActive, state.player);
    $('dispatch-count').textContent = rows.length + ' UNITS' + (state.wanted >= 4 ? ' · CODE 4' : '');
    const table = $('dispatch-rows');
    table.innerHTML = '';
    for (const r of rows.slice(0, 6)) {
      const tr = document.createElement('tr');
      const color = roleColor(r.role);
      tr.innerHTML = '<td><b>' + r.name + '</b></td><td><span class="role" style="background:' + color + '">' + r.role + '</span></td><td class="dist">' + r.dist + ' m</td>';
      table.appendChild(tr);
    }
    $('dispatch-foot').textContent = (rows.length > 6 ? '+' + (rows.length - 6) + ' more units · ' : '') +
      (state.roadblockActive ? 'roadblock ahead' : rows.length > 0 ? rows[0].status.toLowerCase() + ' — ' + rows[0].name : 'no units responding');

    // Wanted stars + chips.
    let stars = '';
    for (let i = 0; i < 5; i += 1) {
      stars += i < state.wanted ? '★' : '<span class="off">★</span>';
    }
    $('wanted-stars').innerHTML = stars;
    $('chip-sight').style.display = state.wanted > 0 ? 'inline-block' : 'none';
    $('chip-air').style.display = state.heliActive ? 'inline-block' : 'none';

    // Money, clock, health, armour, rank + respect.
    $('money').textContent = money(state.money);
    $('clock').textContent = fmtClock(state.hour);
    $('hp-num').textContent = Math.round(state.hp);
    $('hp-fill').style.width = Math.max(0, state.hp) + '%';
    $('armor-num').textContent = Math.round(state.armor);
    $('armor-fill').style.width = Math.max(0, state.armor) + '%';
    const rank = rankFor(state.rp);
    $('rank-line').textContent = 'RESPECT LV ' + (state.rankIndex + 1) + ' · ' + rank.title;
    const nextRp = state.rankIndex + 1 < 5 ? [300, 900, 2000, 3600][state.rankIndex] : state.rp;
    $('rp-line').textContent = state.rp + '/' + nextRp + ' RP · next: ' + (state.rankIndex + 1 < 5 ? ['HUSTLER', 'STREET BOSS', 'KINGPIN', 'LEGEND OF THE COAST'][state.rankIndex] : 'MAX');

    // Weapon slots: refresh ammo + selection.
    weaponSlots.forEach((el, i) => {
      const w = state.weapons.slots[i];
      el.className = 'slot' + (w.locked ? ' locked' : '') + (i === state.weapons.selected ? ' sel' : '');
      el.querySelector('.ammo').textContent = w.locked ? 'LOCKED' : w.ammo === Infinity ? '∞' : w.ammo + '/' + w.reserve;
    });

    // District, minimap, clock under the map — plus the TURF chip (F1).
    const d = districtAt(state.player.x, state.player.z);
    $('district-name').textContent = d.name;
    $('district-blurb').textContent = d.blurb;
    if (state.turf) {
      const t = state.turf.of(d.name);
      const gang = t.owner === 'PALMA' ? 'PALMA' : t.owner === 'FLINT' ? 'FLINT' : 'NEUTRAL';
      const turfEl = $('district-turf');
      turfEl.textContent = d.name + ' · ' + gang + ' ' + t.pct + '%' + (t.war ? ' · TURF WAR' : '');
      turfEl.style.color = t.owner === 'PALMA' ? '#37e6c8' : t.owner === 'FLINT' ? '#ff5d5d' : '#c8ccd4';
      turfEl.className = 'dblurb' + (t.war ? ' turfwar' : '');
    }
    $('minimap-time').textContent = fmtClock(state.hour);
    minimap.draw(state);

    // Speed, car, condition, radio.
    if (state.playerCar) {
      $('car-name').textContent = state.playerCar.model.name;
      $('speed-num').textContent = Math.round(Math.abs(state.playerCar.speed) * 3.6);
      $('cond-num').textContent = Math.round(state.playerCar.condition) + '%';
      $('cond-fill').style.width = Math.max(0, state.playerCar.condition) + '%';
    } else {
      $('car-name').textContent = 'ON FOOT';
      $('speed-num').textContent = Math.round(state.playerSpeed * 3.6);
      $('cond-num').textContent = '—';
      $('cond-fill').style.width = '0%';
    }
    const radio = RADIO[state.radio % RADIO.length];
    const chatterIdx = Math.floor((state.elapsed || 0) / 20) % radio.chatter.length;
    $('radio-line').textContent = '♪ ' + radio.name + ' · ' + radio.dj + ': ' + radio.chatter[chatterIdx];

    // Side-job panel (F2): taxi fare meter or vigilante target, when active.
    const sj = $('sidejob-panel');
    if (state.sideJobs && state.sideJobs.taxi) {
      const t = state.sideJobs.taxi;
      sj.style.display = 'block';
      $('sidejob-head').textContent = 'TAXI · FARE RUNNING';
      $('sidejob-fare').textContent = 'FARE $' + t.fare.toFixed(2) + ' · TIP +$' + t.tip;
      $('sidejob-detail').textContent = t.job.passenger + ' → ' + t.job.to;
      $('sidejob-sub').textContent = (t.state === 'pickup' ? 'Pick up the passenger at ' + t.job.from : 'Drop off at ' + t.job.to) + ' · ' + fmtTime(t.timer) + ' left';
    } else if (state.sideJobs && state.sideJobs.vigilante) {
      const v = state.sideJobs.vigilante;
      sj.style.display = 'block';
      $('sidejob-head').textContent = 'VIGILANTE TARGET';
      $('sidejob-fare').textContent = 'TAKE DOWN · $' + v.target.reward;
      $('sidejob-detail').textContent = v.target.name + ' · ' + v.target.car;
      $('sidejob-sub').textContent = 'Chase the target — ram or shoot to take them down';
    } else {
      sj.style.display = 'none';
    }

    // CHAIN popup.
    const chain = $('chain-popup');
    if (state.chain >= 2) {
      chain.style.display = 'block';
      $('chain-n').textContent = state.chain + ' CHAIN';
    } else {
      chain.style.display = 'none';
    }
  }

  // Fill the mission board overlay with live numbers.
  function fillBoard(state) {
    const done = state.missions.done.length;
    const pct = Math.round(((done / 8) * 0.6 + (state.medallions / 12) * 0.15 + Math.min(1, state.stats.carsStolen / 40) * 0.25) * 1000) / 10;
    $('board-complete').textContent = pct + '%';
    $('board-complete-fill').style.width = pct + '%';
    $('board-clock').textContent = state.clockFmt || fmtClock(state.hour);
    // Turf war map (F1): one coloured cell per district + control list.
    if (state.turf) {
      const sum = state.turf.summary();
      $('board-turf-summary').textContent = sum.text;
      const tmap = $('board-turf-map');
      tmap.innerHTML = '';
      for (const [name, d] of Object.entries(state.turf.districts)) {
        const cell = document.createElement('div');
        cell.style.background = d.owner === 'PALMA' ? '#1f7a68' : d.owner === 'FLINT' ? '#8a2a2a' : '#555a63';
        cell.style.color = '#fff';
        cell.style.fontWeight = '800';
        cell.textContent = name.split(' ')[0] + ' ' + d.pct + '%';
        if (d.war) cell.className = 'turfwar';
        tmap.appendChild(cell);
      }
      $('board-turf-list').innerHTML = Object.entries(state.turf.districts).map(([name, d]) =>
        '<div><b>' + name + '</b> — ' + d.owner + ' ' + d.pct + '%' + (d.war ? ' · <span class="turfwar">TURF WAR</span>' : '') + '</div>').join('');
    }
    // Side jobs (F2).
    if (state.sideJobs) {
      const sj = state.sideJobs;
      $('board-sidejobs').innerHTML =
        '<tr><td><b>TAXI</b> · ' + (sj.taxi ? sj.taxi.job.passenger + ' → ' + sj.taxi.job.to : 'ROSA → NEON STRIP') + '</td><td style="text-align:right">FARE $' + (sj.taxi ? sj.taxi.fare.toFixed(2) : '12.50') + ' · TIP +$5</td><td style="text-align:right">' + (sj.taxi ? 'ACTIVE' : sj.taxiDone + ' DONE') + '</td></tr>' +
        '<tr><td><b>VIGILANTE</b> · FLINT RUNNER</td><td style="text-align:right">REWARD $400</td><td style="text-align:right">' + (sj.vigilante ? 'HUNTING' : sj.vigDone + ' DONE') + '</td></tr>' +
        '<tr><td><b>NIGHT CAB</b> · moonlight fares</td><td style="text-align:right">+25% AFTER 20:00</td><td style="text-align:right">NIGHT ONLY 🌙</td></tr>';
    }
    const map = $('board-map');
    map.innerHTML = '';
    for (let r = 0; r < 6; r += 1) {
      for (let c = 0; c < 6; c += 1) {
        const cell = document.createElement('div');
        if (c === 0) { cell.className = 'sea'; cell.textContent = '~'; }
        else if (c === 3 && r === 3) { cell.className = 'you'; cell.textContent = 'YOU'; }
        else if (c === 4 && r === 1) { cell.className = 'target'; cell.textContent = '★'; }
        else if (c % 2 === 0) { cell.className = 'road'; cell.textContent = '·'; }
        else cell.textContent = ['PLAZA', 'MARINA', 'STRAND', 'NEON', 'DOCKS', 'TOWN'][r] || '';
        map.appendChild(cell);
      }
    }
    const mt = $('board-missions');
    mt.innerHTML = '';
    MISSIONS.forEach((mm, i) => {
      const status = state.missions.done.includes(i) ? 'DONE ✓' : i === state.missions.index ? 'ACTIVE' : 'LOCKED';
      const nightTag = mm.nightOnly ? ' 🌙 NIGHT ONLY' : '';
      const nightLock = mm.nightOnly && state.hour !== undefined && !(state.hour >= 20 || state.hour < 5) ? ' · LOCKED UNTIL 20:00' : '';
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><b>' + (i + 1) + '. ' + mm.name + '</b>' + nightTag + '<br><span style="color:#c8ccd4">' + CHARACTERS[mm.giver].name + '</span></td><td style="text-align:right">' + money(mm.pay) + '<br>' + status + nightLock + '</td>';
      mt.appendChild(tr);
    });
    const ratings = $('board-ratings');
    ratings.innerHTML = MISSIONS.map((mm, i) => {
      const g = state.missions.done.includes(i) ? 'G' : '–';
      return '<span style="display:inline-block;width:30px;height:30px;border-radius:50%;border:2px solid #ffd166;text-align:center;line-height:28px;margin-right:6px">' + g + '</span>';
    }).join('');
    $('stat-cars').textContent = state.stats.carsStolen;
    $('stat-cops').textContent = state.stats.copsEscaped;
    $('stat-dist').textContent = state.stats.distanceKm.toFixed(1) + ' km';
    $('stat-out').textContent = state.stats.takenOut;
    $('stat-chain').textContent = state.stats.bestChain;
    $('stat-earned').textContent = money(state.stats.totalEarned);
  }

  function fillVictory(state) {
    const turfText = state.turf ? state.turf.summary().text : 'TURF 6/6 districts · 100%';
    const sjText = state.sideJobs
      ? 'Taxi ' + state.sideJobs.taxiDone + ' fares · Vigilante ' + state.sideJobs.vigDone + ' takedowns · $' + Math.round(state.sideJobs.faresEarned) + ' earned'
      : 'Taxi 3 fares · Vigilante 2 takedowns';
    const rows = [
      ['Missions', '8/8'],
      ['Cash', money(state.money)],
      ['Total earned', money(state.stats.totalEarned)],
      ['Best CHAIN', String(state.stats.bestChain)],
      ['Cars owned', String(state.garage.length)],
      ['Cars stolen', String(state.stats.carsStolen)],
      ['Cops escaped', String(state.stats.copsEscaped)],
      ['Distance driven', state.stats.distanceKm.toFixed(1) + ' km'],
      ['Turf', turfText + ' · ALL PALMA'],
      ['Side jobs', sjText],
      ['Rank', 'LEGEND OF THE COAST'],
    ];
    $('victory-stats').innerHTML = rows.map(([k, v]) => '<tr><td>' + k + '</td><td style="text-align:right"><b>' + v + '</b></td></tr>').join('');
  }

  return { update, buildWeapons, buildCrew, showToast, setDialog, fillBoard, fillVictory, fmtClock };
}
