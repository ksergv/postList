function getPageList(totalPages, page, maxLength) {
  function range(start, end) {
    return Array.from(Array(end - start + 1), (_, i) => i + start);
  }

  var sideWidth = maxLength < 9 ? 1 : 2;
  var leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
  var rightWidth = (maxLength - sideWidth * 2 - 3) >> 1;

  if (totalPages <= maxLength) {
    return range(1, totalPages);
  }

  if (page <= maxLength - sideWidth - 1 - rightWidth) {
    return range(1, maxLength - sideWidth - 1).concat(0, range(totalPages - sideWidth + 1, totalPages));
  }

  if (page >= totalPages - sideWidth - 1 - rightWidth) {
    return range(1, sideWidth).concat(0, range(totalPages - sideWidth - 1 - rightWidth - leftWidth, totalPages));
  }

  return range(1, sideWidth).concat(0, range(page - leftWidth, page + rightWidth), 0, range(totalPages - sideWidth + 1, totalPages));
}

$(function () {
  var limitPerPage = 6; // How many card items visible per a page
  var paginationSize = 7; // How many page elements visible in the pagination
  var currentPage = 1;

  function showPage(whichPage, filteredCards) {
    if (whichPage < 1 || whichPage > totalPages) return false;

    currentPage = whichPage;

    filteredCards.hide();
    filteredCards.slice((currentPage - 1) * limitPerPage, currentPage * limitPerPage).show();

    $(".pagination li").slice(1, -1).remove();

    getPageList(totalPages, currentPage, paginationSize).forEach(item => {
      $("<li>").addClass("page-item").addClass(item ? "current-page" : "dots")
        .toggleClass("active", item === currentPage).append($("<a>").addClass("page-link")
          .attr({ href: "javascript:void(0)" }).text(item || "...")).insertBefore(".next-page");
    });

    $(".previous-page").toggleClass("disable", currentPage === 1);
    $(".next-page").toggleClass("disable", currentPage === totalPages);
    return true;
  }

  function updatePagination(filteredCards) {
    var numberOfItems = filteredCards.length;
    totalPages = Math.ceil(numberOfItems / limitPerPage);
    showPage(1, filteredCards);
  }

  function initializeFilters() {
    $(".filter-item").off('click').on('click', function () {
      const scope = $(this).attr("data-filter");
      var filteredCards;
      
      if (scope === "all") {
        filteredCards = $("#postList .card");
      } else {
        filteredCards = $("#postList .card").filter("." + scope);
      }

      $("#postList .card").hide();
      filteredCards.show();

      $(this).addClass("active-filter").siblings().removeClass("active-filter");
      updatePagination(filteredCards); // обновление пагинации при применении фильтра
    });
  }

  $(".pagination").append(
    $("<li>").addClass("page-item").addClass("previous-page").append($("<a>").addClass("page-link").attr({ href: "javascript:void(0)" }).text("Prev")),
    $("<li>").addClass("page-item").addClass("next-page").append($("<a>").addClass("page-link").attr({ href: "javascript:void(0)" }).text("Next"))
  );

  $(document).on("contentLoaded", function () {
    var filteredCards = $("#postList .card");
    updatePagination(filteredCards);
    $(".card-content").show();

    initializeFilters();
  });

  $(document).on("click", ".pagination li.current-page:not(.active)", function () {
    var scope = $(".filter-item.active-filter").data("filter");
    var filteredCards = scope === "all" ? $("#postList .card") : $("#postList .card").filter("." + scope);
    return showPage(+$(this).text(), filteredCards);
  });

  $(".next-page").on("click", function () {
    var scope = $(".filter-item.active-filter").data("filter");
    var filteredCards = scope === "all" ? $("#postList .card") : $("#postList .card").filter("." + scope);
    return showPage(currentPage + 1, filteredCards);
  });

  $(".previous-page").on("click", function () {
    var scope = $(".filter-item.active-filter").data("filter");
    var filteredCards = scope === "all" ? $("#postList .card") : $("#postList .card").filter("." + scope);
    return showPage(currentPage - 1, filteredCards);
  });

  $(document).trigger("contentLoaded");
});
