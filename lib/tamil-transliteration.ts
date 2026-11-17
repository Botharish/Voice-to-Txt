const vowels: Record<string, string> = {
  அ: "a",
  ஆ: "aa",
  இ: "i",
  ஈ: "ee",
  உ: "u",
  ஊ: "oo",
  எ: "e",
  ஏ: "ae",
  ஐ: "ai",
  ஒ: "o",
  ஓ: "o",
  ஔ: "au",
};

const consonants: Record<string, string> = {
  க: "k",
  ங: "ng",
  ச: "s",
  ஞ: "nj",
  ட: "t",
  ண: "n",
  த: "th",
  ந: "n",
  ப: "p",
  ம: "m",
  ய: "y",
  ர: "r",
  ல: "l",
  வ: "v",
  ழ: "zh",
  ள: "l",
  ற: "r",
  ன: "n",
  ஜ: "j",
  ஷ: "sh",
  ஸ: "s",
  ஹ: "h",
  ஶ: "sh",
};

const vowelSigns: Record<string, string> = {
  "ா": "aa",
  "ி": "i",
  "ீ": "ee",
  "ு": "u",
  "ூ": "oo",
  "ெ": "e",
  "ே": "ae",
  "ை": "ai",
  "ொ": "o",
  "ோ": "o",
  "ௌ": "au",
};

const pulli = "்";

export function transliterateTamil(text: string): string {
  const characters = Array.from(text);
  let result = "";

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];

    if (vowels[character]) {
      result += vowels[character];
      continue;
    }

    const consonant = consonants[character];
    if (consonant) {
      const next = characters[index + 1];
      if (next === pulli) {
        result += consonant;
        index += 1;
      } else if (vowelSigns[next]) {
        result += consonant + vowelSigns[next];
        index += 1;
      } else {
        result += `${consonant}a`;
      }
      continue;
    }

    if (vowelSigns[character] || character === pulli) {
      continue;
    }

    result += character;
  }

  return result;
}

export function romanizeTamil(text: string): string {
  return /[\u0B80-\u0BFF]/u.test(text) ? transliterateTamil(text) : text;
}
