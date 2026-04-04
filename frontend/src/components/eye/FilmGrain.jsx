import { useEffect } from 'react'

export default function FilmGrain() {
  useEffect(() => {
    if (document.getElementById('noise-overlay')) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 200
    canvas.height = 200

    const imageData = ctx.createImageData(200, 200)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() > 0.5 ? 255 : 0
      data[i]     = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = 10
    }

    ctx.putImageData(imageData, 0, 0)

    const overlay = document.createElement('div')
    overlay.id = 'noise-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      pointer-events: none;
      z-index: 10000;
      opacity: 0.4;
      background-image: url(${canvas.toDataURL('image/png')});
      background-repeat: repeat;
    `
    document.body.appendChild(overlay)

    return () => {
      document.getElementById('noise-overlay')?.remove()
    }
  }, [])

  return null
}
