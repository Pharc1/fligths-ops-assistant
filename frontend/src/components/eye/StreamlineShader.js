export const streamlineVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

export const streamlineFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec2  uResolution;

  varying vec2 vUv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Value noise lisse (interpolation cubique)
  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Champ de vitesse : flux potentiel + circulation tourbillonnaire (Gamma)
  // U = vitesse uniforme, Gamma = intensite du vortex
  // vx = U*(1 - R2*(x2-y2)/r4) + Gamma*y/(2pi*r2)
  // vy = -2U*R2*xy/r4          - Gamma*x/(2pi*r2)
  vec2 flowVel(vec2 p, float R, float U, float Gamma) {
    float r2 = max(dot(p, p), R * R * 1.002);
    float R2 = R * R;
    float r4 = r2 * r2;
    float pi2 = 6.28318;
    return vec2(
      U * (1.0 - R2 * (p.x * p.x - p.y * p.y) / r4) + Gamma * p.y / (pi2 * r2),
     -2.0 * U * R2 * p.x * p.y / r4                  - Gamma * p.x / (pi2 * r2)
    );
  }

  void main() {
    vec2 res = max(uResolution, vec2(1.0));
    vec2 uv = vUv - 0.5;
    uv.x *= res.x / res.y;

    float R = 0.20;
    float dist = length(uv);

    // Fond ivoire clair, stries sombres (comme la photo de reference)
    vec3 bg      = vec3(0.920, 0.905, 0.890);
    vec3 darkCol = vec3(0.20, 0.17, 0.15);

    // === LINE INTEGRAL CONVOLUTION ===
    // noiseScale eleve = filaments fins comme des cheveux (Re<<1 smoke wire)
    float noiseScale = 480.0;
    // dt petit = pas d'integration court => stries fines, pas de gros paquets
    float dt = 0.0014;

    // U : vitesse du flux, pulse doucement (respiration au repos)
    float U = 1.0 + 0.06 * sin(uTime * 0.55);

    // Gamma : circulation tourbillonnaire
    // Nulle au repos -> monte quand il reflechit -> stries spiralent autour du cercle
    float Gamma = uIntensity * 0.55 * (0.7 + 0.3 * sin(uTime * 0.8));

    // dt pulse legerement : les stries respirent en longueur
    float dtAnim = dt * (1.0 + 0.12 * sin(uTime * 0.4));

    float timeFlow = uTime * 0.5 * U;

    float sumF = 0.0, sumB = 0.0;
    float wTotal = 0.0;
    vec2 posF = uv;
    vec2 posB = uv;

    for (int i = 0; i < 36; i++) {
      float fi = float(i);
      float w = exp(-fi * 0.055);

      vec2 vF = normalize(flowVel(posF, R, U, Gamma));
      posF += vF * dtAnim;
      sumF += valueNoise(posF * noiseScale + vec2(timeFlow, 0.0)) * w;

      vec2 vB = normalize(flowVel(posB, R, U, Gamma));
      posB -= vB * dtAnim;
      sumB += valueNoise(posB * noiseScale + vec2(timeFlow, 0.0)) * w;

      wTotal += w;
    }

    float lic = (sumF + sumB) / (2.0 * wTotal);
    lic = pow(smoothstep(0.22, 0.82, lic), 0.7);

    // Eclaircissement des zones loin du cercle verticalement
    // => les bords haut/bas sont plus blancs, comme la photo
    float verticalFade = smoothstep(0.0, 0.38, abs(uv.y));
    lic = mix(lic, 1.0, verticalFade * 0.55);

    // Trainee sombre autour du cercle, plus forte a droite
    // - anneau complet autour du cercle (proximity)
    float proximity = 1.0 - smoothstep(R * 1.0, R * 2.8, dist);
    // - asymetrie : droite plus sombre que gauche
    float asymmetry = smoothstep(-R, R * 1.5, uv.x) * 0.5 + 0.5;
    // - centree sur l'axe : s'estompe vers le haut/bas
    float axialFocus = 1.0 - smoothstep(0.0, R * 1.2, abs(uv.y));
    float shadow = proximity * mix(0.12, 0.32, asymmetry * axialFocus);
    lic = clamp(lic - shadow, 0.0, 1.0);

    vec3 color = mix(darkCol, bg, lic);

    // Masque dans le cercle
    float clearZone = smoothstep(R * 0.92, R * 1.02, dist);
    color = mix(bg, color, clearZone);

    // Grain tres leger
    float grain = rand(uv * 2.2 + fract(uTime * 0.9)) * 0.022;
    color -= vec3(grain);

    // Texture papier subtile
    float paper = valueNoise(uv * 5.0) * 0.015;
    color -= vec3(paper);

    // Vignette douce
    float vignette = 1.0 - smoothstep(0.32, 0.72, length(uv));
    color = mix(color * 0.86, color, vignette);

    // Halo blanc autour du cercle
    float haloDist = dist - R;
    float haloRing = smoothstep(0.0, 0.0015, haloDist) * (1.0 - smoothstep(0.0015, 0.013, haloDist));
    float haloGlow = smoothstep(0.0, 0.0015, haloDist) * (1.0 - smoothstep(0.013, 0.052, haloDist)) * 0.18;
    float halo = clamp(haloRing + haloGlow, 0.0, 1.0);
    color = mix(color, vec3(1.0), halo);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;
