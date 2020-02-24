let srcs = {
  items: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json'
}

let assets = {}
const cpl = new Promise(resolve => {
  Promise.all(Object.keys(srcs).map(el => {
      return fetch(srcs[el])
        .then(res => res.json())
        .then(res => assets[el] = res)
    })
  ).then(resolve)
})
export default assets
export { cpl }