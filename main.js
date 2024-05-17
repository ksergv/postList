// Filter Js
$(document).ready(function () {
  $(".filter-item").click(function () {
    const value = $(this).attr("data-filter");
    if (value == "all") {
      $("li").show("1000");
    } else {
      $("li")
        .not("." + value)
        .hide("1000");
      $("li")
        .filter("." + value)
        .show("1000");
    }
  });
  // Add active to btn
  $(".filter-item").click(function () {
    $(this).addClass("active-filter").siblings().removeClass("active-filter");
  });
});
// Header BackGround Change On Scroll
let header = document.querySelector("header");

window.addEventListener("scroll", () => {
  header.classList.toggle("shadow", window.scrollY > 0);
});
