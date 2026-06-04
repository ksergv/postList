(function () {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", function () {
    var refreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (refreshing) {
        return;
      }
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("service-worker.js")
      .then(function (registration) {
        registration.update();
      })
      .catch(function (error) {
        console.warn("Service worker registration failed", error);
      });
  });
})();
