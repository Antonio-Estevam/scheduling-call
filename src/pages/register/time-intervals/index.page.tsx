/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Heading,
  Text,
  MultiStep,
  Button,
  Checkbox,
  TextInput,
} from '@ignite-ui/react'
import { Container, Header } from '../styles'
import {
  FormError,
  IntervalBox,
  IntervalContainner,
  IntervalDay,
  IntervalInputs,
  IntervalItem,
} from './styles'
import { ArrowRight } from 'phosphor-react'
import { Controller, Form, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { getWeekDays } from '@/src/utils/get-week-day'
import { zodResolver } from '@hookform/resolvers/zod'
import { convertTimesStringToMinutes } from '../../../utils/convert-times-string-to-minutes'
import { api } from '@/src/lib/axios'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
const timeIntervalsFormSchema = z.object({
  intervals: z
    .array(
      z.object({
        weekDay: z.number().min(0).max(6),
        enabled: z.boolean(),
        startTime: z.string(),
        endTime: z.string(),
      }),
    )
    .length(7)
    .transform((intervals) => intervals.filter((interval) => interval.enabled))
    .refine((intervals) => intervals.length > 0, {
      message: 'Você precisa selecionar pelo menos um dia da semana!',
    })
    .transform((intervals) => {
      return intervals.map((interval) => {
        return {
          weekDay: interval.weekDay,
          startTimeInMinutes: convertTimesStringToMinutes(interval.startTime),
          endTimeInMinutes: convertTimesStringToMinutes(interval.endTime),
        }
      })
    })
    .refine(
      (intervals) => {
        return intervals.every(
          (interval) =>
            interval.endTimeInMinutes - 30 >= interval.startTimeInMinutes,
        )
      },
      {
        message:
          'O horário de termino deve ser pelo menos meia hora distante do início!',
      },
    ),
})

type TimeIntervalsFormInput = z.input<typeof timeIntervalsFormSchema>
type TimeIntervalsFormOutput = z.output<typeof timeIntervalsFormSchema>

export default function TimeIntervals() {
  const {
    register,
    control,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<TimeIntervalsFormInput>({
    resolver: zodResolver(timeIntervalsFormSchema),
    defaultValues: {
      intervals: [
        { weekDay: 0, enabled: false, startTime: '08:00', endTime: '18:00' },
        { weekDay: 1, enabled: true, startTime: '08:00', endTime: '18:00' },
        { weekDay: 2, enabled: true, startTime: '08:00', endTime: '18:00' },
        { weekDay: 3, enabled: true, startTime: '08:00', endTime: '18:00' },
        { weekDay: 4, enabled: true, startTime: '08:00', endTime: '18:00' },
        { weekDay: 5, enabled: true, startTime: '08:00', endTime: '18:00' },
        { weekDay: 6, enabled: false, startTime: '08:00', endTime: '18:00' },
      ],
    },
  })
  const router = useRouter()

  const weekDays = getWeekDays()

  const { fields } = useFieldArray({
    control,
    name: 'intervals',
  })
  const intervals = watch('intervals')
  async function handleSetTimeIntervals(data: any) {
    const { intervals } = data as TimeIntervalsFormOutput

    await api.post('/users/time-intervals', {
      intervals,
    })

    await router.push('/register/update-profile')
  }
  return (
    <>
      <NextSeo title="Selecione sua disponibilidade | Scaduling" noindex />

      <Container>
        <Header>
          <Heading as="strong">Quase lá</Heading>
          <Text>
            Defina o intervalo de horários que você está disponível em cada dia
            da semana.
          </Text>

          <MultiStep size={4} currentStep={3} />
        </Header>
        <Form
          control={control}
          onSubmit={({ data }) => handleSetTimeIntervals(data)}
        >
          <IntervalBox>
            <IntervalContainner>
              {fields.map((field, index) => {
                return (
                  <IntervalItem key={field.id}>
                    <IntervalDay>
                      <Controller
                        name={`intervals.${index}.enabled`}
                        control={control}
                        render={({ field }) => {
                          return (
                            <Checkbox
                              onCheckedChange={(checked) => {
                                field.onChange(checked === true)
                              }}
                              checked={field.value}
                            />
                          )
                        }}
                      />
                      <Text>{weekDays[field.weekDay]}</Text>
                    </IntervalDay>
                    <IntervalInputs>
                      <TextInput
                        crossOrigin={undefined}
                        onPointerEnterCapture={undefined}
                        onPointerLeaveCapture={undefined}
                        size="sm"
                        type="time"
                        step={60}
                        disabled={intervals[index].enabled === false}
                        {...register(`intervals.${index}.startTime`)}
                      />
                      <TextInput
                        crossOrigin={undefined}
                        onPointerEnterCapture={undefined}
                        onPointerLeaveCapture={undefined}
                        size="sm"
                        type="time"
                        step={60}
                        disabled={intervals[index].enabled === false}
                        {...register(`intervals.${index}.endTime`)}
                      />
                    </IntervalInputs>
                  </IntervalItem>
                )
              })}
            </IntervalContainner>
            {errors.intervals && (
              <FormError size="sm">{errors.intervals.root?.message}</FormError>
            )}
            <Button type="submit" disabled={isSubmitting}>
              Próximo passo
              <ArrowRight />
            </Button>
          </IntervalBox>
        </Form>
      </Container>
    </>
  )
}
