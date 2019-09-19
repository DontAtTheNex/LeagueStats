import { timeDifference, secToTime, getRankImg } from '@/helpers/functions.js'
import { maps, gameModes } from '@/data/data.js'
import summonersJSON from '@/data/summoner.json'

/**
 * Return all the infos about a summoner built with the Riot API data
 * @param {Object} RiotData : all data from the Riot API
 * @param {Object} championsInfos : champions data from the Riot API
 */
export function createSummonerData(RiotData, championsInfos, runesInfos) {
  console.log('--- ALL INFOS ---')
  console.log(RiotData)

  const userStats = RiotData.account
  const soloQStats = RiotData.soloQ
  const matches = RiotData.matchesDetails

  const soloQ = soloQStats ? {} : null
  if (soloQ) {
    soloQ.rank = `${soloQStats.tier} ${soloQStats.rank}`
    soloQ.rankImgLink = getRankImg(soloQStats)
    soloQ.wins = soloQStats.wins
    soloQ.losses = soloQStats.losses
    soloQ.winrate = +(soloQ.wins * 100 / (soloQ.wins + soloQ.losses)).toFixed(1) + '%'
    soloQ.lp = soloQStats.leaguePoints
  }

  const matchesInfos = []
  // Loop on all matches
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i]
    const participantId = currentMatch.participantIdentities.find((p) => p.player.currentAccountId === userStats.accountId).participantId
    const player = currentMatch.participants[participantId - 1]
    const teamId = player.teamId

    let win = currentMatch.teams.find((t) => t.teamId === teamId).win

    // Match less than 5min
    if (currentMatch.gameDuration < 300) {
      win = 'Remake'
    }

    const map = maps[currentMatch.mapId]
    let mode = gameModes[currentMatch.queueId]
    if (!mode)
      mode = 'Undefined gamemode'
    const champion = Object.entries(championsInfos).find(([, champion]) => Number(champion.key) === player.championId)[0]

    let role = player.timeline.lane
    if(role === 'BOTTOM') {
      if(player.timeline.role.includes('SUPPORT')) {
        role = 'SUPPORT'
      } else {
        role = 'BOTTOM'
      }
    }

    const timeAgo = timeDifference(currentMatch.gameCreation)
    const time = secToTime(currentMatch.gameDuration)
    const kills = player.stats.kills
    const deaths = player.stats.deaths
    const assists = player.stats.assists
    const kda = +(deaths === 0 ? 0 : ((kills + assists) / deaths)).toFixed(2)
    const level = player.stats.champLevel
    const damage = +(player.stats.totalDamageDealtToChampions / 1000).toFixed(1) + 'k'

    const primaryRuneCategory = runesInfos.find(r => r.id === player.stats.perkPrimaryStyle)
    let primaryRune
    for (const subCat of primaryRuneCategory.slots) {
      primaryRune = subCat.runes.find(r => r.id === player.stats.perk0)
      if (primaryRune) {
        break
      }
    }
    primaryRune = `https://ddragon.leagueoflegends.com/cdn/img/${primaryRune.icon}`
    let secondaryRune = runesInfos.find(r => r.id === player.stats.perkSubStyle)
    secondaryRune = `https://ddragon.leagueoflegends.com/cdn/img/${secondaryRune.icon}`


    const totalKills = currentMatch.participants.reduce((prev, current) => {
      if (current.teamId !== teamId) {
        return prev
      }
      return prev + current.stats.kills
    }, 0)
    const kp = +((kills + assists) * 100 / totalKills).toFixed(1) + '%'

    const items = []
    for (let i = 0; i < 6; i++) {
      const currentItem = 'item' + i
      items.push(getItemLink(player.stats[currentItem]))
    }

    const gold = +(player.stats.goldEarned / 1000).toFixed(1) + 'k'
    const minions = player.stats.totalMinionsKilled + player.stats.neutralMinionsKilled

    const firstSum = player.spell1Id
    const secondSum = player.spell2Id

    matchesInfos.push({
      result: win,
      map: map,
      gamemode: mode,
      champ: champion,
      role: role,
      primaryRune,
      secondaryRune,
      date: timeAgo,
      time: time,
      kills: kills,
      deaths: deaths,
      assists: assists,
      kda,
      level: level,
      damage,
      kp,
      items: items,
      gold: gold,
      minions: minions,
      firstSum: getSummonerLink(firstSum),
      secondSum: getSummonerLink(secondSum)
    })
  } // end loop matches
  console.log('matches infos just below')
  console.log(matchesInfos)

  return {
    accountId: userStats.accountId,
    allMatches: RiotData.allMatches,
    matches: matchesInfos,
    profileIconId: userStats.profileIconId,
    name: userStats.name,
    level: userStats.summonerLevel,
    soloQ,
  }
}

function getItemLink(id) {
  if(id === 0) {
    return null
  }
  return `url('https://ddragon.leagueoflegends.com/cdn/${process.env.VUE_APP_PATCH}/img/item/${id}.png')`
}

function getSummonerLink(id) {
  const spellName = Object.entries(summonersJSON.data).find(([, spell]) => Number(spell.key) === id)[0]
  return `https://ddragon.leagueoflegends.com/cdn/${process.env.VUE_APP_PATCH}/img/spell/${spellName}.png`
}
