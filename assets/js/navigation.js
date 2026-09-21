$(function () {
  // Navigation, etc.
  const tolerance = 10;
  const $win = $(window);
  const $doc = $(document);
  const $nav = $("#navigation");
  let lastScrollTop = $win.scrollTop();
  let ticking = false;
  let isNavUp = $nav.hasClass("nav-up");

  // Unlock navigation and sync reference point on user interaction
  $(window).on("wheel touchstart pointerdown keydown", function () {
    if (window._navLocked) {
      window._navLocked = false;
    }
    lastScrollTop = $win.scrollTop();
  });

  function handleScroll() {
    ticking = false;
    let scrollTop = $win.scrollTop();

    if (window._navLocked) {
      lastScrollTop = scrollTop;
      if (scrollTop <= 0) {
        if (isNavUp || $nav.hasClass("scrolled")) {
          $nav.addClass("no-transition").removeClass("nav-up scrolled");
          setTimeout(function () {
            $nav.removeClass("no-transition");
          }, 50);
          isNavUp = false;
        }
      } else {
        if (!isNavUp) {
          $nav.addClass("nav-up");
          isNavUp = true;
        }
      }
      return;
    }

    if ($nav.find(".navbar-collapse.show, .navbar-collapse.collapsing").length) {
      lastScrollTop = scrollTop;
      if (isNavUp) {
        $nav.removeClass("nav-up");
        isNavUp = false;
      }
      return;
    }

    let docHeight = $doc.height();
    let winHeight = $win.height();

    // Prevent rubber-banding / bounce at top & bottom on mobile
    if (scrollTop < 0 || scrollTop + winHeight > docHeight) {
      return;
    }

    if (scrollTop <= 0) {
      if (isNavUp || $nav.hasClass("scrolled")) {
        $nav.addClass("no-transition").removeClass("nav-up scrolled");
        setTimeout(function () {
          $nav.removeClass("no-transition");
        }, 50);
        isNavUp = false;
      }
      lastScrollTop = scrollTop;
      return;
    }

    if (!$nav.hasClass("scrolled")) {
      $nav.addClass("scrolled");
    }

    let diff = lastScrollTop - scrollTop;

    if (Math.abs(diff) >= tolerance) {
      if (diff < 0 && scrollTop > 60) {
        // Scroll down: hide navigation
        if (!isNavUp) {
          $nav.addClass("nav-up");
          isNavUp = true;
        }
      } else if (diff > 0) {
        // Scroll up: show navigation
        if (isNavUp) {
          $nav.removeClass("nav-up");
          isNavUp = false;
        }
      }
      lastScrollTop = scrollTop;
    }
  }

  $win.on("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  });

  $nav.find("ul.submenu > li > a").on("click touchend", function (e) {
    let link = $(this).attr("href");
    if (link) {
      window.location = link;
    }
  });
});
