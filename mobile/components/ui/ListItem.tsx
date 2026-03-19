import { XStack, Text, styled } from 'tamagui'

export const ListItem = styled(XStack, {
  backgroundColor: '$surface',
  borderRadius: '$4',
  padding: '$3',
  borderWidth: 1,
  borderColor: '$borderLight',
  alignItems: 'center',
})

export const ListItemText = styled(Text, {
  color: '$textPrimary',
  fontSize: 14,
  fontWeight: '600',
})
