import { Component, ReactNode } from 'react'
import { View } from '@tarojs/components'
import './app.scss'

type AppProps = {
  children?: ReactNode
}

class App extends Component<AppProps> {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return (
      <View className="app-container">
        {this.props.children}
      </View>
    )
  }
}

export default App
