import { YStack, styled } from 'tamagui'

export const Card = styled(YStack, {
  backgroundColor: '$surface',
  borderRadius: '$4',
  padding: '$3',
  borderWidth: 1,
  borderColor: '$borderLight',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
})
