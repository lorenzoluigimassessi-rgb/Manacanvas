// gradients.js — mana colour identity → CSS gradient + shimmer tint

const MANA_GRADIENTS = {
  W: 'var(--draw-gradient-W)',
  U: 'var(--draw-gradient-U)',
  B: 'var(--draw-gradient-B)',
  R: 'var(--draw-gradient-R)',
  G: 'var(--draw-gradient-G)',
  M: 'var(--draw-gradient-M)', // multicolour
  C: 'var(--draw-gradient-C)', // colourless
  L: 'var(--draw-gradient-L)', // land / other
};

const SHIMMER_TINTS = {
  W: 'rgba(220,200,140,0.07)',
  U: 'rgba(100,160,220,0.07)',
  B: 'rgba(160,120,220,0.07)',
  R: 'rgba(220,120,80,0.07)',
  G: 'rgba(100,180,100,0.07)',
  M: 'rgba(220,190,100,0.07)',
  C: 'rgba(200,200,220,0.05)',
  L: 'rgba(180,160,120,0.05)',
};

function getColourKey(colors) {
  if (!colors || colors.length === 0) return 'C';
  if (colors.length > 1) return 'M';
  return colors[0]; // W U B R G
}

function getGradient(colors) {
  return MANA_GRADIENTS[getColourKey(colors)] || MANA_GRADIENTS.C;
}

function getShimmerTint(colors) {
  return SHIMMER_TINTS[getColourKey(colors)] || SHIMMER_TINTS.C;
}
