(function () {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js").catch(function (error) {
      console.warn("Service worker registration failed", error);
    });
  });
})();
