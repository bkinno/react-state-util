# react-state-util
Add global state to React (like root style in AngularJS but keep the React philosophie)

# ConnectGlobalState
Usage
  - Connect Component to state global
  ```sh
    class App extends Component {
        render() {
            return (
                <div>
                    <h3>App Component</h3>
                    <button onClick={ ()=>this.setGlobalState({name:'Huan Nguyen'}) }>Change Name</button>
                    <div>Hello {this.globalState.name || 'Phong' }</div>
                </div>
            );
        }
    }

    export default connectGlobalState(App);
  ```
  - Set state global ```this.setGlobalState({ [stateName]:[stateValue] })```
  ```sh
   this.setGlobalState({name:'Bob'})
  ```
  - Get state global ```this.globalState.[stateName]```
  ```sh
  this.globalState.name //Bob
  ```
