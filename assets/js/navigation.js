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
        let tagn = item.localName;
        let anchor = "top-of-page";
        if (tagn !== "h1") {
          anchor = "anchor-" + (index + 1);
          $(this).before("<a class='toc-anchor " + anchor + "' id='" + anchor + "' name='" + anchor + "'></a>");
        }
        $("<li class='toc-" + tagn + "'></li>")
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
      $this.find("#toc ul a").click(function () {
        immediate = true;
        let anchor = $(this).attr("anchor");
        if (anchor !== "top-of-page") {
          $("#navigation").addClass("immediate");
        }
      });
      $win.scroll(function () {
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
            (scrollTop < baseOffsetTop + topBarHeight + offsetTop)) {
            if ($this.offset().left >= 15 && $this.width() < 500) {
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
                if (scrollTop > $(document).height() - footerHeight - thisHeight - baseOffsetTop + topBarHeight) {
                  scrollTop = $(document).height() - footerHeight - thisHeight - baseOffsetTop + topBarHeight;
                }
                offsetTop = scrollTop;
                $this.css({
                  position: "relative"
                });
                $this.animate({
                  top: scrollTop + "px"
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
      $win.resize(function () {
        if ($this.offset().left < 15 || $this.width() >= 500) {
          clearInterval(scrollTimer);
          $this.css("top", 0);
        } else {
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
