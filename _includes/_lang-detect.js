const supportedLanguages = ['en', 'ko'];
const getPreferredLangCode = () => {
  let langCode = getPreferredLangCodeFromLocalStorage();
  if (langCode) {
    return langCode;
  }
  const languages = navigator.languages;
  if (languages && languages.length) {
    for (const lang of languages) {
      let code = lang.substring(0, 2);
      if (supportedLanguages.includes(code)) {
        return code;
      }
    }
  }
  return 'en';
};
const getPreferredLangCodeFromLocalStorage = () => {
  let langCode = localStorage.getItem('lang');
  if (langCode && supportedLanguages.includes(langCode)) {
    return langCode;
  } else {
    return null;
  }
};
const setPreferredLangCodeToLocalStorage = (langCode) => {
  localStorage.setItem('lang', langCode);
};