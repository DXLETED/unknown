const fs = require('fs')

module.exports = async () => {
  let languages = require('../static/data/languages')
  let champions = Object.fromEntries(await Promise.all(languages.map(lang => fs.existsSync(__dirname + `/../static/data/${lang}/champion.json`) ? new Promise(async res => res([lang, await fs.promises.readFile(__dirname + `/../static/data/${lang}/champion.json`, 'utf8')])) : [])))
  champions = Object.fromEntries(Object.entries(champions).filter(([lang, champs]) => champs).map(([lang, champs]) => [lang, JSON.parse(champs).data]))
  champions = Object.fromEntries(Object.values(champions.en_US).map(champ => [champ.key, Object.values(champions).map(champs => champs[champ.id].name)]))
  await fs.promises.writeFile(__dirname + '/../static/data/championLocals.json', JSON.stringify(champions))
  champions = Object.fromEntries(await Promise.all(languages.map(lang => fs.existsSync(__dirname + `/../static/data/${lang}/championFull.json`) ? new Promise(async res => res([lang, await fs.promises.readFile(__dirname + `/../static/data/${lang}/championFull.json`, 'utf8')])) : [])))
  champions = Object.fromEntries(Object.entries(champions).filter(([lang, champs]) => champs).map(([lang, champs]) => [lang, Object.fromEntries(Object.entries(JSON.parse(champs).data).map(([champId, c]) => [parseInt(c.key), {
      key: c.key,
      id: c.id,
      name: c.name,
      image: c.image,
      tags: c.tags,
      info: c.info,
      stats: c.stats,
      spells: c.spells.map(spell => {
        delete spell.tooltip
        delete spell.leveltip
        return spell
      }),
      passive: c.passive
    }]))]
  ))
  await Promise.all(Object.entries(champions).map(async ([lang, data]) => fs.promises.writeFile(__dirname + `/../static/data/${lang}/champions.json`, JSON.stringify(data))))
  let loadList = {
    images: [
      '/static/img/pattern.png',
      '/static/img/done.png',
      '/static/img/banned-wh.png',
      '/static/img/cs.png',
      '/static/img/star-wh.png',
      '/static/img/ward.png',
      '/static/img/arrow/white_down.png',
      '/static/img/arrow/white_right.png',
      '/static/img/arrow/white_up.png',
      '/static/img/header/language.png',
      '/static/img/header/menu_white.png',
      '/static/img/header/settings_white.png'
    ],
    assets: {
      champions: '/static/data/en_US/champions.json',
      championLocales: '/static/data/championLocales.json',
      items: '/static/data/en_US/item.json',
      runes: '/static/json/runesReforged.json',
      championStats: '/api/v1/stats/championsFull'
    }
  }
  fs.promises.writeFile(__dirname + '/../static/data/loadList.json', JSON.stringify(loadList))
}