export const calcVh = data => `calc(var(--vh) * var(--sc) * ${data})`
export const calcRh = data => `${data}vh`
export const cssVh = data => getComputedStyle(document.documentElement).getPropertyValue('--vh') * getComputedStyle(document.documentElement).getPropertyValue('--sc') * data
export const cssRh = data => document.documentElement.clientHeight / 100 * data