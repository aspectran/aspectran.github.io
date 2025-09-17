---
---

// Language detection functions (global)
{% include _lang-detect.js %}

// Main jQuery document ready function
$(function () {
  if ($('html').data('auto-lang')) {
    const langCode = getPreferredLangCode();
    console.log('auto-lang:', langCode);
    $("body .auto-lang." + langCode).removeClass("auto-lang");
  }

  /* To apply Bootstrap table styles to tables created using Markdown in Jekyll */
  $("article table").addClass("table table-striped table-bordered");

  // Theme logic
  const getStoredTheme = () => localStorage.getItem('theme');
  const setStoredTheme = theme => localStorage.setItem('theme', theme);
  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    return 'auto';
  };
  const setTheme = theme => {
    const newTheme = theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    $('html').attr('data-bs-theme', newTheme);
  };
  const showActiveTheme = (theme) => {
    const $themeToggler = $('.theme-toggler');
    if (!$themeToggler.length) {
      return;
    }
    $themeToggler.find('.dropdown-item.active').removeClass('active');
    $themeToggler.find('.dropdown-item .bi-check2').addClass('d-none');
    const $activeItem = $themeToggler.find('[data-bs-theme-value="' + theme + '"]');
    $activeItem.addClass('active');
    $activeItem.find('.bi-check2').removeClass('d-none');
    const iconClass = $activeItem.find('.bi:first').attr('class').match(/bi-[^\s]+/)[0];
    $themeToggler.find('.theme-icon-active').attr('class', 'bi theme-icon-active ' + iconClass);
  };
  showActiveTheme(getPreferredTheme());
  $(window.matchMedia('(prefers-color-scheme: dark)')).on('change', () => {
    const storedTheme = getStoredTheme();
    if (storedTheme === 'auto' || !storedTheme) {
      setTheme('auto');
    }
  });
  $('.theme-toggler [data-bs-theme-value]').on('click', function() {
    const theme = $(this).data('bs-theme-value');
    setStoredTheme(theme);
    setTheme(theme);
    showActiveTheme(theme);
  });

  // Language click handler on footer
  $(".lang-switcher a[lang]").on("click", function (e) {
    e.preventDefault();
    const langCode = $(this).attr("lang");
    if (langCode) {
      setPreferredLangCodeToLocalStorage(langCode);
    }
    location.href = $(this).attr("href");
  });

  /* google search */
  {% capture google_search_site %}{{ site.official_url }}{% endcapture %}
  $("form[name=google_quick_search]").submit(function (event) {
    window.open('https://www.google.com/search?q=' + this.keyword.value + '+site:{{ google_search_site | cgi_escape }}');
    event.preventDefault();
  });

  // External links, tables
  /* Creating custom :external selector */
  $.expr[':'].external = function (obj) {
    return obj.href
        && !obj.href.match(/^javascript:/)
        && !obj.href.match(/^mailto:/)
        && (obj.hostname != location.hostname);
  };
  /* Add 'external' CSS class to all external links */
  $('a:external').addClass('external');
  /* turn target into target=_blank for elements w external class */
  $(".external").attr('target', '_blank');
});
