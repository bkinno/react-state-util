/**
 * Set globalState using function setGlobalState
 * @param WrappedComponent
 * @param debug: print out call stack when setGlobalState is called
 *
 * In wrapped component: just use this.globalState.varName
 * by get value from globalState, we add watcher automatically to component
 * and component will re-render only when this varName is changed from globalState
 *
 * For changing global state: use this.setGlobalState, everything just work like this.setState
 */

let _components = [];
let _globalState = {};


let printCallStack = () => {
    let stack = new Error().stack;
    console.log('DEBUG:', stack);
};


let _propagateGlobalState = async function(newState, currentContext, listenners, globalState) {
    let updatedAttrs = Object.keys(newState);

    // If value is Promise then we have to wait for having value
    let _update = new Promise(resolve => {
        updatedAttrs.forEach(async (attr) => {
            let newVal = newState[attr];
            if (typeof (newVal) === 'object' && 'then' in newVal) {
                newVal = await newVal;
            }

            currentContext.globalState[attr] = newVal;
            resolve();
        });
    });

    // Wait for all value updated
    await _update;

    // Update only component which listens to updated attr
    listenners.forEach(listennerContext => {
        let shouldUpdate = false;

        updatedAttrs.forEach(attr => {
            if (listennerContext._global.has(attr)) {
                shouldUpdate = true;
            }
        });

        shouldUpdate && listennerContext.forceUpdate();
    });
};


export function connectGlobalState(WrappedComponent, debug=false) {
    return class ConnectedGlobalState extends WrappedComponent {
        // Do not use array function, use 'function' instead for having 'this' pointing to WrappedComponent
        setGlobalState(newState, debug=debug) {
            debug && printCallStack();
            _propagateGlobalState(newState, this, _components, _globalState);
        };

        componentWillMount() {
            let component = this;
            component._uid = Math.random();

            component._global = new Set();

            component.globalState = new Proxy({}, {
                get: (target, name) => {
                    if (name === '_all') {
                        return _globalState;
                    }

                    component._global.add(name);
                    return _globalState[name];
                },
                set: (target, name, value) => {
                    component._global.add(name);
                    _globalState[name] = value;
                    return true;
                }
            });
            _components.push(component);

            // Call parent lifecycle
            if (super.componentWillMount) {
                super.componentWillMount();
            }
        };

        render = super.render;
    };
}
