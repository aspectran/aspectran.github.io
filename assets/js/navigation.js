// Main jQuery document ready function
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

  // Sidebar
  if ($('body').data('sidebar')) {
    const sidebar = $('body').data('sidebar');
    if (sidebar.startsWith('toc')) {
      $("#masthead h1, article h1, article h2, article h3").each(function (index, item) {
        let localName = item.localName;
        let anchor;
        if (localName !== "h1") {
          anchor = "anchor-" + (index + 1);
          $(this).before("<a class='toc-anchor " + anchor + "' id='" + anchor + "' name='" + anchor + "'></a>");
        } else {
          anchor = "top-of-page";
        }
        $("<li class='toc-" + localName + "'></li>")
          .append($("<a anchor='" + anchor + "' href='#" + anchor + "'/>").text($(item).text()))
          .appendTo("#toc ul");
      });
    }

    $(".lazy-sticky").each(function () {
      const $win = $(window);
      const $this = $(this);
      const baseOffsetTop = $this.offset().top;
      const upToTopHeight = $("#up-to-top").height() + 30 + 60;
      let footerHeight = $("#footer-content").height() + upToTopHeight;
      let offsetTop = 0;
      let thisHeight = $this.height();
      let winHeight = $win.height();
      let scrollTimer = null;
      let immediate = false;
      $this.find("#toc ul a").on("click", function () {
        immediate = true;
        let anchor = $(this).attr("anchor");
        if (anchor !== "top-of-page") {
          $("#navigation").addClass("immediate");
        }
      });
      $win.on("scroll", function () {
        let scrollTop = $win.scrollTop();
        if (scrollTop < baseOffsetTop) {
          if (scrollTimer) {
            clearInterval(scrollTimer);
            scrollTimer = null;
          }
          scrollTimer = setInterval(function () {
            if (offsetTop !== 0) {
              $this.css({
                top: 0
              });
            }
            offsetTop = 0;
            clearInterval(scrollTimer);
            scrollTimer = null;
            immediate = false;
          }, immediate ? 250 : 500);
        } else {
          let topBarHeight = $("#navigation.fixed .top-bar").height() || 0;
          if (immediate || (scrollTop > baseOffsetTop + topBarHeight + offsetTop + thisHeight - 20) ||
            (scrollTop < baseOffsetTop + offsetTop - 50)) {
            if ($win.width() > 992) {
              if (scrollTimer) {
                clearInterval(scrollTimer);
                scrollTimer = null;
              }
              scrollTimer = setInterval(function () {
                topBarHeight = $("#navigation.fixed .top-bar").height() || 0;
                scrollTop = $win.scrollTop();
                if (scrollTop < baseOffsetTop + topBarHeight) {
                  scrollTop = 0;
                } else {
                  scrollTop = scrollTop - baseOffsetTop + topBarHeight + 30;
                }
                const docHeight = $(document).height();
                if (scrollTop > docHeight - footerHeight - thisHeight - baseOffsetTop + topBarHeight) {
                  scrollTop = docHeight - footerHeight - thisHeight - baseOffsetTop + topBarHeight;
                }
                offsetTop = scrollTop;
                $this.css({
                  position: "relative"
                }).animate({
                  top: (scrollTop + topBarHeight) + "px"
                }, 300);
                clearInterval(scrollTimer);
                scrollTimer = null;
                winHeight = $win.height();
                thisHeight = $this.height();
                footerHeight = $("#footer-content").height() + upToTopHeight;
                immediate = false;
              }, immediate ? 250 : 500);
            }
          }
        }
      });
      $win.on("resize", function () {
        if ($win.width() <= 992) {
          clearInterval(scrollTimer);
          offsetTop = 0;
          $this.css("top", 0);
        } else {
          offsetTop = $win.scrollTop();
          $win.scroll();
        }
      });
      setTimeout(function () {
        if ($win.scrollTop() > baseOffsetTop) {
          offsetTop = $win.scrollTop();
          $win.scroll();
        }
      }, 150);
    });
  }
});
