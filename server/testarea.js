/*const fs = require('fs')
const sleep = require('./utils/sleep')

;(async() => {
  let data = JSON.parse(await fs.promises.readFile(__dirname + '/testdata/timeline.json', 'utf8'))
  let t = process.hrtime()
  let events = data.frames.flatMap(frame => frame.events)
  //data = data.frames.flatMap(frame => frame.events).filter(el => el.type === 'SKILL_LEVEL_UP')
  let a = []
  let pl = {participantId: 4}
  for (let i = 0; i < 200; i ++) {
    //a = [...a, data.frames.flatMap(frame => frame.events.filter(event => event.killerId === 2).filter(el => el.type === 'CHAMPION_KILL').map(el => el.timestamp))]
    //a = [...a, data.filter(el => el.type === 'CHAMPION_KILL').filter(el => el.assistingParticipantIds.find(pl => pl === 2)).map(el => el.timestamp)]
    a = {
      skillOrder: events.filter(event => event.participantId === pl.participantId).filter(event => event.type === 'SKILL_LEVEL_UP').map(el => el.skillSlot),
      killsTimeline: events.filter(event => event.killerId === pl.participantId).filter(el => el.type === 'CHAMPION_KILL').map(el => el.timestamp),
      assistsTimeline: events.filter(el => el.type === 'CHAMPION_KILL').filter(el => el.assistingParticipantIds.find(pId => pId === pl.participantId)).map(el => el.timestamp),
      deathsTimeline: events.filter(event => event.victimId === pl.participantId).filter(el => el.type === 'CHAMPION_KILL').map(el => el.timestamp),
      itemBuild: events.filter(event => event.participantId === pl.participantId).filter(event => event.type === 'ITEM_PURCHASED').map(el => el.itemId)
    }
  }
  for (let i = 0; i < 800; i ++)
    a = [...a, data.filter(event => event.participantId === 1).map(el => el.skillSlot)]
  console.log(process.hrtime(t), a[0])
  //console.log(a)
  //data.frames.flatMap(frame => frame.events.filter(event => event.participantId === 1).filter(el => el.type === 'SKILL_LEVEL_UP').map(el => el.skillSlot))
})()*/

/*const { parse } = require('node-html-parser')
let a = parse(`<div class="itemset-block__content" data-app-block-id="1"><article class="tile tile--item tile--item--boots tooltip tooltipstered" data-tooltip-content="#tooltip-3117" data-app-name="boots-of-mobility" data-app-id="3117" style="display: block;"><div class="tile__image"><img src="/dist/img/item/3117.png" alt="Boots of Mobility"></div><div class="tile__content"><div class="tile__name"><span class="gold-icon"></span>&nbsp;900</div><div class="tile__title">Boots of Mobility</div></div><input type="hidden" name="itemset[blocks][1][items][]" value="3117"></article><article class="tile tile--item tile--item--boots tooltip tooltipstered" data-tooltip-content="#tooltip-3020" data-app-name="sorcerers-shoes" data-app-id="3020" style="display: block;"><div class="tile__image"><img src="/dist/img/item/3020.png" alt="Sorcerer's Shoes"></div><div class="tile__content"><div class="tile__name"><span class="gold-icon"></span>&nbsp;1100</div><div class="tile__title">Sorcerer's Shoes</div></div><input type="hidden" name="itemset[blocks][1][items][]" value="3020"></article><article class="tile tile--item tile--item--armor tile--item--boots tooltip tooltipstered" data-tooltip-content="#tooltip-3047" data-app-name="ninja-tabi" data-app-id="3047" style="display: block;"><div class="tile__image"><img src="/dist/img/item/3047.png" alt="Ninja Tabi"></div><div class="tile__content"><div class="tile__name"><span class="gold-icon"></span>&nbsp;1100</div><div class="tile__title">Ninja Tabi</div></div><input type="hidden" name="itemset[blocks][1][items][]" value="3047"></article><article class="tile tile--item tile--item--magic-resist tile--item--boots tooltip tooltipstered" data-tooltip-content="#tooltip-3111" data-app-name="mercurys-treads" data-app-id="3111" style="display: block;"><div class="tile__image"><img src="/dist/img/item/3111.png" alt="Mercury's Treads"></div><div class="tile__content"><div class="tile__name"><span class="gold-icon"></span>&nbsp;1100</div><div class="tile__title">Mercury's Treads</div></div><input type="hidden" name="itemset[blocks][1][items][]" value="3111"></article><article class="tile tile--item tile--item--attack-speed tile--item--boots tooltip tooltipstered" data-tooltip-content="#tooltip-3006" data-app-name="berserkers-greaves" data-app-id="3006" style="display: block;"><div class="tile__image"><img src="/dist/img/item/3006.png" alt="Berserker's Greaves"></div><div class="tile__content"><div class="tile__name"><span class="gold-icon"></span>&nbsp;1100</div><div class="tile__title">Berserker's Greaves</div></div><input type="hidden" name="itemset[blocks][1][items][]" value="3006"></article><article class="tile tile--item tile--item--boots tooltip tooltipstered" data-tooltip-content="#tooltip-3009" data-app-name="boots-of-swiftness" data-app-id="3009" style="display: block;"><div class="tile__image"><img src="/dist/img/item/3009.png" alt="Boots of Swiftness"></div><div class="tile__content"><div class="tile__name"><span class="gold-icon"></span>&nbsp;900</div><div class="tile__title">Boots of Swiftness</div></div><input type="hidden" name="itemset[blocks][1][items][]" value="3009"></article><article class="tile tile--item tile--item--cooldown-reduction tile--item--boots tooltip tooltipstered" data-tooltip-content="#tooltip-3158" data-app-name="ionian-boots-of-lucidity" data-app-id="3158" style="display: block;"><div class="tile__image"><img src="/dist/img/item/3158.png" alt="Ionian Boots of Lucidity"></div><div class="tile__content"><div class="tile__name"><span class="gold-icon"></span>&nbsp;900</div><div class="tile__title">Ionian Boots of Lucidity</div></div><input type="hidden" name="itemset[blocks][1][items][]" value="3158"></article></div>`)
console.log(JSON.stringify(a.querySelectorAll('.tile').map(el => parseInt(el.childNodes[2].rawAttrs.slice(-5, -1))).sort()))*/

/*let num = 4.394759345
console.log(parseFloat(num.toFixed(4)))*/

console.log({...undefined, ...{q: 1}})