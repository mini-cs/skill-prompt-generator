export function createStore(initial) {
  let state = initial;
  const subs = new Set();

  function notify(force) {
    for (const sub of [...subs]) {
      if (!subs.has(sub)) continue;
      const next = sub.select(state);
      if (!force && Object.is(next, sub.last)) continue;
      // 부르기 전에 갱신해야 구독자 안의 set이 같은 구독자를 다시 부르지 않는다
      sub.last = next;
      sub.fn(state);
    }
  }

  return {
    get: () => state,
    set(patch) {
      const next = { ...state };
      for (const k of Object.keys(patch)) next[k] = { ...state[k], ...patch[k] };
      state = next;
      notify(false);
    },
    subscribe(fn, select = (s) => s) {
      const sub = { fn, select, last: select(state) };
      subs.add(sub);
      return () => subs.delete(sub);
    },
    emit: () => notify(true),
  };
}
