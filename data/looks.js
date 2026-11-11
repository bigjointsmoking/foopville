// ============================================================
// LOOKS — the choices on the character creator screen.
// Add a colour to any list and it shows up as a new option.
// The hero picture is recoloured in the game (src/looks.js), so new
// colours don't need new Blender art. New hairstyles do.
// ============================================================
window.FUP = window.FUP || {};

FUP.looksData = {
  hairstyles: [
    { id: 'fringe',   name: 'Fringe' },
    { id: 'spiky',    name: 'Spiky' },
    { id: 'ponytail', name: 'Ponytail' },
    { id: 'bald',     name: 'Bald (aerodynamic)' },
  ],
  skin:   ['#f0c09a', '#e0a87a', '#c08458', '#8e5a36', '#5e3a22', '#f6dcc4'],
  hair:   ['#6b3d1f', '#2a1c14', '#d8a040', '#b8442a', '#e8e0d0', '#5a7ad8', '#d860a8'],
  outfit: ['#4f8a3a', '#3a6aa8', '#a8483a', '#7a4a9a', '#c8a03a', '#4a4a4a'],
  scarf:  ['#a33a2a', '#2a6a8a', '#d8b03a', '#3a8a4a', '#e8e0d0', '#8a3a8a'],

  // What a brand new character looks like before you change anything.
  default: { hairstyle: 'fringe', skin: '#f0c09a', hair: '#6b3d1f', outfit: '#4f8a3a', scarf: '#a33a2a' },

  nameMax: 14,   // letters
  // The dice button picks one of these. They're all a bit unfortunate.
  randomNames: [
    'Gordo', 'Pib', 'Sir Mildew', 'Tamsin', 'Bort', 'Wendle', 'Crumb', 'Ottoline', 'Flick',
    'Doug the Brave', 'Nim', 'Parsnip', 'Gertie', 'Rolo', 'Bramble', 'Mungo', 'Pemberton', 'Juno',
  ],
};
