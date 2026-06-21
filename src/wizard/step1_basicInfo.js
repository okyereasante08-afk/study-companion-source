export const stepBasicInfo = {
  title: "Let's set you up",
  sub: "First, a few basics. This stays on your device — nothing is sent anywhere.",

  render(body, state) {
    body.innerHTML = `
      <div style="margin-bottom:16px;">
        <label class="field-label">Your name</label>
        <input class="text-input" id="w-name" placeholder="e.g. Asante" maxlength="40" value="${escAttr(state.meta.name)}" />
      </div>
      <div style="margin-bottom:16px;">
        <label class="field-label">University / School (optional)</label>
        <input class="text-input" id="w-university" placeholder="e.g. KNUST" maxlength="60" value="${escAttr(state.meta.university)}" />
      </div>
      <div style="margin-bottom:16px;">
        <label class="field-label">Program / Major (optional)</label>
        <input class="text-input" id="w-program" placeholder="e.g. Biomedical Engineering" maxlength="60" value="${escAttr(state.meta.program)}" />
      </div>
      <div>
        <label class="field-label">What should your study assistant call itself?</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;" id="w-persona-chips"></div>
        <input class="text-input" id="w-persona-custom" placeholder="Or type your own…" maxlength="20" value="${escAttr(state.meta.personaName)}" />
      </div>
    `;

    const nameInput = body.querySelector('#w-name');
    const uniInput = body.querySelector('#w-university');
    const progInput = body.querySelector('#w-program');
    const personaCustom = body.querySelector('#w-persona-custom');
    const chipsWrap = body.querySelector('#w-persona-chips');

    nameInput.addEventListener('input', () => { state.meta.name = nameInput.value; });
    uniInput.addEventListener('input', () => { state.meta.university = uniInput.value; });
    progInput.addEventListener('input', () => { state.meta.program = progInput.value; });
    personaCustom.addEventListener('input', () => { state.meta.personaName = personaCustom.value; });

    const presets = ['Coach', 'Sir', 'Assistant', 'Tutor', 'Buddy'];
    presets.forEach(p => {
      const chip = document.createElement('button');
      chip.className = 'btn';
      chip.type = 'button';
      chip.textContent = p;
      const isActive = state.meta.personaName === p;
      chip.style.background = isActive ? 'var(--sage)' : 'var(--cream2)';
      chip.style.color = isActive ? '#fff' : 'var(--text2)';
      chip.addEventListener('click', () => {
        state.meta.personaName = p;
        personaCustom.value = p;
        Array.from(chipsWrap.children).forEach(c => {
          const active = c.textContent === p;
          c.style.background = active ? 'var(--sage)' : 'var(--cream2)';
          c.style.color = active ? '#fff' : 'var(--text2)';
        });
      });
      chipsWrap.appendChild(chip);
    });

    setTimeout(() => nameInput.focus(), 50);
  },

  validate(state) {
    if (!state.meta.name.trim()) return 'Please enter your name.';
    if (!state.meta.personaName.trim()) return 'Please choose what your assistant should be called.';
    return null;
  },
};

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
