let srcs = {
  //champions: 'http://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json',
  champions: '/static/data/en_US/champion.json',
  сhampionLocales: '/static/data/championLocales.json',
  items: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json',
  runes: '/static/json/runesReforged.json',
  championStats: '/api/v1/stats/championsFull'
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