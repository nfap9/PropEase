import { Button as TamaguiButton, styled } from 'tamagui'

export const PrimaryButton = styled(TamaguiButton, {
  backgroundColor: '$primary600',
  borderRadius: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
})

export const SecondaryButton = styled(TamaguiButton, {
  backgroundColor: 'transparent',
  borderRadius: '$3',
  borderWidth: 1,
  borderColor: '$primary600',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
})

export const DangerButton = styled(TamaguiButton, {
  backgroundColor: '$danger600',
  borderRadius: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
})
