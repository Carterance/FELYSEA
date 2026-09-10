import argon2 from "argon2";

/**
 * argon2id est recommandé par l'OWASP pour le hash de mots de passe
 * (résistant aux attaques GPU et aux attaques par canal auxiliaire).
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(
  hash: string,
  plain: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // hash corrompu ou format invalide → jamais lever, juste refuser
    return false;
  }
}
