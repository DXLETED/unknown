export const queues = (queueId => {
  switch(queueId) {
    case 400:
      return 'Normal | Draft pick'
    case 420:
      return 'Ranked | Solo/Duo'
    case 440:
      return 'Ranked | Flex'
    case 450:
      return 'ARAM'
    case 900:
      return 'URF'
    default:
      return 'Event'
  }
})