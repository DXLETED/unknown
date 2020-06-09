import { DIVISIONS } from '../constants/divisions'

export const intTiers = {
  'IRON': 400,
  'BRONZE': 800,
  'SILVER': 1200,
  'GOLD': 1600,
  'PLATINUM': 2000,
  'DIAMOND': 2400,
  'MASTER': 2800,
  'GRANDMASTER': 2800,
  'CHALLENGER': 2800
}

export const intDivisions = {
  'IV': 0,
  'III': 100,
  'II': 200,
  'I': 300
}

export const intLeague = (tier, rank, lp) => tier in intTiers ? (intTiers[tier] + (rank in intDivisions ? intDivisions[rank] : 0) + lp) : 0
export const intRank = (tier, rank) => tier in intTiers ? (intTiers[tier] + (rank in intDivisions ? intDivisions[rank] : 0)) : 0
export const strTier = int => Object.keys(intTiers).find((el, i) => Object.values(intTiers)[i] <= int && (Object.values(intTiers)[i + 1] ? Object.values(intTiers)[i + 1] > int : true))