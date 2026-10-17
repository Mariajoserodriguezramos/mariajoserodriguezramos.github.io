// Activa los estilos que dependen de JS (si JS falla, todo se ve igual)
document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Modo claro / oscuro. El modo inicial lo pone el script del <head>;
// al cambiarlo se lanza "themechange" para que los dibujos se repinten con sus colores
const themeToggle = document.querySelector('.theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme, remember) {
  document.documentElement.dataset.theme = theme;
  // Hechizos de Harry Potter: «Lumos» enciende la luz, «Nox» la apaga
  themeToggle.title = theme === 'dark' ? 'Lumos' : 'Nox';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Lumos: cambiar a modo claro' : 'Nox: cambiar a modo oscuro');

  // Color de la barra del navegador en el móvil
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.content = theme === 'dark' ? '#15110e' : '#f7f2ea';
  });

  if (remember) {
    try { localStorage.setItem('theme', theme); } catch (e) { /* sin almacenamiento: solo dura esta visita */ }
  }

  document.dispatchEvent(new Event('themechange'));
}

if (themeToggle) {
  setTheme(document.documentElement.dataset.theme, false);

  themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });

  // Si nunca has pulsado el botón, sigue los cambios del sistema
  systemDark.addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) { /* nada */ }
    if (!saved) setTheme(e.matches ? 'dark' : 'light', false);
  });
}

// Verbo y palabra que cambian juntos en la portada ("Pienso cada clic"...)
const rotator = document.querySelector('.rotator');

if (rotator && !reduceMotion) {
  const pairs = rotator.dataset.pairs.split(',').map((pair) => pair.split('|'));
  const verb = rotator.querySelector('.rotator__verb');
  const word = rotator.querySelector('.rotator__word');
  let i = 0;

  setInterval(() => {
    rotator.classList.add('is-out');

    setTimeout(() => {
      i = (i + 1) % pairs.length;
      [verb.textContent, word.textContent] = pairs[i];
      rotator.classList.remove('is-out');
    }, 350);
  }, 3000);
}

// Sol pixelado: se dibuja en un lienzo pequeño y CSS lo amplía sin suavizar
const sun = document.querySelector('.sun');
const canvas = document.querySelector('.sun__canvas');

