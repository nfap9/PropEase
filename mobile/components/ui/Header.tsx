import { YStack, Text, styled } from 'tamagui'

export const PageHeader = styled(YStack, {
  backgroundColor: '$primary600',
  paddingTop: 24,
  paddingBottom: 32,
  paddingHorizontal: 20,
  borderBottomLeftRadius: 40,
  borderBottomRightRadius: 40,
})

export const PageTitle = styled(Text, {
  color: 'white',
  fontSize: 24,
  fontWeight: '900',
  marginBottom: 16,
  letterSpacing: -0.5,
})
