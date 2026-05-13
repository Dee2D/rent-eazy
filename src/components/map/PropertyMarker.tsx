export function createPropertyMarkerElement(): HTMLDivElement {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const size = isMobile ? '28px' : '20px';

  const outer = document.createElement('div');
  outer.style.position = 'relative';
  outer.style.width = size;
  outer.style.height = size;
  outer.style.cursor = 'pointer';

  const dot = document.createElement('div');
  dot.style.width = '100%';
  dot.style.height = '100%';
  dot.style.borderRadius = '50%';
  dot.style.backgroundColor = '#F97316';
  dot.style.border = '3px solid white';
  dot.style.boxShadow = '0 2px 8px rgba(249,115,22,0.45)';
  dot.style.transition = 'transform 0.15s ease';

  outer.appendChild(dot);
  outer.addEventListener('mouseenter', () => { dot.style.transform = 'scale(1.25)'; });
  outer.addEventListener('mouseleave', () => { dot.style.transform = 'scale(1)'; });

  return outer;
}
