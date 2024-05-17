const btnEl = document.querySelector(".btn");
const closeIconEl = document.querySelector(".close-icon");
const trailerContainerEl = document.querySelector(".trailer-container");
const videoEl = document.querySelector("video");
let pausedTime = 0;

btnEl.addEventListener("click", () => {
  trailerContainerEl.classList.remove("active");
});

closeIconEl.addEventListener("click", () => {
  trailerContainerEl.classList.add("active");
  if (!videoEl.paused) {
    pausedTime = videoEl.currentTime;
    videoEl.pause();
  }
});

videoEl.addEventListener("play", () => {
  if (pausedTime !== 0) {
    videoEl.currentTime = pausedTime;
    pausedTime = 0;
  }
});

videoEl.addEventListener("pause", () => {
  pausedTime = videoEl.currentTime;
});
