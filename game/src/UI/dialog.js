// Crew dialogue for SUNCOAST: HEATLINE.
// One clear job: the dialog box — named crew member, role, coloured
// portrait dot, and their line. Auto-hides after 6 s in play, stays up
// in screenshot mode so the mission shot reads.

export function createDialog(G) {
  G.dialog = { timer: 0 };
  G.showDialog = (d) => {
    const box = document.getElementById('dialogBox');
    if (!box) return;
    const portrait = document.getElementById('dialogPortrait');
    const name = document.getElementById('dialogName');
    const role = document.getElementById('dialogRole');
    const text = document.getElementById('dialogText');
    if (portrait) {
      portrait.textContent = d.name[0];
      portrait.style.background = d.portrait === 'rae' ? '#ff6b6b' : d.portrait === 'sable' ? '#ffd166' : '#4ecdc4';
    }
    if (name) name.textContent = d.name;
    if (role) role.textContent = d.role;
    if (text) text.textContent = d.text;
    box.classList.remove('hidden');
    G.dialog.timer = 6;
  };
  G.hideDialog = () => {
    const box = document.getElementById('dialogBox');
    if (box) box.classList.add('hidden');
  };
}

export function updateDialog(G, dt) {
  if (!G.dialog) return;
  if (G.dialog.timer > 0 && !G.shotMode) {
    G.dialog.timer -= dt;
    if (G.dialog.timer <= 0) G.hideDialog();
  }
}
