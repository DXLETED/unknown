let errors = {
  'rg404': 'Region is incorrect',
  'sum404': 'Summoner not found',
  'notlive': 'Summoner is not in-game. Page refresh automatically after start',
  'auth-01': 'Login is required'
}

export const fetchError = res => {
  if (res.error)
    return errors[res.error]
  else if (res.message)
    return res.message
  else return `Error receiving data from RiotAPI. Code: ${res.status}`
}