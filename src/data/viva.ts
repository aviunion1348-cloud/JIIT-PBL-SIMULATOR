export interface VivaQuestion {
  readonly id: number;
  readonly level: 'basic' | 'intermediate' | 'application';
  readonly topic: string;
  readonly question: string;
  readonly options: readonly string[];
  readonly answerIndex: number;
  readonly explanation: string;
}

/**
 * Twenty-four experiment-specific questions. Nothing generic, nothing filler.
 * Answers and explanations are grounded in the supplied document plus clearly
 * labelled standard optics where the document is silent.
 */
export const VIVA_QUESTIONS: readonly VivaQuestion[] = [
  {
    id: 1,
    level: 'basic',
    topic: 'Unpolarised light',
    question: 'What is unpolarised (natural) light?',
    options: [
      'Light whose electric field oscillates in one fixed plane',
      'Light containing many rapidly and randomly varying polarisation states',
      'Light with no electric field at all',
      'Light that has been passed through a polariser',
    ],
    answerIndex: 1,
    explanation:
      'Randomly oriented atomic emitters radiate polarised wavetrains for about 10⁻⁸ s. Because the state changes rapidly and randomly, the resultant is described as unpolarised or randomly polarised light.',
  },
  {
    id: 2,
    level: 'basic',
    topic: 'Plane-polarised light',
    question: 'A beam is plane polarised when:',
    options: [
      'its electric-field vibrations are confined to a single plane',
      'it travels in a single plane',
      'it contains only one wavelength',
      'its intensity is constant',
    ],
    answerIndex: 0,
    explanation:
      'Plane polarisation is a statement about the orientation of the electric-field vibrations, not about the path of the beam. A polariser produces this by transmitting one component and suppressing the orthogonal one.',
  },
  {
    id: 3,
    level: 'basic',
    topic: "Brewster's angle",
    question: "Brewster's angle is the angle of incidence at which:",
    options: [
      'the reflected beam is completely plane polarised',
      'the refracted beam disappears',
      'the total reflected intensity becomes zero',
      'the specimen becomes opaque',
    ],
    answerIndex: 0,
    explanation:
      'At the polarising (Brewster) angle the reflected beam becomes completely plane polarised because the p-polarised reflected component vanishes. The total reflected intensity is not zero — the s component still reflects.',
  },
  {
    id: 4,
    level: 'basic',
    topic: "Brewster's law",
    question: "Which relation states Brewster's law?",
    options: ['sin θB = n₂ / n₁', 'tan θB = n₂ / n₁', 'cos θB = n₁ / n₂', 'θB = n₁ n₂'],
    answerIndex: 1,
    explanation:
      'Brewster found tan θB = n₂ / n₁, where n₁ is the surrounding medium and n₂ the reflecting specimen. Equivalently θB = tan⁻¹(n₂ / n₁).',
  },
  {
    id: 5,
    level: 'basic',
    topic: 'Angle convention',
    question: 'The angle of incidence in this experiment is measured from:',
    options: [
      'the specimen surface',
      'the surface normal',
      'the optical rail axis',
      'the reflected ray',
    ],
    answerIndex: 1,
    explanation:
      'All angles — incidence, reflection, refraction and Brewster — are measured from the normal. Measuring from the surface would give the complement and change tan into cot in the law.',
  },
  {
    id: 6,
    level: 'basic',
    topic: "Snell's law",
    question: "Snell's law at a dielectric interface is:",
    options: [
      'n₁ sin θi = n₂ sin θt',
      'n₁ cos θi = n₂ cos θt',
      'n₁ tan θi = n₂ tan θt',
      'n₁ θi = n₂ θt',
    ],
    answerIndex: 0,
    explanation:
      'Snell’s law is n₁ sin θi = n₂ sin θt. It predicts bending toward the normal when entering a denser medium and the critical-angle condition for total internal reflection.',
  },
  {
    id: 7,
    level: 'intermediate',
    topic: 'Geometry at Brewster incidence',
    question: 'At Brewster incidence, the reflected and refracted rays are:',
    options: ['parallel', 'perpendicular', 'anti-parallel', 'always at 45° to each other'],
    answerIndex: 1,
    explanation:
      'This is exactly the statement Brewster used: maximum polarisation of the reflected ray occurs when the reflected ray is perpendicular to the refracted ray, i.e. θr + θt = 90°.',
  },
  {
    id: 8,
    level: 'intermediate',
    topic: 's and p components',
    question: 'Which reflected polarisation component vanishes at Brewster incidence?',
    options: [
      'The s component (perpendicular to the plane of incidence)',
      'The p component (parallel to the plane of incidence)',
      'Both components vanish',
      'Neither component vanishes',
    ],
    answerIndex: 1,
    explanation:
      'The p component vanishes; the reflected beam is left purely s-polarised. The p dipoles cannot radiate along the direction of the reflected ray, which is parallel to their oscillation axis.',
  },
  {
    id: 9,
    level: 'intermediate',
    topic: 'Misconception',
    question: 'Does the total reflected intensity of unpolarised light become zero at Brewster incidence?',
    options: [
      'Yes, reflection is completely extinguished',
      'No, only the p component vanishes; the s component still reflects strongly',
      'Yes, but only for glass',
      'No, both components increase',
    ],
    answerIndex: 1,
    explanation:
      'Only the p-polarised reflected component goes to zero. For an ordinary dielectric the s component continues to reflect, so the total reflected intensity remains substantial. The source data shows exactly this: a minimum near 1.06–1.14, not a null.',
  },
  {
    id: 10,
    level: 'basic',
    topic: 'Symbols',
    question: 'In tan θB = n₂ / n₁, what do n₁ and n₂ represent?',
    options: [
      'n₁ is the specimen, n₂ the surrounding medium',
      'n₁ is the surrounding medium, n₂ the reflecting specimen',
      'Both are the specimen',
      'Both are the surrounding medium',
    ],
    answerIndex: 1,
    explanation:
      'n₁ is the refractive index of the incident/surrounding medium; n₂ is that of the transmitting/reflecting specimen.',
  },
  {
    id: 11,
    level: 'basic',
    topic: 'Polariser',
    question: 'What is the function of the polariser in this setup?',
    options: [
      'To set the incident state of polarisation',
      'To focus the beam',
      'To measure the angle of refraction',
      'To dissipate excess laser power',
    ],
    answerIndex: 0,
    explanation:
      'A polariser transmits one component and removes the orthogonal one. Rotating it selects the incident polarisation state; 0° gives s-polarised light, 90° p-polarised, and unpolarised input is modelled as two incoherent equal components.',
  },
  {
    id: 12,
    level: 'basic',
    topic: 'Goniometer',
    question: 'What is the function of the goniometer-based detector mount?',
    options: [
      'To rotate the specimen only',
      'To measure and sweep the angular position of the detector',
      'To increase the laser power',
      'To cool the photodetector',
    ],
    answerIndex: 1,
    explanation:
      'The graduated circle and rotating arm give the reflected beam an angular scale, turning a bright spot into a measured value of θB.',
  },
  {
    id: 13,
    level: 'intermediate',
    topic: 'Photodetector',
    question: 'Why is the photodetector fitted with a pinhole?',
    options: [
      'To increase its sensitivity to room light',
      'To restrict the field of view so only the specular beam is collected',
      'To change the beam wavelength',
      'To polarise the reflected light',
    ],
    answerIndex: 1,
    explanation:
      'The pinhole rejects stray light and scatter so the recorded current corresponds to the specularly reflected beam rather than general room illumination.',
  },
  {
    id: 14,
    level: 'basic',
    topic: 'Laser specification',
    question: 'What is the wavelength of the diode laser in the supplied setup?',
    options: ['532 nm', '650 nm', '405 nm', '780 nm'],
    answerIndex: 1,
    explanation: 'The apparatus list specifies a 3 mW, 650 nm red diode laser with power supply.',
  },
  {
    id: 15,
    level: 'basic',
    topic: 'Laser specification',
    question: 'What is the optical power of the source laser?',
    options: ['0.3 mW', '3 mW', '30 mW', '300 mW'],
    answerIndex: 1,
    explanation: 'The specification is 3 mW at 650 nm, red.',
  },
  {
    id: 16,
    level: 'basic',
    topic: 'Optical rail',
    question: 'How long is the optical rail in the source apparatus?',
    options: ['250 mm', '300 mm', '500 mm', '1000 mm'],
    answerIndex: 2,
    explanation: 'The apparatus list gives a 500 mm optical rail.',
  },
  {
    id: 17,
    level: 'basic',
    topic: 'Reported result — Topaz',
    question: 'What Brewster angle is reported for Topaz Glass?',
    options: ['56.7°', '57.51°', '58.1°', '60°'],
    answerIndex: 2,
    explanation:
      'The document reports 58.1° for Topaz Glass. The nearest tabulated minimum is 60°, which is a different quantity.',
  },
  {
    id: 18,
    level: 'basic',
    topic: 'Reported result — Crown',
    question: 'What Brewster angle is reported for Crown Glass?',
    options: ['55.0°', '56.7°', '58.1°', '57.51°'],
    answerIndex: 1,
    explanation:
      'Crown Glass is reported at 56.7°. Its tabulated minimum is at 55° with I = 1.0610 A.',
  },
  {
    id: 19,
    level: 'basic',
    topic: 'Reported result — Flint',
    question: 'What Brewster angle is reported for Flint Glass?',
    options: ['56.7°', '57.51°', '58.1°', '60.0°'],
    answerIndex: 1,
    explanation: 'Flint Glass is reported at 57.51°.',
  },
  {
    id: 20,
    level: 'application',
    topic: 'Data integrity',
    question: 'Why do the reported angles differ from the nearest 5° sampled minima?',
    options: [
      'The data contains errors that were silently corrected',
      'The samples are 5° apart, so an interpolated minimum lies between rows — and the document does not state its method',
      'The reported values are the sampled minima misread',
      'The detector measured nothing at 5° steps',
    ],
    answerIndex: 1,
    explanation:
      'With 5° spacing a sampled minimum can be up to ±2.5° from the true minimum. The document reports more precise angles but does not describe the interpolation used, so both the sampled minimum and the reported angle must be preserved and never merged.',
  },
  {
    id: 21,
    level: 'intermediate',
    topic: 'Fresnel equations',
    question: 'What does the Fresnel p-reflectance Rp do exactly at Brewster incidence?',
    options: [
      'It reaches its maximum',
      'It approaches zero',
      'It becomes negative',
      'It equals Rs',
    ],
    answerIndex: 1,
    explanation:
      'Rp approaches zero at Brewster incidence (within floating-point tolerance) and changes sign in the amplitude coefficient beyond it. Rs stays finite and non-zero.',
  },
  {
    id: 22,
    level: 'application',
    topic: 'Wavelength dependence',
    question: 'Is the polarising angle affected by changing the laser wavelength alone, with indices held fixed?',
    options: [
      'Yes, Brewster’s equation contains λ explicitly',
      'No, tan θB = n₂ / n₁ contains no wavelength term — but real indices disperse',
      'Yes, it doubles with wavelength',
      'Only for metals',
    ],
    answerIndex: 1,
    explanation:
      'The relation tan θB = n₂/n₁ is independent of wavelength. In a real material n changes with wavelength, so the actual polarising angle does shift through n(λ) — the dependence enters via the indices, not the law.',
  },
  {
    id: 23,
    level: 'intermediate',
    topic: 'Malus law scope',
    question: "When does Malus's law I = I₀ cos²φ apply to an analyser?",
    options: [
      'To any beam, polarised or not',
      'To a fully plane-polarised beam entering the analyser',
      'Only at Brewster incidence at the specimen',
      'Only with unpolarised input',
    ],
    answerIndex: 1,
    explanation:
      'Malus’s law describes an ideal analyser placed in a plane-polarised beam. It must not be applied blindly to an unpolarised beam or used in place of the Fresnel treatment at the interface.',
  },
  {
    id: 24,
    level: 'application',
    topic: 'Detector honesty',
    question: 'Why does the simulator show a normalised detector signal instead of amperes?',
    options: [
      'Because amperes are not a real unit',
      'Because the source supplies no responsivity, gain, offset or calibration curve',
      'Because the laser power is unknown',
      'Because the detector is broken',
    ],
    answerIndex: 1,
    explanation:
      'Without responsivity, gain, collection efficiency, dark offset and geometry, the Fresnel reflectance cannot be converted to the original current. The simulator therefore shows a clearly labelled normalised signal and exposes calibrated units only when the user supplies explicit assumptions.',
  },
];
