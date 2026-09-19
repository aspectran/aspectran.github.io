$(function () {
  // Sidebar
  if ($("body").data("sidebar")) {
    const sidebar = $("body").data("sidebar");
    if (sidebar.startsWith("toc")) {
      $("#masthead h1, article h1, article h2, article h3").each(function (index, item) {
        let localName = item.localName;
        let anchor;
        if (localName !== "h1") {
          anchor = "anchor-" + (index + 1);
          $(this).before("<a class='toc-anchor " + anchor + "' id='" + anchor + "' name='" + anchor + "'></a>");
        } else {
          anchor = "top-of-page";
        }
        let rawText = $(item).text().trim();
        let match = rawText.match(/^((?:\d+(?:\.\d+)*\.?|\d+\)|\([0-9a-zA-Z가-힣]+\)|\[[0-9a-zA-Z가-힣]+\]|[A-Za-z]\.))\s+(.*)$/);
        let $a = $("<a anchor='" + anchor + "' href='#" + anchor + "'/>");
        if (match) {
          $a.append($("<span class='toc-num'/>").text(match[1]));
          $a.append($("<span class='toc-text'/>").text(match[2]));
        } else {
          if (localName === "h2") {
            $a.append($("<span class='toc-bullet'>–</span>"));
          } else if (localName === "h3") {
            $a.append($("<span class='toc-bullet'>·</span>"));
          }
          $a.append($("<span class='toc-text'/>").text(rawText));
        }
        $("<li class='toc-" + localName + "'></li>")
          .append($a)
          .appendTo("#toc ul");
      });
    }

    // TOC click handler
    $("#toc ul a").on("click", function (e) {
      let anchor = $(this).attr("anchor");
      if (anchor) {
        let $target;
        if (anchor === "top-of-page") {
          $target = $("#masthead").length ? $("#masthead") : $("body");
        } else {
          $target = $("a#" + anchor).length ? $("a#" + anchor) : ($("." + anchor).length ? $("." + anchor) : $("#" + anchor));
        }
        if ($target.length) {
          e.preventDefault();
          let isTop = (anchor === "top-of-page");
          window._navLocked = true;
          if (isTop) {
            $("#navigation").addClass("no-transition").removeClass("nav-up scrolled");
          } else {
            $("#navigation").addClass("nav-up");
          }

          let $heading = $target.is("h1, h2, h3, h4, h5, h6") ? $target : $target.nextAll("h1, h2, h3, h4, h5, h6").first();
          let headingTop = $heading.length ? $heading.offset().top : $target.offset().top;
          let targetOffset = isTop ? 0 : Math.max(0, Math.round(headingTop) - 30);

          if (history.pushState) {
            history.pushState(null, null, "#" + anchor);
          }

          $("html, body").stop().animate({
            scrollTop: targetOffset
          }, 300, function () {
            if (isTop) {
              $("#navigation").removeClass("no-transition nav-up scrolled");
              window._navLocked = false;
            }
          });
        }
      }
    });

    $(document).on("click", "#up-to-top a[href='#top-of-page']", function (e) {
      e.preventDefault();
      window._navLocked = true;
      $("#navigation").addClass("no-transition").removeClass("nav-up scrolled");
      $("html, body").stop().animate({
        scrollTop: 0
      }, 300, function () {
        $("#navigation").removeClass("no-transition nav-up scrolled");
        window._navLocked = false;
      });
    });
  }
});