function mixColor(a, b, t) {
  const hex = (c) => c.trim().replace('#', '').match(/../g).map((h) => parseInt(h, 16));
  const [ca, cb] = [hex(a), hex(b)];
  return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * t)).join(',')})`;
}

function drawSun() {
  const size = 40; // píxeles de lado
  const r = size / 2;
  const styles = getComputedStyle(document.documentElement);
  const top = styles.getPropertyValue('--sun-top');
  const bottom = styles.getPropertyValue('--sun-bottom');
  const ctx = canvas.getContext('2d');

  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    // Franjas horizontales en la mitad de abajo, cada vez más anchas
    const gap = y > size * 0.5 && (y % 4 === 0 || (y > size * 0.72 && y % 4 === 1));
    if (gap) continue;

    ctx.fillStyle = mixColor(top, bottom, y / (size - 1));

    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r);
      if (d > r) continue;

      // Borde "deshecho": tablero de ajedrez y más transparente
      const edge = d > r - 1.6;
      if (edge && (x + y) % 2 === 0) continue;

      ctx.globalAlpha = edge ? 0.55 : 1;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.globalAlpha = 1;
}

// Reflejo del sol en el mar: rayas de píxeles cada vez más cortas y transparentes
const reflection = document.querySelector('.reflection');

function drawReflection(shimmer) {
  const width = 40; // mismo ancho que el sol, así los píxeles miden igual
  const height = 11;
  const styles = getComputedStyle(document.documentElement);
  const top = styles.getPropertyValue('--sun-top');
  const bottom = styles.getPropertyValue('--sun-bottom');
  const ctx = reflection.getContext('2d');

  reflection.width = width;
  reflection.height = height;
  ctx.clearRect(0, 0, width, height);

  // Una raya cada dos filas, con hueco entre medias
  for (let i = 0, y = 0; y < height; i++, y += 2) {
    const jitter = shimmer ? Math.round(Math.random() * 6 - 3) : 0;
    const length = Math.max(4, 28 - i * 5 + jitter);
    const offset = shimmer ? Math.round(Math.random() * 2 - 1) : 0;
    const x = Math.round((width - length) / 2) + offset;

    ctx.globalAlpha = 0.75 - i * 0.12;
    ctx.fillStyle = mixColor(top, bottom, 0.7 + i * 0.06);
    ctx.fillRect(x, y, length, 1);
  }

  ctx.globalAlpha = 1;
}

if (reflection) {
  drawReflection(false);
  document.addEventListener('themechange', () => drawReflection(false));

  // Brillo: cambia a saltos, sin suavizar
  if (!reduceMotion) setInterval(() => drawReflection(true), 900);
}

if (sun && canvas) {
  drawSun();
  // Redibuja si cambia el modo claro/oscuro
  document.addEventListener('themechange', drawSun);

  // Baja despacio al cargar
  requestAnimationFrame(() => requestAnimationFrame(() => sun.classList.add('is-set')));

  // Y se sigue hundiendo al hacer scroll (el reflejo se apaga a la vez)
  if (!reduceMotion) {
    const hero = document.querySelector('.hero');

    const onScroll = () => {
      // Llega a su posición final (casi escondido) mientras la portada aún se ve
      const progress = Math.min(window.scrollY / (window.innerHeight * 0.7), 1);
      hero.style.setProperty('--scroll', progress.toFixed(3));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

// Nubes pixeladas que cruzan despacio la parte de arriba (vibe de juego de los 90)
const clouds = document.querySelector('.clouds');

if (clouds) {
  // Tamaño en pantalla de cada píxel de nube: más pequeñas en el móvil
  const PX = window.innerWidth < 900 ? 6 : 9;

  // Cada nube es la unión de varios círculos [x, y, radio], con la base recortada en plano
  const shapes = [
    { w: 22, h: 8, circles: [[6, 6, 4], [11, 5, 5], [17, 6, 4]] },
    { w: 16, h: 6, circles: [[5, 4, 3.5], [10, 3.5, 3.5]] },
    { w: 28, h: 9, circles: [[6, 7, 4], [12, 5.5, 5], [19, 5, 5], [24, 7, 3.5]] },
    { w: 11, h: 3, circles: [[3, 2, 2], [7, 1.8, 2.5]] }, // nube pequeña y lejana
  ];

  // Posición inicial (fracción del ancho), fila y velocidad en píxeles por segundo
  const sky = [
    { shape: 0, start: 0.1, y: 2, speed: 0.9 },
    { shape: 1, start: 0.42, y: 11, speed: 0.6 },
    { shape: 2, start: 0.68, y: 3, speed: 0.75 },
    { shape: 1, start: 0.92, y: 15, speed: 0.5 },
    { shape: 3, start: 0.27, y: 9, speed: 0.35 },
    { shape: 0, start: 0.55, y: 16, speed: 0.45 },
    { shape: 3, start: 0.83, y: 8, speed: 0.3 },
    { shape: 2, start: 0.3, y: 14, speed: 0.55 },
  ];

  // Convierte cada forma en un mapa de píxeles: 1 = nube, 2 = sombra de la base
  const bitmaps = shapes.map(({ w, h, circles }) =>
    Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => {
        const inside = circles.some(([cx, cy, r]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r);
        if (!inside) return 0;
        return y >= h - 2 ? 2 : 1;
      })
    )
  );

  const ctx = clouds.getContext('2d');
  let colors = {};
  let cols = 0;
  const born = performance.now();

  const readColors = () => {
    const styles = getComputedStyle(document.documentElement);
    colors = { 1: styles.getPropertyValue('--cloud'), 2: styles.getPropertyValue('--cloud-shade') };
  };

  const resize = () => {
    cols = Math.ceil(clouds.clientWidth / PX);
    clouds.width = cols;
    clouds.height = Math.ceil(clouds.clientHeight / PX);
  };

  const draw = () => {
    const seconds = reduceMotion ? 0 : (performance.now() - born) / 1000;
    ctx.clearRect(0, 0, clouds.width, clouds.height);

    // Menos nubes cuanto más estrecha es la pantalla, para que no se amontonen
    const visible = cols < 60 ? 4 : cols < 140 ? 6 : sky.length;

    sky.slice(0, visible).forEach(({ shape, start, y, speed }) => {
      const map = bitmaps[shape];
      const w = map[0].length;
      // Avanza en píxeles enteros y vuelve a entrar por la izquierda al salir
      const x = Math.floor((start * cols + seconds * speed) % (cols + w)) - w;

      map.forEach((row, dy) =>
        row.forEach((cell, dx) => {
          if (!cell) return;
          ctx.fillStyle = colors[cell];
          ctx.fillRect(x + dx, y + dy, 1, 1);
        })
      );
    });
  };

  readColors();
  resize();
  draw();

  window.addEventListener('resize', () => { resize(); draw(); });
  document.addEventListener('themechange', () => { readColors(); draw(); });

  // A saltitos, como en los juegos antiguos (y solo mientras se ve la portada)
  if (!reduceMotion) {
    setInterval(() => {
      if (window.scrollY < window.innerHeight) draw();
    }, 250);
  }
}

// Frase de Dumbledore escrita como con máquina de escribir
const typewriter = document.querySelector('.typewriter');

if (typewriter && !reduceMotion) {
  const figure = typewriter.closest('.quote');
  const text = typewriter.textContent.trim();

  // Texto escrito + cursor + resto (transparente, para reservar el hueco)
  const shown = document.createElement('span');
  const cursor = document.createElement('span');
  const rest = document.createElement('span');
  cursor.className = 'typewriter__cursor';
  cursor.setAttribute('aria-hidden', 'true');
  rest.className = 'typewriter__rest';
  rest.textContent = text;

  typewriter.replaceChildren(shown, cursor, rest);

  let timer = null;
  let started = false;

  const type = (i) => {
    shown.textContent = text.slice(0, i);
    rest.textContent = text.slice(i);

    if (i === text.length) {
      figure.classList.remove('is-typing');
      return;
    }

    // Ritmo irregular, como una persona, y una pausa después de cada coma
    const pause = text[i - 1] === ',' ? 300 : 0;
    timer = setTimeout(() => type(i + 1), 30 + Math.random() * 45 + pause);
  };

  // Deja la frase en blanco, lista para volver a escribirse
  const reset = () => {
    clearTimeout(timer);
    started = false;
    shown.textContent = '';
    rest.textContent = text;
    figure.classList.add('is-typing');
  };

  reset();

  // Se escribe cada vez que vuelve a verse: empieza cuando se ve bien (60 %)
  // y se borra cuando sale del todo de la pantalla, al subir o al bajar
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) {
      reset();
    } else if (entry.intersectionRatio >= 0.6 && !started) {
      started = true;
      timer = setTimeout(() => type(0), 500);
    }
  }, { threshold: [0, 0.6] }).observe(figure);
}

// Botón de email: la dirección se monta aquí para que no esté escrita entera en el HTML
const mailBtn = document.querySelector('.mail-btn');

if (mailBtn) {
  mailBtn.href = `mailto:${mailBtn.dataset.user}@${mailBtn.dataset.domain}`;
}

// Pájaros: una bandada pequeña que cruza de vez en cuando batiendo las alas
const birds = document.querySelector('.birds');

if (birds) {
  const PX = 4; // más pequeños que los de las nubes: parecen lejanos

  const frames = [
    ['#...#', '.#.#.', '..#..'], // alas arriba
    ['.....', '##.##', '..#..'], // alas abajo
  ];

  // Cada bandada: altura (fracción del lienzo), velocidad (píxeles/segundo),
  // dónde empieza (fracción del ancho) y cuánto tarda en volver (píxeles fuera de pantalla).
  // En "birds", la posición de cada pájaro respecto al primero y el desfase del aleteo.
  const flocks = [
    {
      row: 0.4, speed: 7, start: 0.15, pause: 400,
      birds: [ // en V
        { dx: 0, dy: 0, phase: 0 },
        { dx: -7, dy: -4, phase: 0.5 },
        { dx: -7, dy: 4, phase: 0.25 },
        { dx: -14, dy: -8, phase: 0.75 },
        { dx: -14, dy: 8, phase: 0.1 },
      ],
    },
    {
      row: 0.2, speed: 5, start: 0.6, pause: 600,
      birds: [ // trío
        { dx: 0, dy: 0, phase: 0.3 },
        { dx: -8, dy: 3, phase: 0.8 },
        { dx: -15, dy: -1, phase: 0.55 },
      ],
    },
    {
      row: 0.55, speed: 9, start: 0.9, pause: 900,
      birds: [{ dx: 0, dy: 0, phase: 0.6 }], // solitario
    },
    {
      row: 0.3, speed: 6, start: 0.4, pause: 500,
      birds: [ // fila irregular
        { dx: 0, dy: 0, phase: 0.2 },
        { dx: -7, dy: 2, phase: 0.6 },
        { dx: -13, dy: -1, phase: 0.9 },
        { dx: -19, dy: 3, phase: 0.4 },
        { dx: -25, dy: 1, phase: 0.7 },
      ],
    },
    {
      row: 0.1, speed: 4, start: 0.05, pause: 1200,
      birds: [{ dx: 0, dy: 0, phase: 0.45 }], // solitario, muy arriba y lento
    },
  ];

  const ctx = birds.getContext('2d');
  let color = '';
  let cols = 0;
  let rows = 0;
  const born = performance.now();

  const readColor = () => {
    color = getComputedStyle(document.documentElement).getPropertyValue('--bird');
  };

  const resize = () => {
    cols = Math.ceil(birds.clientWidth / PX);
    rows = Math.ceil(birds.clientHeight / PX);
    birds.width = cols;
    birds.height = rows;
  };

  const draw = () => {
    const seconds = reduceMotion ? 0 : (performance.now() - born) / 1000;
    ctx.clearRect(0, 0, cols, rows);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;

    // Menos bandadas cuanto más estrecha es la pantalla (en el móvil, sin la V de cinco)
    const visible = cols < 150 ? [1, 2] : cols < 320 ? [0, 1, 2] : [0, 1, 2, 3, 4];

    visible.map((i) => flocks[i]).forEach(({ row, speed, start, pause, birds: members }) => {
      const leadX = Math.floor((cols * start + seconds * speed) % (cols + pause));
      const baseY = Math.round(rows * row);

      members.forEach(({ dx, dy, phase }) => {
        const frame = frames[Math.floor(seconds * 3 + phase * 2) % 2];
        const bob = reduceMotion ? 0 : Math.round(Math.sin(seconds * 1.5 + phase * 6));

        frame.forEach((line, y) =>
          [...line].forEach((cell, x) => {
            if (cell === '#') ctx.fillRect(leadX + dx + x, baseY + dy + bob + y, 1, 1);
          })
        );
      });
    });

    ctx.globalAlpha = 1;
  };

  readColor();
  resize();
  draw();

  window.addEventListener('resize', () => { resize(); draw(); });
  document.addEventListener('themechange', () => { readColor(); draw(); });

  if (!reduceMotion) {
    setInterval(() => {
      if (window.scrollY < window.innerHeight) draw();
    }, 150);
  }
}

// Hojas pixeladas que caen balanceándose por la sección Experiencia (solo unas pocas)
const leavesCanvas = document.querySelector('.leaves');

if (leavesCanvas && !reduceMotion) {
  const PX = 4;

  // Hoja en diagonal con el nervio marcado (v); al balancearse se da la vuelta
  const sprite = ['..###', '.##v#', '##v#.', '#v#..', 'v....'];
  const flipped = sprite.map((row) => [...row].reverse().join(''));

  // Color, posición inicial (fracciones), caída y balanceo
  const leaves = [
    { color: 0, x: 0.2, y: 0.1, fall: 5, sway: 1.1, phase: 0 },
    { color: 1, x: 0.65, y: 0.6, fall: 4, sway: 0.8, phase: 2 },
    { color: 2, x: 0.85, y: 1.1, fall: 6, sway: 1.3, phase: 4 },
  ];

  const ctx = leavesCanvas.getContext('2d');
  let colors = [];
  let vein = '';
  let cols = 0;
  let rows = 0;
  const born = performance.now();

  const readColors = () => {
    const styles = getComputedStyle(document.documentElement);
    colors = ['--leaf-1', '--leaf-2', '--leaf-3'].map((name) => styles.getPropertyValue(name));
    vein = styles.getPropertyValue('--leaf-vein');
  };

  const resize = () => {
    cols = Math.ceil(leavesCanvas.clientWidth / PX);
    rows = Math.ceil(leavesCanvas.clientHeight / PX);
    leavesCanvas.width = cols;
    leavesCanvas.height = rows;
  };

  const draw = () => {
    const seconds = (performance.now() - born) / 1000;
    const loop = rows * 1.6; // parte del recorrido es fuera de pantalla: no siempre hay hojas
    ctx.clearRect(0, 0, cols, rows);

    leaves.forEach(({ color, x, y, fall, sway, phase }) => {
      const travelled = y * rows + seconds * fall;
      const cycle = Math.floor(travelled / loop);
      const top = Math.floor(travelled % loop) - 6;
      if (top > rows) return;

      // En cada vuelta cae por un sitio distinto, con un poco de viento hacia la derecha
      const swing = Math.sin(seconds * sway + phase);
      const startX = ((x + cycle * 0.37) % 1) * cols;
      const left = Math.floor((startX + seconds * 1.2 + swing * 6) % cols);
      const shape = swing > 0 ? sprite : flipped;

      shape.forEach((line, dy) =>
        [...line].forEach((cell, dx) => {
          if (cell === '.') return;
          ctx.fillStyle = cell === 'v' ? vein : colors[color];
          ctx.fillRect(left + dx, top + dy, 1, 1);
        })
      );
    });
  };

  readColors();
  resize();
  draw();

  window.addEventListener('resize', () => { resize(); draw(); });
  document.addEventListener('themechange', () => { readColors(); draw(); });

  // Solo se anima mientras la sección se ve en pantalla
  let leavesVisible = false;
  new IntersectionObserver(([entry]) => { leavesVisible = entry.isIntersecting; }).observe(leavesCanvas);

  setInterval(() => {
    if (leavesVisible) draw();
  }, 120);
}

// Barra de progreso de peces: su animación va dentro del SVG (no la para el CSS),
// así que si se pide menos movimiento se congela con cuatro de cinco peces
const fishProgress = document.querySelector('.fish-progress');

if (fishProgress && reduceMotion) {
  fishProgress.pauseAnimations();
  fishProgress.setCurrentTime(2.1);
}

// Cabecera: transparente arriba del todo, con fondo al hacer scroll
const header = document.querySelector('.header');

const onHeaderScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
window.addEventListener('scroll', onHeaderScroll, { passive: true });
onHeaderScroll();

// Aparición suave de los bloques al hacer scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Hora de Madrid y año en el pie
const clock = document.getElementById('clock');

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(new Date());
}

updateClock();
setInterval(updateClock, 30000);

document.getElementById('year').textContent = new Date().getFullYear();
