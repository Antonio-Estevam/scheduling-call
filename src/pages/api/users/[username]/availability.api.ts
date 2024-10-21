import { prisma } from '@/src/lib/prisma'
import dayjs from 'dayjs'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const username = String(req.query.username)
  const { date } = req.query

  if (!date) {
    return res.status(400).json({ message: 'Date not provided' })
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })

  if (!user) {
    return res.status(400).json({ message: 'User does not exist' })
  }

  const refernceDate = dayjs(String(date))
  const isPastDate = refernceDate.endOf('day').isBefore(new Date())

  if (isPastDate) {
    return res.json({ possibleTimes: [], availabilityTimes: [] })
  }

  const userAvailability = await prisma.userTimeInterval.findFirst({
    where: {
      user_id: user.id,
      week_day: refernceDate.get('day'),
    },
  })

  if (!userAvailability) {
    return res.json({ possibleTimes: [], availabilityTimes: [] })
  }

  // eslint-disable-next-line camelcase
  const { time_start_in_minutes, time_end_in_minutes } = userAvailability

  // eslint-disable-next-line camelcase
  const startHour = time_start_in_minutes / 60
  // eslint-disable-next-line camelcase
  const endHour = time_end_in_minutes / 60

  const possibleTimes = Array.from({ length: endHour - startHour }).map(
    (_, i) => {
      return startHour + i
    },
  )

  const blockedTimes = await prisma.scheduling.findMany({
    select: {
      date: true,
    },
    where: {
      user_id: user.id,
      date: {
        gte: refernceDate.set('hour', startHour).toDate(),
        lte: refernceDate.set('hour', endHour).toDate(),
      },
    },
  })

  const availabilityTimes = possibleTimes.filter((time) => {
    const isTimeBlocked = blockedTimes.some(
      (blockedTimes) => blockedTimes.date.getHours() === time,
    )

    const isTimeInPast = refernceDate.set('hour', time).isBefore(new Date())

    return !isTimeBlocked && !isTimeInPast
  })

  return res.json({
    possibleTimes,
    availabilityTimes,
  })
}
