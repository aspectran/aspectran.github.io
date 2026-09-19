$(function () {
  // Navigation, etc.
  const $win = $(window);
  const $nav = $("#navigation");
  let lastScrollTop = $win.scrollTop();
  let scrolled = false;

  // Unlock navigation only when genuine user interaction occurs
  $(window).on("wheel touchstart pointerdown keydown", function () {
    if (window._navLocked) {
      window._navLocked = false;
      lastScrollTop = $win.scrollTop();
    }
  });

  $win.on("scroll", function () {
    if (window._navLocked) {
      lastScrollTop = $win.scrollTop();
      scrolled = false;
      if ($win.scrollTop() <= 0) {
        $nav.addClass("no-transition").removeClass("nav-up scrolled");
        setTimeout(function () {
          $nav.removeClass("no-transition");
        }, 50);
      } else {
        $nav.addClass("nav-up");
      }
      return;
    }
    scrolled = true;
  });

  setInterval(function () {
    if (window._navLocked) {
      lastScrollTop = $win.scrollTop();
      scrolled = false;
      if ($win.scrollTop() <= 0) {
        $nav.addClass("no-transition").removeClass("nav-up scrolled");
        setTimeout(function () {
          $nav.removeClass("no-transition");
        }, 50);
      } else {
        $nav.addClass("nav-up");
      }
      return;
    }
    if (scrolled) {
      if ($nav.find(".navbar-collapse.show, .navbar-collapse.collapsing").length) {
        lastScrollTop = $win.scrollTop();
        scrolled = false;
        $nav.removeClass("nav-up");
        return;
      }
      let scrollTop = $win.scrollTop();
      let diff = lastScrollTop - scrollTop;

      if (scrollTop <= 0) {
        $nav.addClass("no-transition").removeClass("nav-up scrolled");
        setTimeout(function () {
          $nav.removeClass("no-transition");
        }, 50);
      } else {
        $nav.addClass("scrolled");
        if (diff < -10 && scrollTop > 60) {
          // Scroll down: hide navigation
          $nav.addClass("nav-up");
        } else if (diff > 10) {
          // Scroll up: show navigation
          $nav.removeClass("nav-up");
        }
      }

      lastScrollTop = scrollTop;
      scrolled = false;
    }
  }, 100);

  $nav.find("ul.submenu > li > a").on('click touchend', function (e) {
    let link = $(this).attr('href');
    if (link) {
      window.location = link;
    }
  });
});
