// Laadt het YouTube IFrame Player API-script één keer en geeft window.YT terug.
let apiPromise = null

export function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT)
  }
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        apiPromise = null
        reject(new Error('YouTube API kon niet worden geladen'))
      }, 10000)

      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout)
        if (typeof previous === 'function') previous()
        resolve(window.YT)
      }

      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.onerror = () => {
        clearTimeout(timeout)
        apiPromise = null
        reject(new Error('YouTube API kon niet worden geladen'))
      }
      document.head.appendChild(tag)
    })
  }
  return apiPromise
}
