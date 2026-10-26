import {createNetworkSurface} from './network-surface.js';
let renderer;
self.onmessage=({data})=>{
 if(data.type==='init'){renderer=createNetworkSurface(data.canvas);return}
 if(data.type==='reset'){renderer?.reset();return}
 if(data.type==='paint'){const start=performance.now(),result=renderer.paint(data.state);result.drawMs=performance.now()-start;self.postMessage({state:data.state,result,generation:data.generation,id:data.id})}
};
