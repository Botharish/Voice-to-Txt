const supportedTranscriptCharacters =
  /^[\p{Script=Latin}\p{Script=Tamil}0-9\p{P}\p{Z}\p{S}]*$/u;

export function isSupportedTranscript(
  text: string,
  languageCode?: string,
): boolean {
  if (
    languageCode &&
    !/^(ta|en)(-|$)/iu.test(languageCode.trim())
  ) {
    return false;
  }

  return supportedTranscriptCharacters.test(text);
}
