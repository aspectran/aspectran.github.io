$(function () {
  // Navigation, etc.
  const $win = $(window);
  const $nav = $("#navigation");
  const navHeight = $("#masthead").height()||$nav.height() + $nav.height();
  let lastScrollTop = 0;
  let scrolled;
  let navFixed;
  $win.scroll(function () {
    scrolled = true;
  });
  setInterval(function () {
    if (scrolled) {
      let scrollTop = $win.scrollTop();
      if (Math.abs(lastScrollTop - scrollTop) <= 10) {
        return;
      }
      if (scrollTop <= navHeight) {
        if (navFixed) {
          $nav.removeClass("fixed");
          navFixed = false;
        }
      } else if (scrollTop > lastScrollTop) {
        if (navFixed) {
          $nav.removeClass("fixed");
          navFixed = false;
        }
      } else {
        if (!navFixed) {
          if ($nav.hasClass("immediate")) {
            $nav.removeClass("immediate")
          } else {
            $nav.addClass("fixed");
            $nav.hide().fadeIn(500);
            navFixed = true;
          }
        }
      }
      lastScrollTop = scrollTop;
      scrolled = false;
    }
  }, 200);
  $nav.find("ul.submenu > li > a").on('click touchend', function (e) {
    let link = $(this).attr('href');
    if (link) {
      window.location = link;
    }
  });
});
